import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { isValidSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { sendProposalEmail } from "@/lib/email";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function describeEmailError(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return "Unknown email delivery error — check server logs.";
}

export async function POST(
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
    const { data: proposal, error: findError } = await supabaseAdmin
      .from("Proposal")
      .select("id, status, clientName, clientEmail, companyName")
      .eq("id", uuid)
      .maybeSingle();

    if (findError) throw findError;
    if (!proposal) {
      return NextResponse.json({ error: "Proposal not found." }, { status: 404 });
    }

    if (proposal.status !== "Draft") {
      return NextResponse.json(
        { error: "Only draft proposals can be sent." },
        { status: 409 },
      );
    }

    const proposalUrl = new URL(`/proposals/${proposal.id}`, request.url).toString();
    const result = await sendProposalEmail({
      clientName: proposal.clientName,
      clientEmail: proposal.clientEmail,
      proposalUrl,
      companyName: proposal.companyName,
    });

    const { error: updateError } = await supabaseAdmin
      .from("Proposal")
      .update({ status: "Sent", updatedAt: new Date().toISOString() })
      .eq("id", proposal.id);

    if (updateError) throw updateError;

    return NextResponse.json(
      {
        success: true,
        emailSent: result.success,
        // Surfaced in the admin UI so a delivery failure (bad/missing API
        // key, unverified sender domain, provider outage, etc.) is
        // diagnosable from the dashboard instead of only server logs.
        emailError: result.success ? undefined : describeEmailError(result.error),
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("Failed to send proposal:", err);
    return NextResponse.json(
      { error: "Something went wrong, please try again." },
      { status: 500 },
    );
  }
}
