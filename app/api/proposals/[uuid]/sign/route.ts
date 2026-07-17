import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
    const proposal = await prisma.proposal.findUnique({
      where: { id: uuid },
      select: { id: true, status: true },
    });

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

    await prisma.$transaction([
      prisma.signature.create({
        data: {
          proposalId: proposal.id,
          signatureImage,
          typedName,
          signedAt,
          ipAddress,
        },
      }),
      prisma.proposal.update({
        where: { id: proposal.id },
        data: { status: "Signed" },
      }),
    ]);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("Failed to save signature:", err);
    return NextResponse.json(
      { error: "Something went wrong, please try again." },
      { status: 500 },
    );
  }
}
