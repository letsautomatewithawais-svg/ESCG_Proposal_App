"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { IconFilterOff, IconInbox, IconSearch } from "@tabler/icons-react";
import { brand } from "@/lib/ui";
import ProposalRow from "../ProposalRow";

const STATUS_OPTIONS = ["Draft", "Sent", "Opened", "Signed", "Lost"] as const;
const RANGE_OPTIONS = [
  { value: "", label: "All time" },
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
] as const;
const SORT_OPTIONS = [
  { value: "", label: "Last activity" },
  { value: "created", label: "Date created" },
  { value: "name", label: "Client name" },
  { value: "value", label: "Proposal value" },
] as const;

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

// Absorbs what TicketQueue.tsx used to do (status/from/to filtering via
// useSearchParams, updating the URL so it stays linkable/shareable) — now
// also does real client name/company search and sort, still purely against
// the already-fetched proposal list (no new API route needed).
export default function ProposalsTable({ proposals }: { proposals: TableProposal[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const status = searchParams.get("status") ?? "";
  const q = searchParams.get("q") ?? "";
  const range = searchParams.get("range") ?? "";
  const sort = searchParams.get("sort") ?? "";
  const hasFilters = Boolean(status || q || range);

  // The search box can't be directly controlled by the URL param: each
  // keystroke would fire router.replace, and since that resolves
  // asynchronously, fast typing races ahead of it. Worse, syncing this local
  // state back from `q` on every render creates a feedback loop (local state
  // -> debounced URL update -> q changes -> forces local state again) that
  // clobbers whatever the user is still mid-typing. So this is one-directional
  // only: local state feeds the URL (debounced); the URL is only ever pushed
  // back into local state by an explicit user action (Clear filters below).
  const [searchInput, setSearchInput] = useState(q);
  useEffect(() => {
    if (searchInput === q) return;
    const timeout = setTimeout(() => updateParam("q", searchInput), 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const filtered = proposals.filter((proposal) => {
    if (status && proposal.status !== status) return false;

    if (q) {
      const needle = q.toLowerCase();
      if (
        !proposal.clientName.toLowerCase().includes(needle) &&
        !proposal.companyName.toLowerCase().includes(needle)
      ) {
        return false;
      }
    }

    if (range) {
      const days = Number(range);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      if (new Date(proposal.createdAt) < cutoff) return false;
    }

    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sort === "created") {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (sort === "name") {
      return a.clientName.localeCompare(b.clientName);
    }
    if (sort === "value") {
      return Number(b.totalMonthlyInclGst) - Number(a.totalMonthlyInclGst);
    }
    // Default: Last activity
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    const query = params.toString();
    router.replace(`/admin${query ? `?${query}` : ""}`, { scroll: false });
  }

  function handleClear() {
    setSearchInput("");
    const params = new URLSearchParams(searchParams.toString());
    const sortValue = params.get("sort");
    router.replace(`/admin${sortValue ? `?sort=${sortValue}` : ""}`, { scroll: false });
  }

  return (
    <div className="px-6 py-4 sm:px-8">
      <div className={`${brand.panel} overflow-hidden`}>
        <div className="flex flex-wrap items-center gap-2 border-b border-hairline px-5 py-2.5">
          <label className={`${brand.filterPill} w-56`}>
            <IconSearch size={13} stroke={1.9} className="shrink-0 text-text-muted" />
            <input
              type="search"
              aria-label="Search proposals"
              placeholder="Search proposals…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full bg-transparent text-content-charcoal placeholder:text-text-muted focus:outline-none"
            />
          </label>

          <label className={brand.filterPill}>
            <span className="text-text-muted">Status</span>
            <select
              aria-label="Filter by status"
              value={status}
              onChange={(e) => updateParam("status", e.target.value)}
              className="bg-transparent font-medium text-content-charcoal focus:outline-none"
            >
              <option value="">All</option>
              {STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className={brand.filterPill}>
            <span className="text-text-muted">Date</span>
            <select
              aria-label="Filter by date created"
              value={range}
              onChange={(e) => updateParam("range", e.target.value)}
              className="bg-transparent font-medium text-content-charcoal focus:outline-none"
            >
              {RANGE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className={brand.filterPill}>
            <span className="text-text-muted">Sort</span>
            <select
              aria-label="Sort proposals"
              value={sort}
              onChange={(e) => updateParam("sort", e.target.value)}
              className="bg-transparent font-medium text-content-charcoal focus:outline-none"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          {hasFilters && (
            <button
              type="button"
              onClick={handleClear}
              className="text-xs font-medium text-text-muted hover:text-content-charcoal"
            >
              Clear filters
            </button>
          )}
        </div>

        {sorted.length > 0 && (
          <div className="flex items-center gap-4 border-b border-hairline bg-neutral-tint/40 px-5 py-2">
            <span className={`${brand.label} min-w-0 flex-1`}>Proposal</span>
            <span className={`${brand.label} hidden w-36 shrink-0 md:block`}>Client</span>
            <span className={`${brand.label} w-24 shrink-0`}>Status</span>
            <span className={`${brand.label} w-24 shrink-0 text-right`}>Value</span>
            <span className={`${brand.label} hidden w-28 shrink-0 md:block`}>Last Activity</span>
            <span className={`${brand.label} hidden w-16 shrink-0 sm:block`}>Opens</span>
            <span className={`${brand.label} hidden w-24 shrink-0 whitespace-nowrap lg:block`}>
              Time on Page
            </span>
            <span className="w-[72px] shrink-0" aria-hidden="true" />
          </div>
        )}

        <div>
          {sorted.length === 0 ? (
            <div className="flex flex-col items-center px-5 py-14 text-center">
              <div className={`${brand.iconChip} h-11 w-11 bg-neutral-tint`}>
                {proposals.length === 0 ? (
                  <IconInbox size={20} stroke={1.5} className="text-text-muted" />
                ) : (
                  <IconFilterOff size={20} stroke={1.5} className="text-text-muted" />
                )}
              </div>
              <p className="mt-3 text-sm font-semibold text-content-charcoal">
                {proposals.length === 0 ? "No proposals yet" : "No proposals match your filters"}
              </p>
              <p className="mt-1 text-xs text-text-muted">
                {proposals.length === 0
                  ? "New proposals will appear here once created."
                  : "Try adjusting or clearing your filters."}
              </p>
              {proposals.length > 0 && hasFilters && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="mt-4 text-xs font-semibold text-brand-primary hover:text-brand-primary/80"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            sorted.map((proposal) => (
              <ProposalRow
                key={proposal.id}
                id={proposal.id}
                clientName={proposal.clientName}
                companyName={proposal.companyName}
                status={proposal.status}
                createdAt={proposal.createdAt}
                updatedAt={proposal.updatedAt}
                totalMonthlyInclGst={proposal.totalMonthlyInclGst}
                openCount={proposal.openCount}
                totalSeconds={proposal.totalSeconds}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
