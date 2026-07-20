"use client";

import type { ComponentType } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, buttonClasses } from "@/app/components/Button";
import {
  formatCurrencyAUD,
  formatDateAU,
  formatDateTimeAU,
  formatDateTimeAUWithSeconds,
  formatDurationSeconds,
  referenceNumber,
} from "@/lib/format";
import { brand, REFRESH_EVENT } from "@/lib/ui";
import { DEFAULT_TIMEZONE, TIMEZONE_OPTIONS } from "@/lib/timezone";
import StatusPill from "@/app/admin/StatusPill";
import ConfirmDialog from "@/app/admin/ConfirmDialog";
import {
  IconArrowLeft,
  IconCalendarEvent,
  IconClock,
  IconEye,
  IconFileDescription,
  IconHistory,
  IconReceipt2,
  IconRefresh,
  IconWorld,
} from "@tabler/icons-react";

// Persisted per-browser (not per-proposal) — whichever zone an admin picks
// stays selected while they move between proposals.
const TIMEZONE_STORAGE_KEY = "escg:admin-timezone";

function getStoredTimezone(): string {
  if (typeof window === "undefined") return DEFAULT_TIMEZONE;
  return window.localStorage.getItem(TIMEZONE_STORAGE_KEY) || DEFAULT_TIMEZONE;
}

// A proposal's engagement stats (opens, time on page, section progress)
// change live while an admin is looking at this exact panel — the client
// might be reading the proposal right now. Refreshing the whole browser tab
// to see that was the actual complaint, so this panel refetches on its own
// periodically, on a manual click, and whenever the shared Topbar refresh
// button fires (see Topbar.tsx, which dispatches REFRESH_EVENT).
const AUTO_REFRESH_INTERVAL_MS = 20_000;

// Must stay in lockstep with app/proposals/[uuid]/ProposalTracker.tsx's
// TRACKED_SECTIONS names (and the "Signature Block" fallback name hardcoded
// in app/api/proposals/[uuid]/sign/route.ts) — any SectionView row whose
// sectionName isn't in this list is silently dropped from both the progress
// bar and the Timeline below.
const TRACKED_SECTIONS = [
  "Cover",
  "Introduction",
  "What You Get",
  "Scope of Work",
  "Scheduling",
  "Pricing",
  "Insurance",
  "Terms",
  "Additional Services",
  "Signature Block",
  "Quality Methodology",
  "Colour Coding",
  "Microfibre Procedures",
];

type StatIcon = ComponentType<{ size?: number; stroke?: number; className?: string }>;

type DetailResponse = {
  proposal: {
    id: string;
    status: string;
    walkThroughDate: string;
    companyName: string;
    companyAddress: string;
    clientName: string;
    clientEmail: string;
    frequencyOfService: string;
    scopeOfWork: string;
    pricePerVisit: number;
    monthlyCostExclGst: number;
    totalMonthlyInclGst: number;
    acquisitionMethod: string;
  };
  signature: { typedName: string; signedAt: string; signatureImage: string } | null;
  proposalView: { firstOpenAt: string; totalSeconds: number; openCount: number } | null;
  sectionViews: { sectionName: string; firstViewedAt: string; totalSeconds: number }[];
  visits: { id: string; startedAt: string; totalSeconds: number }[];
};

function CardHeading({ icon: Icon, children }: { icon: StatIcon; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className={`${brand.iconChip} h-7 w-7 bg-neutral-tint`}>
        <Icon size={14} stroke={1.9} className="text-content-charcoal/70" />
      </div>
      <h2 className="font-display text-base text-content-charcoal">{children}</h2>
    </div>
  );
}

function EngagementStat({ icon: Icon, label, value }: { icon: StatIcon; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className={`${brand.iconChip} bg-neutral-tint`}>
        <Icon size={16} stroke={1.9} className="text-content-charcoal/70" />
      </div>
      <div className="min-w-0">
        <p className={brand.label}>{label}</p>
        <p className="mt-1 font-ticket-mono text-sm font-semibold tabular-nums text-content-charcoal">
          {value}
        </p>
      </div>
    </div>
  );
}

// Same muted/simple admin-color override pattern used by new/page.tsx's
// modal buttons, so "Back to Proposals" reads as a plain, restrained action
// rather than competing with the primary "Send Proposal" button beside it.
const secondaryButtonClass =
  "rounded-[8px]! border-hairline! text-content-charcoal! hover:bg-surface-hover!";
const primaryButtonClass =
  "rounded-[8px]! bg-brand-primary! text-white! hover:bg-brand-primary/90! focus-visible:ring-brand-primary!";

// Caller must render this with `key={proposalId}` so switching proposals
// remounts fresh (state naturally resets) instead of needing an effect to
// manually clear stale data/error before the new fetch resolves.
export default function ProposalDetailPanel({ proposalId }: { proposalId: string }) {
  const router = useRouter();
  const [data, setData] = useState<DetailResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isMarkingLost, setIsMarkingLost] = useState(false);
  const [confirmMarkAsLostOpen, setConfirmMarkAsLostOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionWarning, setActionWarning] = useState<string | null>(null);
  const [timezone, setTimezoneState] = useState<string>(getStoredTimezone);
  const cancelledRef = useRef(false);

  function setTimezone(tz: string) {
    setTimezoneState(tz);
    if (typeof window !== "undefined") window.localStorage.setItem(TIMEZONE_STORAGE_KEY, tz);
  }
  // Tracks whether we've ever successfully loaded data, without making
  // `loadData` depend on `data` state (that would recreate it — and reset
  // the polling interval below — on every successful poll).
  const hasLoadedRef = useRef(false);

  // `showSpinner` is false for background polls/silent refreshes so the
  // whole panel doesn't flash back to "Loading proposal…" every 20 seconds
  // — only the very first load (and an explicit manual refresh) show it.
  const loadData = useCallback(
    async (showSpinner: boolean) => {
      if (showSpinner) setIsRefreshing(true);
      try {
        const res = await fetch(`/api/proposals/${proposalId}`);
        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          throw new Error(typeof json?.error === "string" ? json.error : "Failed to load.");
        }
        const json: DetailResponse = await res.json();
        if (!cancelledRef.current) {
          setData(json);
          hasLoadedRef.current = true;
        }
      } catch (err) {
        if (!cancelledRef.current) {
          // A background poll failing (a dropped request, a momentary 500)
          // shouldn't blow away an already-loaded panel — only surface the
          // error state if we never managed to load anything at all.
          if (hasLoadedRef.current) {
            console.error("Background proposal refresh failed:", err);
          } else {
            setError(err instanceof Error ? err.message : "Failed to load.");
          }
        }
      } finally {
        if (showSpinner && !cancelledRef.current) setIsRefreshing(false);
      }
    },
    [proposalId],
  );

  useEffect(() => {
    cancelledRef.current = false;
    // Deferred one tick (rather than called as a direct statement) so this
    // reads the same way to the react-hooks lint rule as the interval/event
    // callbacks below: setState happens inside a callback triggered by an
    // external event (a timer, a fetch response), never synchronously
    // during the effect's own commit.
    const initialLoadId = setTimeout(() => loadData(false), 0);

    const intervalId = setInterval(() => loadData(false), AUTO_REFRESH_INTERVAL_MS);
    function handleExternalRefresh() {
      loadData(true);
    }
    window.addEventListener(REFRESH_EVENT, handleExternalRefresh);

    return () => {
      cancelledRef.current = true;
      clearTimeout(initialLoadId);
      clearInterval(intervalId);
      window.removeEventListener(REFRESH_EVENT, handleExternalRefresh);
    };
  }, [loadData]);

  function requestMarkAsLost() {
    if (!data || data.proposal.status === "Lost") return;
    setConfirmMarkAsLostOpen(true);
  }

  async function performMarkAsLost() {
    setIsMarkingLost(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/proposals/${proposalId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Lost" }),
      });

      if (!res.ok) {
        setActionError("Something went wrong, please try again.");
        return;
      }

      setData((prev) => (prev ? { ...prev, proposal: { ...prev.proposal, status: "Lost" } } : prev));
      router.refresh();
    } catch {
      setActionError("Something went wrong, please try again.");
    } finally {
      setIsMarkingLost(false);
      setConfirmMarkAsLostOpen(false);
    }
  }

  async function handleSendProposal() {
    if (!data || data.proposal.status !== "Draft") return;

    setIsSending(true);
    setActionError(null);
    setActionWarning(null);
    try {
      const res = await fetch(`/api/proposals/${proposalId}/send`, { method: "POST" });
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setActionError(
          typeof json?.error === "string" ? json.error : "Something went wrong, please try again.",
        );
        return;
      }

      setData((prev) => (prev ? { ...prev, proposal: { ...prev.proposal, status: "Sent" } } : prev));
      if (json?.emailSent === false) {
        setActionWarning(
          typeof json?.emailError === "string"
            ? `Marked as sent, but the email failed to deliver: ${json.emailError}`
            : "Marked as sent, but the email failed to deliver. Copy the link and send it manually.",
        );
      }
      router.refresh();
    } catch {
      setActionError("Something went wrong, please try again.");
    } finally {
      setIsSending(false);
    }
  }

  if (error) {
    return (
      <div className={`${brand.card} p-5 text-sm text-red`}>
        {error}
      </div>
    );
  }

  if (!data) {
    return (
      <div className={`${brand.card} p-5`}>
        <p className="text-sm text-text-muted">Loading proposal…</p>
      </div>
    );
  }

  const { proposal, signature, proposalView, sectionViews, visits } = data;

  const walkThroughDateDisplay = formatDateAU(new Date(proposal.walkThroughDate), timezone);
  const sectionViewedAt = new Map(
    sectionViews.map((view) => [view.sectionName, new Date(view.firstViewedAt)]),
  );
  const sectionTimeSpent = new Map(
    sectionViews.map((view) => [view.sectionName, view.totalSeconds]),
  );
  const viewedSections = TRACKED_SECTIONS.filter((name) => sectionViewedAt.has(name)).sort(
    (a, b) => sectionViewedAt.get(a)!.getTime() - sectionViewedAt.get(b)!.getTime(),
  );
  const unviewedSections = TRACKED_SECTIONS.filter((name) => !sectionViewedAt.has(name));
  const progressPercent = Math.round((viewedSections.length / TRACKED_SECTIONS.length) * 100);

  return (
    <div className="mx-auto w-full max-w-6xl p-2 sm:p-4">
      <div className={`${brand.card} p-4 sm:p-6`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/admin"
            scroll={false}
            className={buttonClasses("secondary", "sm", `gap-1.5 ${secondaryButtonClass}`)}
          >
            <IconArrowLeft size={15} stroke={2} />
            Back to Proposals
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => loadData(true)}
              disabled={isRefreshing}
              title="Refresh"
              className="flex h-8 w-8 items-center justify-center rounded-[8px] text-text-muted transition-all hover:bg-surface-hover hover:text-content-charcoal disabled:opacity-50"
            >
              <IconRefresh size={16} stroke={1.9} className={isRefreshing ? "animate-spin" : ""} />
            </button>
            {proposal.status !== "Lost" && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={requestMarkAsLost}
                disabled={isMarkingLost}
                className={secondaryButtonClass}
              >
                {isMarkingLost ? "Marking…" : "Mark as Lost"}
              </Button>
            )}
            {proposal.status === "Draft" && (
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleSendProposal}
                disabled={isSending}
                className={primaryButtonClass}
              >
                {isSending ? "Sending…" : "Send Proposal"}
              </Button>
            )}
          </div>
        </div>

        {(actionError || actionWarning) && (
          <div className="mt-3">
            {actionError && <p className="text-xs text-red-600">{actionError}</p>}
            {actionWarning && <p className="text-xs text-amber-700">{actionWarning}</p>}
          </div>
        )}

        <div className="mt-4 flex items-start justify-between gap-6 border-t border-border-subtle pt-4">
          <div>
            <p className={brand.number}>#{referenceNumber(proposal.id)}</p>
            <h1 className="mt-1 font-display text-2xl text-content-charcoal sm:text-[28px]">
              {proposal.clientName}
            </h1>
            <p className="mt-0.5 font-display text-sm text-content-charcoal/70">
              {proposal.companyName}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className={brand.label}>Total Monthly</p>
            <p className="mt-1 font-ticket-mono text-2xl font-semibold tabular-nums text-content-charcoal">
              {formatCurrencyAUD(proposal.totalMonthlyInclGst)}
            </p>
          </div>
        </div>
        <div className="mt-3">
          <StatusPill status={proposal.status} />
        </div>
      </div>

      <div className="mt-4 space-y-4">
        {proposalView && (
          <div className={`${brand.card} p-4 sm:p-6`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="shrink-0 font-display text-base text-content-charcoal">Engagement</h2>
              <label className="flex w-full min-w-0 items-center gap-1.5 text-xs text-text-muted sm:w-auto">
                <IconWorld size={14} stroke={1.9} className="shrink-0" />
                <span className="hidden shrink-0 sm:inline">Times shown in</span>
                <select
                  aria-label="Timezone for displayed times"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="min-w-0 flex-1 rounded-[6px] border border-hairline bg-white py-1 pl-1.5 pr-6 font-medium text-content-charcoal focus:outline-none focus:ring-1 focus:ring-brand-primary sm:flex-initial"
                >
                  {TIMEZONE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {/* Two-column on wide screens: stats + reading progress on the
                left, the timeline (often the longest content) alongside on
                the right — filling the panel's full width instead of
                stacking everything into one narrow column. */}
            <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
              <div>
                <div className="space-y-4">
                  <EngagementStat
                    icon={IconCalendarEvent}
                    label="First Opened"
                    value={formatDateTimeAU(new Date(proposalView.firstOpenAt), timezone)}
                  />
                  <EngagementStat
                    icon={IconClock}
                    label="Total Time on Page"
                    value={formatDurationSeconds(proposalView.totalSeconds)}
                  />
                  <EngagementStat
                    icon={IconEye}
                    label="Number of Opens"
                    value={String(proposalView.openCount)}
                  />
                </div>

                <div className="mt-6 border-t border-border-subtle pt-5">
                  <div className="flex items-center justify-between">
                    <p className={brand.label}>Reading Progress</p>
                    <span className="text-xs font-semibold text-content-charcoal">
                      {viewedSections.length}/{TRACKED_SECTIONS.length} sections
                    </span>
                  </div>
                  <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-neutral-tint">
                    <div
                      className="h-full rounded-full bg-brand-primary shadow-[0_0_8px_color-mix(in_oklab,var(--color-brand-primary)_50%,transparent)] transition-[width]"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  {unviewedSections.length > 0 && (
                    <p className="mt-3 text-xs text-text-muted">
                      Not yet viewed: {unviewedSections.join(", ")}
                    </p>
                  )}
                </div>
              </div>

              <div className="border-t border-border-subtle pt-5 lg:border-t-0 lg:border-l lg:border-border-subtle lg:pl-6 lg:pt-0">
                <p className={brand.label}>Timeline</p>
                <div className="relative mt-4 space-y-5">
                  {viewedSections.length > 1 && (
                    <div
                      className="absolute left-[13px] top-2 bottom-2 w-px bg-hairline"
                      aria-hidden="true"
                    />
                  )}
                  {viewedSections.map((name) => (
                    <div key={name} className="relative flex items-start gap-3.5">
                      <div className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-primary-tint ring-4 ring-white">
                        <IconEye size={13} stroke={2.25} className="text-brand-primary" />
                      </div>
                      <div className="min-w-0 flex-1 pt-0.5">
                        <p className="text-sm font-medium text-content-charcoal">{name} viewed</p>
                        <p className="mt-0.5 font-ticket-mono text-xs text-text-muted">
                          {formatDateTimeAUWithSeconds(sectionViewedAt.get(name)!, timezone)}
                          {" · "}
                          {formatDurationSeconds(sectionTimeSpent.get(name) ?? 0)} spent
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {visits.length > 0 && (
          <div className={`${brand.card} p-4 sm:p-6`}>
            <CardHeading icon={IconHistory}>Visits</CardHeading>
            <p className="mt-1 text-xs text-text-muted">
              Every time this proposal was opened, in its own row — when it happened and how long
              that visit lasted (separate from the section-by-section reading time above).
            </p>

            <div className="mt-4 divide-y divide-hairline">
              {visits.map((visit, index) => (
                <div key={visit.id} className="flex items-center justify-between gap-4 py-2.5 first:pt-0">
                  <div className="flex items-center gap-2.5">
                    <span className={`${brand.iconChip} h-7 w-7 bg-neutral-tint`}>
                      <IconEye size={13} stroke={1.9} className="text-content-charcoal/70" />
                    </span>
                    <div>
                      <p className="text-sm font-medium text-content-charcoal">
                        Visit {visits.length - index}
                      </p>
                      <p className="mt-0.5 font-ticket-mono text-xs text-text-muted">
                        {formatDateTimeAUWithSeconds(new Date(visit.startedAt), timezone)}
                      </p>
                    </div>
                  </div>
                  <p className="font-ticket-mono text-sm tabular-nums text-content-charcoal">
                    {formatDurationSeconds(visit.totalSeconds)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Details + Pricing side by side on wide screens instead of two
            full-width stacked cards — the same reason: fill the available
            width instead of leaving it empty either side of one column. */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className={`${brand.card} p-4 sm:p-6`}>
            <CardHeading icon={IconFileDescription}>Proposal Details</CardHeading>
            <dl className="mt-5 grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
              <div>
                <dt className={brand.label}>Walk-through Date</dt>
                <dd className="mt-1 font-body text-sm text-content-charcoal">
                  {walkThroughDateDisplay}
                </dd>
              </div>
              <div>
                <dt className={brand.label}>Frequency of Service</dt>
                <dd className="mt-1 font-body text-sm text-content-charcoal">
                  {proposal.frequencyOfService}
                </dd>
              </div>
              <div>
                <dt className={brand.label}>Company Address</dt>
                <dd className="mt-1 font-body text-sm text-content-charcoal">
                  {proposal.companyAddress}
                </dd>
              </div>
              <div>
                <dt className={brand.label}>Client Email</dt>
                <dd className="mt-1 font-body text-sm text-content-charcoal">
                  {proposal.clientEmail}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className={brand.label}>Client Acquisition Method</dt>
                <dd className="mt-1 font-body text-sm text-content-charcoal">
                  {proposal.acquisitionMethod}
                </dd>
              </div>
            </dl>

            <div className="mt-5 border-t border-border-subtle pt-5">
              <p className={brand.label}>Scope of Work</p>
              <p className="mt-1 whitespace-pre-line font-body text-sm text-content-charcoal">
                {proposal.scopeOfWork}
              </p>
            </div>
          </div>

          <div className={`${brand.card} p-4 sm:p-6`}>
            <CardHeading icon={IconReceipt2}>Pricing</CardHeading>
            <div className="mt-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-body text-sm text-text-muted">Price per Visit</span>
                <span className="font-ticket-mono text-sm tabular-nums text-content-charcoal">
                  {formatCurrencyAUD(proposal.pricePerVisit)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-body text-sm text-text-muted">Monthly Cost (excl. GST)</span>
                <span className="font-ticket-mono text-sm tabular-nums text-content-charcoal">
                  {formatCurrencyAUD(proposal.monthlyCostExclGst)}
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between border-t border-hairline pt-3">
                <span className="font-body text-sm font-semibold text-content-charcoal">
                  Total Monthly (incl. GST)
                </span>
                <span className="font-ticket-mono text-2xl font-semibold tabular-nums text-content-charcoal">
                  {formatCurrencyAUD(proposal.totalMonthlyInclGst)}
                </span>
              </div>
            </div>

            {signature && (
              <div className="mt-5 border-t border-border-subtle pt-5">
                <div className="flex items-center justify-between">
                  <p className={brand.label}>Signature</p>
                  <StatusPill status="Signed" />
                </div>
                <div className="mt-3 overflow-hidden rounded-[8px] border border-hairline bg-white p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element -- stored base64 data URL, not an optimizable static asset */}
                  <img
                    src={signature.signatureImage}
                    alt={`Signature of ${signature.typedName}`}
                    className="h-20 w-full object-contain"
                  />
                </div>
                <p className="mt-2 font-body text-xs text-text-muted">
                  Signed by{" "}
                  <span className="font-medium text-content-charcoal">{signature.typedName}</span>{" "}
                  on{" "}
                  <span className="font-ticket-mono">
                    {formatDateTimeAU(new Date(signature.signedAt), timezone)}
                  </span>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmMarkAsLostOpen}
        title="Mark as Lost?"
        description={`Mark the proposal for ${proposal.clientName} as Lost?`}
        confirmLabel="Mark as Lost"
        isBusy={isMarkingLost}
        onConfirm={performMarkAsLost}
        onCancel={() => setConfirmMarkAsLostOpen(false)}
      />
    </div>
  );
}
