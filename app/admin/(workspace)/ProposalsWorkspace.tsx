"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import StatStrip from "./StatStrip";
import ProposalsTable from "./ProposalsTable";
import ProposalDetailPanel from "@/app/admin/ProposalDetailPanel";

type StatSummary = { count: number; trendPercent: number | null; trendRaw: number };

type TableProposal = {
  id: string;
  clientName: string;
  companyName: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  totalMonthlyInclGst: string;
  openCount: number;
  totalSeconds: number | null;
};

type ProposalsWorkspaceProps = {
  total: StatSummary;
  sent: StatSummary;
  opened: StatSummary;
  signed: StatSummary;
  lost: StatSummary;
  lastActivityAt: string | null;
  tableProposals: TableProposal[];
};

// Selecting a proposal is purely a URL param + client-side fetch (see
// ProposalDetailPanel) rather than a route change to /admin/[id] — that used
// to cause a real Next.js navigation (server component re-fetch, page
// transition) even though the previous split-panel layout visually looked
// like it was staying on the same page. Now opening a proposal shows only
// that proposal's details, full width — no list alongside it — while still
// avoiding any page reload.
// How often the list silently re-fetches its server data (new opens,
// signatures, status changes) without the admin having to hit Refresh or
// reload the whole tab — see Topbar's manual refresh button for the
// on-demand version of the same `router.refresh()` call.
const AUTO_REFRESH_INTERVAL_MS = 30_000;

export default function ProposalsWorkspace({
  total,
  sent,
  opened,
  signed,
  lost,
  lastActivityAt,
  tableProposals,
}: ProposalsWorkspaceProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedId = searchParams.get("selected");

  useEffect(() => {
    const intervalId = setInterval(() => router.refresh(), AUTO_REFRESH_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [router]);

  if (selectedId) {
    return (
      <div className="bg-surface-off p-4">
        <ProposalDetailPanel key={selectedId} proposalId={selectedId} />
      </div>
    );
  }

  return (
    <div>
      <StatStrip
        total={total}
        sent={sent}
        opened={opened}
        signed={signed}
        lost={lost}
        lastActivityAt={lastActivityAt}
      />
      <ProposalsTable proposals={tableProposals} />
    </div>
  );
}
