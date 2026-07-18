import type { ComponentType } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
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
  IconCalendarEvent,
  IconClock,
  IconEye,
  IconFileDescription,
  IconReceipt2,
  IconSignature,
} from "@tabler/icons-react";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const TRACKED_SECTIONS = [
  "Introduction",
  "Scope of Work",
  "Pricing",
  "Terms",
  "Signature Block",
];

type StatIcon = ComponentType<{ size?: number; stroke?: number; className?: string }>;

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

export default async function ProposalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!UUID_PATTERN.test(id)) {
    notFound();
  }

  const proposal = await prisma.proposal.findUnique({
    where: { id },
    include: { signature: true, proposalView: true, sectionViews: true },
  });

  if (!proposal) {
    notFound();
  }

  const walkThroughDateDisplay = formatDateAU(proposal.walkThroughDate);
  const sectionViewedAt = new Map(
    proposal.sectionViews.map((view) => [view.sectionName, view.firstViewedAt]),
  );
  const viewedSections = TRACKED_SECTIONS.filter((name) => sectionViewedAt.has(name)).sort(
    (a, b) => sectionViewedAt.get(a)!.getTime() - sectionViewedAt.get(b)!.getTime(),
  );
  const unviewedSections = TRACKED_SECTIONS.filter((name) => !sectionViewedAt.has(name));
  const progressPercent = Math.round((viewedSections.length / TRACKED_SECTIONS.length) * 100);

  return (
    <div className="min-h-full bg-surface-off">
      <div className="mx-auto w-full max-w-4xl p-6 sm:p-8">
        <Link href="/admin" className="text-sm text-text-muted hover:text-content-charcoal">
          &larr; Back to Proposals
        </Link>

        <div className="mt-4">
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className={brand.number}>#{referenceNumber(proposal.id)}</p>
              <h1 className="mt-1 font-display text-2xl text-content-charcoal sm:text-3xl">
                {proposal.clientName}
              </h1>
              <p className="mt-0.5 font-display text-base text-content-charcoal/70">
                {proposal.companyName}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className={brand.label}>Total Monthly</p>
              <p className="mt-1 font-ticket-mono text-2xl font-semibold tabular-nums text-content-charcoal">
                {formatCurrencyAUD(proposal.totalMonthlyInclGst.toString())}
              </p>
            </div>
          </div>
          <div className="mt-4">
            <StatusPill status={proposal.status} />
          </div>
        </div>

        <div className="mt-6 space-y-5">
          {proposal.proposalView && (
            <div className={`${brand.card} p-6`}>
              <h2 className="font-display text-base text-content-charcoal">Engagement</h2>

              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <EngagementStat
                  icon={IconCalendarEvent}
                  label="First Opened"
                  value={formatDateTimeAU(proposal.proposalView.firstOpenAt)}
                />
                <EngagementStat
                  icon={IconClock}
                  label="Total Time on Page"
                  value={formatDurationSeconds(proposal.proposalView.totalSeconds)}
                />
                <EngagementStat
                  icon={IconEye}
                  label="Number of Opens"
                  value={String(proposal.proposalView.openCount)}
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
                    className="h-full rounded-full bg-gradient-to-r from-brand-green to-[#2d7a54] shadow-[0_0_8px_rgba(31,92,63,0.5)] transition-[width]"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              <div className="mt-6 border-t border-border-subtle pt-5">
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
                      <div className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-green-tint ring-4 ring-white">
                        <IconEye size={13} stroke={2.25} className="text-brand-green" />
                      </div>
                      <div className="min-w-0 flex-1 pt-0.5">
                        <p className="text-sm font-medium text-content-charcoal">{name} viewed</p>
                        <p className="mt-0.5 font-ticket-mono text-xs text-text-muted">
                          {formatDateTimeAUWithSeconds(sectionViewedAt.get(name)!)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                {unviewedSections.length > 0 && (
                  <p className="mt-4 text-xs text-text-muted">
                    Not yet viewed: {unviewedSections.join(", ")}
                  </p>
                )}
              </div>
            </div>
          )}

          <div className={`${brand.card} p-6`}>
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
              <div>
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

          <div className={`${brand.card} p-6`}>
            <CardHeading icon={IconReceipt2}>Pricing</CardHeading>
            <div className="mt-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-body text-sm text-text-muted">Price per Visit</span>
                <span className="font-ticket-mono text-sm tabular-nums text-content-charcoal">
                  {formatCurrencyAUD(proposal.pricePerVisit.toString())}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-body text-sm text-text-muted">Monthly Cost (excl. GST)</span>
                <span className="font-ticket-mono text-sm tabular-nums text-content-charcoal">
                  {formatCurrencyAUD(proposal.monthlyCostExclGst.toString())}
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between border-t border-hairline pt-3">
                <span className="font-body text-sm font-semibold text-content-charcoal">
                  Total Monthly (incl. GST)
                </span>
                <span className="font-ticket-mono text-2xl font-semibold tabular-nums text-content-charcoal">
                  {formatCurrencyAUD(proposal.totalMonthlyInclGst.toString())}
                </span>
              </div>
            </div>
          </div>

          {proposal.signature && (
            <div className={`${brand.card} p-6`}>
              <div className="flex items-center justify-between">
                <CardHeading icon={IconSignature}>Signature</CardHeading>
                <StatusPill status="Signed" />
              </div>
              <div className="mt-5 overflow-hidden rounded-[8px] border border-hairline bg-white p-4">
                {/* eslint-disable-next-line @next/next/no-img-element -- stored base64 data URL, not an optimizable static asset */}
                <img
                  src={proposal.signature.signatureImage}
                  alt={`Signature of ${proposal.signature.typedName}`}
                  className="h-28 w-full object-contain"
                />
              </div>
              <p className="mt-3 font-body text-sm text-text-muted">
                Signed by{" "}
                <span className="font-medium text-content-charcoal">
                  {proposal.signature.typedName}
                </span>{" "}
                on{" "}
                <span className="font-ticket-mono">
                  {formatDateTimeAU(proposal.signature.signedAt)}
                </span>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
