"use client";

import type { ComponentType } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  formatCurrencyAUD,
  formatDateAU,
  formatDateTimeAU,
  formatDateTimeAUWithSeconds,
  formatDurationSeconds,
  referenceNumber,
} from "@/lib/format";
import { brand } from "@/lib/ui";
import StatusPill from "@/app/admin/StatusPill";
import {
  IconArrowLeft,
  IconCalendarEvent,
  IconClock,
  IconEye,
  IconFileDescription,
  IconReceipt2,
} from "@tabler/icons-react";

const TRACKED_SECTIONS = [
  "Introduction",
  "Scope of Work",
  "Pricing",
  "Terms",
  "Signature Block",
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

// Caller must render this with `key={proposalId}` so switching proposals
// remounts fresh (state naturally resets) instead of needing an effect to
// manually clear stale data/error before the new fetch resolves.
export default function ProposalDetailPanel({ proposalId }: { proposalId: string }) {
  const [data, setData] = useState<DetailResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/proposals/${proposalId}`)
      .then(async (res) => {
        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          throw new Error(typeof json?.error === "string" ? json.error : "Failed to load.");
        }
        return res.json();
      })
      .then((json: DetailResponse) => {
        if (!cancelled) setData(json);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load.");
      });

    return () => {
      cancelled = true;
    };
  }, [proposalId]);

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

  const { proposal, signature, proposalView, sectionViews } = data;

  const walkThroughDateDisplay = formatDateAU(new Date(proposal.walkThroughDate));
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
      <div className={`${brand.card} p-5 sm:p-6`}>
        <Link
          href="/admin"
          scroll={false}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-text-muted transition-colors hover:text-brand-primary"
        >
          <IconArrowLeft size={15} stroke={2} />
          Back to Proposals
        </Link>

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
          <div className={`${brand.card} p-5 sm:p-6`}>
            <h2 className="font-display text-base text-content-charcoal">Engagement</h2>

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
                    value={formatDateTimeAU(new Date(proposalView.firstOpenAt))}
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
                          {formatDateTimeAUWithSeconds(sectionViewedAt.get(name)!)}
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

        {/* Details + Pricing side by side on wide screens instead of two
            full-width stacked cards — the same reason: fill the available
            width instead of leaving it empty either side of one column. */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className={`${brand.card} p-5 sm:p-6`}>
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

          <div className={`${brand.card} p-5 sm:p-6`}>
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
                    {formatDateTimeAU(new Date(signature.signedAt))}
                  </span>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
