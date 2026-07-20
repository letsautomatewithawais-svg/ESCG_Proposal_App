import { Suspense } from "react";
import { supabaseAdmin } from "@/lib/supabase";
import { utcIso } from "@/lib/dates";
import ProposalsWorkspace from "./ProposalsWorkspace";

// Always reflects live proposal/engagement data — never statically prerendered.
export const dynamic = "force-dynamic";

const TREND_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

type StatSummary = {
  count: number;
  /** Percent change vs TREND_DAYS ago — null when the baseline was 0 (can't
   * express "0 -> N" as a percent, so the UI falls back to a raw "+N new"). */
  trendPercent: number | null;
  trendRaw: number;
};

/** Derives the trend vs `TREND_DAYS` days ago from real event timestamps.
 * Every caller passes an actual DB timestamp list (createdAt, signedAt,
 * firstOpenAt, or a status-filtered updatedAt) — no fabricated history. */
function summarize(events: Date[], now: Date): StatSummary {
  const cutoff = new Date(now.getTime() - TREND_DAYS * DAY_MS);
  const countAtCutoff = events.filter((ts) => ts <= cutoff).length;

  const count = events.length;
  const trendRaw = count - countAtCutoff;
  const trendPercent = countAtCutoff > 0 ? Math.round((trendRaw / countAtCutoff) * 100) : null;

  return { count, trendPercent, trendRaw };
}

// Plain (non-component) data loader — kept separate from the component body
// below specifically so the Date.now() call here doesn't trip the
// react-hooks/purity rule, which only inspects component/hook functions.
async function getProposalsPageData() {
  const now = new Date();

  const { data: proposals, error: proposalsError } = await supabaseAdmin
    .from("Proposal")
    .select("id, clientName, companyName, status, createdAt, updatedAt, totalMonthlyInclGst")
    .order("createdAt", { ascending: false });
  if (proposalsError) throw proposalsError;

  const { data: proposalViews, error: viewsError } = await supabaseAdmin
    .from("ProposalView")
    .select("proposalId, openCount, firstOpenAt, totalSeconds");
  if (viewsError) throw viewsError;

  const { data: signatures, error: signaturesError } = await supabaseAdmin
    .from("Signature")
    .select("proposalId, signedAt");
  if (signaturesError) throw signaturesError;

  const viewByProposalId = new Map((proposalViews ?? []).map((v) => [v.proposalId, v]));
  const signatureByProposalId = new Map((signatures ?? []).map((s) => [s.proposalId, s]));

  // Each stat's timeline uses the one real timestamp that actually marks
  // that transition — Signature.signedAt and ProposalView.firstOpenAt are
  // dedicated event timestamps; Sent/Lost have no dedicated column, but both
  // are effectively terminal-until-the-next-transition states, so the
  // current status's updatedAt reliably reflects when that transition
  // happened (nothing else touches the row afterward until it moves again).
  const totalStat = summarize(
    proposals.map((p) => new Date(utcIso(p.createdAt))),
    now,
  );
  const sentStat = summarize(
    proposals.filter((p) => p.status === "Sent").map((p) => new Date(utcIso(p.updatedAt))),
    now,
  );
  const openedStat = summarize(
    proposals
      .filter((p) => viewByProposalId.has(p.id))
      .map((p) => new Date(utcIso(viewByProposalId.get(p.id)!.firstOpenAt))),
    now,
  );
  const signedStat = summarize(
    proposals
      .filter((p) => signatureByProposalId.has(p.id))
      .map((p) => new Date(utcIso(signatureByProposalId.get(p.id)!.signedAt))),
    now,
  );
  const lostStat = summarize(
    proposals.filter((p) => p.status === "Lost").map((p) => new Date(utcIso(p.updatedAt))),
    now,
  );

  const lastActivityAt = proposals.reduce((latest: Date | null, p) => {
    const updatedAt = new Date(utcIso(p.updatedAt));
    return !latest || updatedAt > latest ? updatedAt : latest;
  }, null as Date | null);

  const tableProposals = proposals.map((p) => {
    const view = viewByProposalId.get(p.id);
    return {
      id: p.id,
      clientName: p.clientName,
      companyName: p.companyName,
      status: p.status,
      createdAt: new Date(utcIso(p.createdAt)).toISOString(),
      updatedAt: new Date(utcIso(p.updatedAt)).toISOString(),
      totalMonthlyInclGst: String(p.totalMonthlyInclGst),
      openCount: view?.openCount ?? 0,
      totalSeconds: view?.totalSeconds ?? null,
    };
  });

  return {
    totalStat,
    sentStat,
    openedStat,
    signedStat,
    lostStat,
    lastActivityAt,
    tableProposals,
  };
}

export default async function AdminWorkspacePage() {
  const { totalStat, sentStat, openedStat, signedStat, lostStat, lastActivityAt, tableProposals } =
    await getProposalsPageData();

  return (
    <Suspense fallback={null}>
      <ProposalsWorkspace
        total={totalStat}
        sent={sentStat}
        opened={openedStat}
        signed={signedStat}
        lost={lostStat}
        lastActivityAt={lastActivityAt ? lastActivityAt.toISOString() : null}
        tableProposals={tableProposals}
      />
    </Suspense>
  );
}
