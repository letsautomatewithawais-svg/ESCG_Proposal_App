import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { isValidSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendProposalEmail } from "@/lib/email";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
    const proposal = await prisma.proposal.findUnique({
      where: { id: uuid },
      select: {
        id: true,
        status: true,
        clientName: true,
        clientEmail: true,
        companyName: true,
      },
    });

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

    await prisma.proposal.update({
      where: { id: proposal.id },
      data: { status: "Sent" },
    });

    return NextResponse.json({ success: true, emailSent: result.success }, { status: 200 });
  } catch (err) {
    console.error("Failed to send proposal:", err);
    return NextResponse.json(
      { error: "Something went wrong, please try again." },
      { status: 500 },
    );
  }
}
