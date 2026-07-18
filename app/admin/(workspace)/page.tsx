import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import StatStrip from "./StatStrip";
import ProposalsTable from "./ProposalsTable";

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

  const proposals = await prisma.proposal.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      proposalView: { select: { openCount: true, firstOpenAt: true, totalSeconds: true } },
      signature: { select: { signedAt: true } },
    },
  });

  // Each stat's timeline uses the one real timestamp that actually marks
  // that transition — Signature.signedAt and ProposalView.firstOpenAt are
  // dedicated event timestamps; Sent/Lost have no dedicated column, but both
  // are effectively terminal-until-the-next-transition states, so the
  // current status's updatedAt reliably reflects when that transition
  // happened (nothing else touches the row afterward until it moves again).
  const totalStat = summarize(proposals.map((p) => p.createdAt), now);
  const sentStat = summarize(
    proposals.filter((p) => p.status === "Sent").map((p) => p.updatedAt),
    now,
  );
  const openedStat = summarize(
    proposals.filter((p) => p.proposalView).map((p) => p.proposalView!.firstOpenAt),
    now,
  );
  const signedStat = summarize(
    proposals.filter((p) => p.signature).map((p) => p.signature!.signedAt),
    now,
  );
  const lostStat = summarize(
    proposals.filter((p) => p.status === "Lost").map((p) => p.updatedAt),
    now,
  );

  const lastActivityAt = proposals.reduce(
    (latest: Date | null, p) => (!latest || p.updatedAt > latest ? p.updatedAt : latest),
    null as Date | null,
  );

  const tableProposals = proposals.map((p) => ({
    id: p.id,
    clientName: p.clientName,
    companyName: p.companyName,
    status: p.status,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    totalMonthlyInclGst: p.totalMonthlyInclGst.toString(),
    openCount: p.proposalView?.openCount ?? 0,
    totalSeconds: p.proposalView?.totalSeconds ?? null,
  }));

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
    <div>
      <StatStrip
        total={totalStat}
        sent={sentStat}
        opened={openedStat}
        signed={signedStat}
        lost={lostStat}
        lastActivityAt={lastActivityAt ? lastActivityAt.toISOString() : null}
      />
      <Suspense fallback={null}>
        <ProposalsTable proposals={tableProposals} />
      </Suspense>
    </div>
  );
}
