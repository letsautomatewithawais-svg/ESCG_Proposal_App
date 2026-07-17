import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatCurrencyAUD, formatDateAU, formatDateTimeAU, formatDurationSeconds } from "@/lib/format";
import { surface, text } from "@/lib/ui";
import StatusBadge from "../StatusBadge";
import SendProposalButton from "./SendProposalButton";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const TRACKED_SECTIONS = [
  "Introduction",
  "Scope of Work",
  "Pricing",
  "Terms",
  "Signature Block",
];

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

  const sectionViewedAt = new Map(
    proposal.sectionViews.map((view) => [view.sectionName, view.firstViewedAt]),
  );

  return (
    <div className="mx-auto w-full max-w-3xl">
      <Link href="/admin" className="text-sm text-warmgray hover:text-ink">
        &larr; Back to Proposals
      </Link>

      <div className="mt-4 flex items-start justify-between gap-4">
        <div>
          <h1 className={text.pageTitle}>{proposal.clientName}</h1>
          <p className={`mt-1 ${text.muted}`}>{proposal.companyName}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <StatusBadge status={proposal.status} />
          {proposal.status === "Draft" && <SendProposalButton proposalId={proposal.id} />}
        </div>
      </div>

      <section className={`mt-8 ${surface.primary} p-6 sm:p-7`}>
        <h2 className={text.sectionLabel}>Proposal Details</h2>
        <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
          <div>
            <dt className={text.small}>Walk-through Date</dt>
            <dd className="mt-0.5 font-mono text-sm font-medium tabular-nums text-ink">
              {formatDateAU(proposal.walkThroughDate)}
            </dd>
          </div>
          <div>
            <dt className={text.small}>Client Email</dt>
            <dd className="mt-0.5 text-sm font-medium text-ink">{proposal.clientEmail}</dd>
          </div>
          <div>
            <dt className={text.small}>Company Address</dt>
            <dd className="mt-0.5 text-sm font-medium text-ink">{proposal.companyAddress}</dd>
          </div>
          <div>
            <dt className={text.small}>Frequency of Service</dt>
            <dd className="mt-0.5 text-sm font-medium text-ink">
              {proposal.frequencyOfService}
            </dd>
          </div>
          <div>
            <dt className={text.small}>Client Acquisition Method</dt>
            <dd className="mt-0.5 text-sm font-medium text-ink">{proposal.acquisitionMethod}</dd>
          </div>
          <div>
            <dt className={text.small}>Created</dt>
            <dd className="mt-0.5 font-mono text-sm font-medium tabular-nums text-ink">
              {formatDateAU(proposal.createdAt)}
            </dd>
          </div>
        </dl>

        <div className="mt-6">
          <dt className={text.small}>Scope of Work</dt>
          <dd className={`mt-1 max-w-prose whitespace-pre-line ${text.body}`}>
            {proposal.scopeOfWork}
          </dd>
        </div>
      </section>

      <section className={`mt-6 ${surface.primary} p-6 sm:p-7`}>
        <h2 className={text.sectionLabel}>Pricing</h2>
        <div className="mt-4 overflow-hidden rounded-lg border border-hairline">
          <div className="divide-y divide-hairline">
            <div className="flex items-center justify-between px-5 py-3.5 sm:px-6">
              <span className={text.muted}>Price per Visit</span>
              <span className="font-mono text-sm font-medium tabular-nums text-ink">
                {formatCurrencyAUD(proposal.pricePerVisit.toString())}
              </span>
            </div>
            <div className="flex items-center justify-between px-5 py-3.5 sm:px-6">
              <span className={text.muted}>Monthly Cost (excl. GST)</span>
              <span className="font-mono text-sm font-medium tabular-nums text-ink">
                {formatCurrencyAUD(proposal.monthlyCostExclGst.toString())}
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-1 bg-ink/[0.03] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <span className="text-sm font-medium text-ink/70">
              Total Monthly Amount (incl. GST)
            </span>
            <span className={`${text.priceHeadline} font-mono tabular-nums`}>
              {formatCurrencyAUD(proposal.totalMonthlyInclGst.toString())}
            </span>
          </div>
        </div>
      </section>

      <section className={`mt-6 ${surface.primary} p-6 sm:p-7`}>
        <h2 className={text.sectionLabel}>Signature</h2>
        {proposal.signature ? (
          <div className="mt-4">
            <div className={`overflow-hidden ${surface.nested} p-4`}>
              {/* eslint-disable-next-line @next/next/no-img-element -- stored base64 data URL, not an optimizable static asset */}
              <img
                src={proposal.signature.signatureImage}
                alt={`Signature of ${proposal.signature.typedName}`}
                className="h-32 w-full object-contain"
              />
            </div>
            <p className={`mt-3 ${text.muted}`}>
              Signed by{" "}
              <span className="font-medium text-ink">{proposal.signature.typedName}</span> on{" "}
              <span className="font-mono tabular-nums">
                {new Intl.DateTimeFormat("en-AU", {
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(proposal.signature.signedAt)}
              </span>
            </p>
          </div>
        ) : (
          <div className={`mt-4 ${surface.nested} p-6 text-center`}>
            <p className={text.muted}>Not yet signed.</p>
          </div>
        )}
      </section>

      <section className={`mt-6 ${surface.primary} p-6 sm:p-7`}>
        <h2 className={text.sectionLabel}>Tracking Activity</h2>
        {proposal.proposalView ? (
          <>
            <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-3">
              <div>
                <dt className={text.small}>First Opened</dt>
                <dd className="mt-0.5 font-mono text-sm font-medium tabular-nums text-ink">
                  {formatDateTimeAU(proposal.proposalView.firstOpenAt)}
                </dd>
              </div>
              <div>
                <dt className={text.small}>Total Time on Page</dt>
                <dd className="mt-0.5 font-mono text-sm font-medium tabular-nums text-ink">
                  {formatDurationSeconds(proposal.proposalView.totalSeconds)}
                </dd>
              </div>
              <div>
                <dt className={text.small}>Number of Opens</dt>
                <dd className="mt-0.5 font-mono text-sm font-medium tabular-nums text-ink">
                  {proposal.proposalView.openCount}
                </dd>
              </div>
            </dl>

            <div className="mt-6">
              <p className={text.small}>Sections Viewed</p>
              <ul className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {TRACKED_SECTIONS.map((sectionName) => {
                  const viewedAt = sectionViewedAt.get(sectionName);
                  return (
                    <li
                      key={sectionName}
                      className={
                        viewedAt
                          ? "flex items-center justify-between gap-3 rounded-md border border-sage/30 bg-sage/5 px-3 py-2 text-sm text-ink"
                          : "flex items-center justify-between gap-3 rounded-md border border-hairline px-3 py-2 text-sm text-warmgray"
                      }
                    >
                      <span className="flex items-center gap-2 font-medium">
                        <span aria-hidden="true">{viewedAt ? "✓" : "○"}</span>
                        {sectionName}
                      </span>
                      {viewedAt && (
                        <span className="font-mono text-xs tabular-nums text-warmgray">
                          {formatDateTimeAU(viewedAt)}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          </>
        ) : (
          <div className={`mt-4 flex items-center justify-center ${surface.nested} p-10 text-center`}>
            <p className={text.muted}>Not yet opened.</p>
          </div>
        )}
      </section>
    </div>
  );
}
