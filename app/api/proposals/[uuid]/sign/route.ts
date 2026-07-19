import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { supabaseAdmin } from "@/lib/supabase";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MIN_SIGNATURE_LENGTH = 100;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ uuid: string }> },
) {
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

  if (!isRecord(body)) {
    return NextResponse.json(
      { error: "Request body must be a JSON object." },
      { status: 400 },
    );
  }

  const signatureImage = typeof body.signatureImage === "string" ? body.signatureImage : "";
  const typedName = typeof body.typedName === "string" ? body.typedName.trim() : "";
  const signedAtRaw = typeof body.signedAt === "string" ? body.signedAt : "";

  if (!typedName) {
    return NextResponse.json({ error: "Typed name is required." }, { status: 400 });
  }

  if (
    !signatureImage.startsWith("data:image/png;base64,") ||
    signatureImage.length < MIN_SIGNATURE_LENGTH
  ) {
    return NextResponse.json({ error: "A signature is required." }, { status: 400 });
  }

  const signedAt =
    signedAtRaw && !Number.isNaN(Date.parse(signedAtRaw)) ? new Date(signedAtRaw) : new Date();

  try {
    const { data: proposal, error: findError } = await supabaseAdmin
      .from("Proposal")
      .select("id, status")
      .eq("id", uuid)
      .maybeSingle();

    if (findError) throw findError;
    if (!proposal) {
      return NextResponse.json({ error: "Proposal not found." }, { status: 404 });
    }

    if (proposal.status === "Signed") {
      return NextResponse.json(
        { error: "This proposal has already been signed." },
        { status: 409 },
      );
    }

    const ipAddress = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;

    const { error: signatureError } = await supabaseAdmin.from("Signature").insert({
      id: uuidv4(),
      proposalId: proposal.id,
      signatureImage,
      typedName,
      signedAt: signedAt.toISOString(),
      ipAddress,
    });
    if (signatureError) throw signatureError;

    // A completed signature is unambiguous proof the Signature Block section
    // was seen and interacted with — guarantee it's recorded as viewed
    // regardless of whatever the client-side scroll/visibility tracking did
    // or didn't manage to detect. ignoreDuplicates means this is a no-op if
    // that tracking already recorded it (doesn't touch its real totalSeconds).
    const { error: sectionViewError } = await supabaseAdmin.from("SectionView").upsert(
      {
        id: uuidv4(),
        proposalId: proposal.id,
        sectionName: "Signature Block",
        firstViewedAt: signedAt.toISOString(),
      },
      { onConflict: "proposalId,sectionName", ignoreDuplicates: true },
    );
    if (sectionViewError) throw sectionViewError;

    const { error: updateError } = await supabaseAdmin
      .from("Proposal")
      .update({ status: "Signed", updatedAt: new Date().toISOString() })
      .eq("id", proposal.id);
    if (updateError) throw updateError;

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("Failed to save signature:", err);
    return NextResponse.json(
      { error: "Something went wrong, please try again." },
      { status: 500 },
    );
  }
}
