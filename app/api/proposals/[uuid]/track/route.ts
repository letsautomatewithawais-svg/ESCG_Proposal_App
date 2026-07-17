import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EVENTS = ["open", "heartbeat", "section"] as const;
type TrackEvent = (typeof EVENTS)[number];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isTrackEvent(value: unknown): value is TrackEvent {
  return typeof value === "string" && (EVENTS as readonly string[]).includes(value);
}

function getClientIp(request: Request): string | null {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
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

  if (!isRecord(body) || !isTrackEvent(body.event)) {
    return NextResponse.json(
      { error: "A valid 'event' field is required." },
      { status: 400 },
    );
  }

  const proposal = await prisma.proposal.findUnique({
    where: { id: uuid },
    select: { id: true, status: true },
  });

  if (!proposal) {
    return NextResponse.json({ error: "Proposal not found." }, { status: 404 });
  }

  try {
    switch (body.event) {
      case "open": {
        const now = new Date();
        const ipAddress = getClientIp(request);
        const userAgent = request.headers.get("user-agent");

        await prisma.$transaction(async (tx) => {
          const existing = await tx.proposalView.findUnique({
            where: { proposalId: proposal.id },
            select: { id: true },
          });

          if (existing) {
            await tx.proposalView.update({
              where: { proposalId: proposal.id },
              data: {
                lastSeenAt: now,
                openCount: { increment: 1 },
              },
            });
          } else {
            await tx.proposalView.create({
              data: {
                proposalId: proposal.id,
                firstOpenAt: now,
                lastSeenAt: now,
                openCount: 1,
                ipAddress,
                userAgent,
              },
            });
          }

          if (proposal.status === "Sent") {
            await tx.proposal.update({
              where: { id: proposal.id },
              data: { status: "Opened" },
            });
          }
        });

        break;
      }

      case "heartbeat": {
        const intervalSecondsRaw = body.intervalSeconds;
        const intervalSeconds =
          typeof intervalSecondsRaw === "number" && Number.isFinite(intervalSecondsRaw)
            ? intervalSecondsRaw
            : 0;

        await prisma.proposalView.updateMany({
          where: { proposalId: proposal.id },
          data: {
            lastSeenAt: new Date(),
            totalSeconds: { increment: Math.max(0, Math.round(intervalSeconds)) },
          },
        });

        break;
      }

      case "section": {
        const sectionName = typeof body.sectionName === "string" ? body.sectionName.trim() : "";
        if (!sectionName) {
          return NextResponse.json(
            { error: "A valid 'sectionName' field is required." },
            { status: 400 },
          );
        }

        await prisma.sectionView.upsert({
          where: {
            proposalId_sectionName: {
              proposalId: proposal.id,
              sectionName,
            },
          },
          create: {
            proposalId: proposal.id,
            sectionName,
            firstViewedAt: new Date(),
          },
          update: {},
        });

        break;
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("Failed to record proposal tracking event:", err);
    return NextResponse.json(
      { error: "Something went wrong, please try again." },
      { status: 500 },
    );
  }
}
