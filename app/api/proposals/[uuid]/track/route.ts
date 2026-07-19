import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { supabaseAdmin } from "@/lib/supabase";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EVENTS = ["open", "heartbeat", "section", "sectionTime"] as const;
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

  const { data: proposal, error: findError } = await supabaseAdmin
    .from("Proposal")
    .select("id, status")
    .eq("id", uuid)
    .maybeSingle();

  if (findError) {
    console.error("Failed to record proposal tracking event:", findError);
    return NextResponse.json(
      { error: "Something went wrong, please try again." },
      { status: 500 },
    );
  }
  if (!proposal) {
    return NextResponse.json({ error: "Proposal not found." }, { status: 404 });
  }

  try {
    switch (body.event) {
      case "open": {
        const now = new Date().toISOString();
        const ipAddress = getClientIp(request);
        const userAgent = request.headers.get("user-agent");

        const { data: existing, error: viewFindError } = await supabaseAdmin
          .from("ProposalView")
          .select("openCount")
          .eq("proposalId", proposal.id)
          .maybeSingle();
        if (viewFindError) throw viewFindError;

        if (existing) {
          const { error: viewUpdateError } = await supabaseAdmin
            .from("ProposalView")
            .update({
              lastSeenAt: now,
              openCount: existing.openCount + 1,
              updatedAt: now,
            })
            .eq("proposalId", proposal.id);
          if (viewUpdateError) throw viewUpdateError;
        } else {
          const { error: viewCreateError } = await supabaseAdmin.from("ProposalView").insert({
            id: uuidv4(),
            proposalId: proposal.id,
            firstOpenAt: now,
            lastSeenAt: now,
            openCount: 1,
            ipAddress,
            userAgent,
            updatedAt: now,
          });
          if (viewCreateError) throw viewCreateError;
        }

        if (proposal.status === "Sent") {
          const { error: statusError } = await supabaseAdmin
            .from("Proposal")
            .update({ status: "Opened", updatedAt: now })
            .eq("id", proposal.id);
          if (statusError) throw statusError;
        }

        break;
      }

      case "heartbeat": {
        const intervalSecondsRaw = body.intervalSeconds;
        const intervalSeconds =
          typeof intervalSecondsRaw === "number" && Number.isFinite(intervalSecondsRaw)
            ? intervalSecondsRaw
            : 0;
        const delta = Math.max(0, Math.round(intervalSeconds));

        // Mirrors the original updateMany: silently no-ops if "open" hasn't
        // created the ProposalView row yet.
        const { data: existing, error: viewFindError } = await supabaseAdmin
          .from("ProposalView")
          .select("totalSeconds")
          .eq("proposalId", proposal.id)
          .maybeSingle();
        if (viewFindError) throw viewFindError;

        if (existing) {
          const { error: viewUpdateError } = await supabaseAdmin
            .from("ProposalView")
            .update({
              lastSeenAt: new Date().toISOString(),
              totalSeconds: existing.totalSeconds + delta,
              updatedAt: new Date().toISOString(),
            })
            .eq("proposalId", proposal.id);
          if (viewUpdateError) throw viewUpdateError;
        }

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

        const { error: sectionError } = await supabaseAdmin.from("SectionView").upsert(
          {
            id: uuidv4(),
            proposalId: proposal.id,
            sectionName,
            firstViewedAt: new Date().toISOString(),
          },
          { onConflict: "proposalId,sectionName", ignoreDuplicates: true },
        );
        if (sectionError) throw sectionError;

        break;
      }

      case "sectionTime": {
        const sectionName = typeof body.sectionName === "string" ? body.sectionName.trim() : "";
        if (!sectionName) {
          return NextResponse.json(
            { error: "A valid 'sectionName' field is required." },
            { status: 400 },
          );
        }

        const intervalSecondsRaw = body.intervalSeconds;
        const intervalSeconds =
          typeof intervalSecondsRaw === "number" && Number.isFinite(intervalSecondsRaw)
            ? intervalSecondsRaw
            : 0;
        const delta = Math.max(0, Math.round(intervalSeconds));
        if (delta === 0) break;

        const { data: existing, error: sectionFindError } = await supabaseAdmin
          .from("SectionView")
          .select("totalSeconds")
          .eq("proposalId", proposal.id)
          .eq("sectionName", sectionName)
          .maybeSingle();
        if (sectionFindError) throw sectionFindError;

        if (existing) {
          const { error: sectionUpdateError } = await supabaseAdmin
            .from("SectionView")
            .update({ totalSeconds: existing.totalSeconds + delta })
            .eq("proposalId", proposal.id)
            .eq("sectionName", sectionName);
          if (sectionUpdateError) throw sectionUpdateError;
        } else {
          // The dwell-confirmed "section" event normally creates this row first;
          // this is a fallback in case that request was lost or arrived out of order.
          const { error: sectionCreateError } = await supabaseAdmin.from("SectionView").upsert(
            {
              id: uuidv4(),
              proposalId: proposal.id,
              sectionName,
              firstViewedAt: new Date().toISOString(),
              totalSeconds: delta,
            },
            { onConflict: "proposalId,sectionName", ignoreDuplicates: true },
          );
          if (sectionCreateError) throw sectionCreateError;
        }

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
