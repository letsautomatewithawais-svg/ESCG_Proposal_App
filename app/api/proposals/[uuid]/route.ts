import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { isValidSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { utcIso } from "@/lib/dates";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const VALID_STATUSES = ["Draft", "Sent", "Opened", "Signed", "Lost"] as const;
type ProposalStatus = (typeof VALID_STATUSES)[number];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isValidStatus(value: unknown): value is ProposalStatus {
  return typeof value === "string" && (VALID_STATUSES as readonly string[]).includes(value);
}

// Powers ProposalDetailPanel's client-side fetch — selecting a proposal in
// the admin workspace updates a URL param and fetches this instead of
// navigating to a new route, so the list panel never unmounts/reloads.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ uuid: string }> },
) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!isValidSessionToken(token)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { uuid } = await params;
  if (!UUID_PATTERN.test(uuid)) {
    return NextResponse.json({ error: "Proposal not found." }, { status: 404 });
  }

  const { data: proposal, error: proposalError } = await supabaseAdmin
    .from("Proposal")
    .select("*")
    .eq("id", uuid)
    .maybeSingle();

  if (proposalError) {
    console.error("Failed to load proposal:", proposalError);
    return NextResponse.json(
      { error: "Something went wrong, please try again." },
      { status: 500 },
    );
  }
  if (!proposal) {
    return NextResponse.json({ error: "Proposal not found." }, { status: 404 });
  }

  const [
    { data: signature, error: signatureError },
    { data: proposalView, error: viewError },
    { data: sectionViews, error: sectionsError },
    { data: visits, error: visitsError },
  ] = await Promise.all([
    supabaseAdmin
      .from("Signature")
      .select("typedName, signedAt, signatureImage")
      .eq("proposalId", uuid)
      .maybeSingle(),
    supabaseAdmin
      .from("ProposalView")
      .select("firstOpenAt, totalSeconds, openCount")
      .eq("proposalId", uuid)
      .maybeSingle(),
    supabaseAdmin
      .from("SectionView")
      .select("sectionName, firstViewedAt, totalSeconds")
      .eq("proposalId", uuid),
    supabaseAdmin
      .from("ProposalVisit")
      .select("id, startedAt, totalSeconds")
      .eq("proposalId", uuid)
      .order("startedAt", { ascending: false })
      .limit(50),
  ]);

  if (signatureError || viewError || sectionsError || visitsError) {
    console.error(
      "Failed to load proposal detail:",
      signatureError ?? viewError ?? sectionsError ?? visitsError,
    );
    return NextResponse.json(
      { error: "Something went wrong, please try again." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    proposal: {
      ...proposal,
      walkThroughDate: utcIso(proposal.walkThroughDate),
      createdAt: utcIso(proposal.createdAt),
      updatedAt: utcIso(proposal.updatedAt),
    },
    signature: signature
      ? { ...signature, signedAt: utcIso(signature.signedAt) }
      : null,
    proposalView: proposalView
      ? { ...proposalView, firstOpenAt: utcIso(proposalView.firstOpenAt) }
      : null,
    sectionViews: (sectionViews ?? []).map((sectionView) => ({
      ...sectionView,
      firstViewedAt: utcIso(sectionView.firstViewedAt),
    })),
    visits: (visits ?? []).map((visit) => ({
      ...visit,
      startedAt: utcIso(visit.startedAt),
    })),
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ uuid: string }> },
) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!isValidSessionToken(token)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { uuid } = await params;
  if (!UUID_PATTERN.test(uuid)) {
    return NextResponse.json({ error: "Proposal not found." }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const status = isRecord(body) ? body.status : undefined;
  if (!isValidStatus(status)) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  try {
    const { data: existing, error: findError } = await supabaseAdmin
      .from("Proposal")
      .select("id")
      .eq("id", uuid)
      .maybeSingle();

    if (findError) throw findError;
    if (!existing) {
      return NextResponse.json({ error: "Proposal not found." }, { status: 404 });
    }

    // A signed proposal has a real signature on file — moving it to any
    // other status here would leave the status pill and the signature
    // permanently out of sync (no UI currently does this, but the endpoint
    // itself shouldn't allow it either).
    if (status !== "Signed") {
      const { data: signature, error: signatureError } = await supabaseAdmin
        .from("Signature")
        .select("id")
        .eq("proposalId", uuid)
        .maybeSingle();
      if (signatureError) throw signatureError;
      if (signature) {
        return NextResponse.json(
          { error: "This proposal has already been signed and its status cannot be changed." },
          { status: 409 },
        );
      }
    }

    const { error: updateError } = await supabaseAdmin
      .from("Proposal")
      .update({ status, updatedAt: new Date().toISOString() })
      .eq("id", uuid);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("Failed to update proposal status:", err);
    return NextResponse.json(
      { error: "Something went wrong, please try again." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ uuid: string }> },
) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!isValidSessionToken(token)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { uuid } = await params;
  if (!UUID_PATTERN.test(uuid)) {
    return NextResponse.json({ error: "Proposal not found." }, { status: 404 });
  }

  try {
    const { data: existing, error: findError } = await supabaseAdmin
      .from("Proposal")
      .select("id")
      .eq("id", uuid)
      .maybeSingle();

    if (findError) throw findError;
    if (!existing) {
      return NextResponse.json({ error: "Proposal not found." }, { status: 404 });
    }

    // Foreign keys are ON DELETE RESTRICT, not CASCADE — children must go first.
    const { error: sectionViewError } = await supabaseAdmin
      .from("SectionView")
      .delete()
      .eq("proposalId", uuid);
    if (sectionViewError) throw sectionViewError;

    const { error: proposalVisitError } = await supabaseAdmin
      .from("ProposalVisit")
      .delete()
      .eq("proposalId", uuid);
    if (proposalVisitError) throw proposalVisitError;

    const { error: proposalViewError } = await supabaseAdmin
      .from("ProposalView")
      .delete()
      .eq("proposalId", uuid);
    if (proposalViewError) throw proposalViewError;

    const { error: signatureError } = await supabaseAdmin
      .from("Signature")
      .delete()
      .eq("proposalId", uuid);
    if (signatureError) throw signatureError;

    const { error: proposalError } = await supabaseAdmin
      .from("Proposal")
      .delete()
      .eq("id", uuid);
    if (proposalError) throw proposalError;

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("Failed to delete proposal:", err);
    return NextResponse.json(
      { error: "Something went wrong, please try again." },
      { status: 500 },
    );
  }
}
