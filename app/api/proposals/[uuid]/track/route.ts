import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { supabaseAdmin } from "@/lib/supabase";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EVENTS = ["open", "heartbeat", "section", "sectionTime"] as const;
type TrackEvent = (typeof EVENTS)[number];

function isVisitId(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

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
        const visitId = isVisitId(body.visitId) ? body.visitId : null;

        // Atomic create-or-increment (a Postgres upsert), replacing a prior
        // select-then-insert-or-update — that read-modify-write pattern
        // could lose an increment when requests raced (e.g. "open" landing
        // alongside an in-flight heartbeat), which under-reported totals.
        const { error: viewError } = await supabaseAdmin.rpc("record_proposal_open", {
          p_proposal_id: proposal.id,
          p_ip: ipAddress,
          p_user_agent: userAgent,
        });
        if (viewError) throw viewError;

        if (visitId) {
          const { error: visitError } = await supabaseAdmin.rpc("record_proposal_visit", {
            p_visit_id: visitId,
            p_proposal_id: proposal.id,
          });
          if (visitError) throw visitError;
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
        const visitId = isVisitId(body.visitId) ? body.visitId : null;

        // Atomic increment (no-ops if "open" hasn't created the row yet,
        // matching the prior behavior) — see the "open" case comment above
        // for why this used to be a racy select-then-update.
        const { error: viewUpdateError } = await supabaseAdmin.rpc("increment_proposal_view_seconds", {
          p_proposal_id: proposal.id,
          p_delta: delta,
        });
        if (viewUpdateError) throw viewUpdateError;

        if (visitId) {
          const { error: visitUpdateError } = await supabaseAdmin.rpc(
            "increment_proposal_visit_seconds",
            { p_visit_id: visitId, p_delta: delta },
          );
          if (visitUpdateError) throw visitUpdateError;
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

        // Atomic create-or-increment — replaces a prior select-then-branch
        // (update if a row existed, upsert-insert otherwise) that could lose
        // an increment if two sectionTime flushes for the same section
        // raced (e.g. the periodic heartbeat flush and a section-change
        // flush landing back to back).
        const { error: sectionUpdateError } = await supabaseAdmin.rpc(
          "increment_section_view_seconds",
          { p_proposal_id: proposal.id, p_section_name: sectionName, p_delta: delta },
        );
        if (sectionUpdateError) throw sectionUpdateError;

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
