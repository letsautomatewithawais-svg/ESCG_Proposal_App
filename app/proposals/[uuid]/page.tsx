import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatCurrencyAUD, formatDateAU } from "@/lib/format";
import { surface, text } from "@/lib/ui";
import { Brand } from "../../components/Brand";
import SignatureSection from "./SignatureSection";
import ProposalTracker from "./ProposalTracker";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function ProposalPage({
  params,
  searchParams,
}: {
  params: Promise<{ uuid: string }>;
  searchParams: Promise<{ print?: string }>;
}) {
  const { uuid } = await params;
  const { print } = await searchParams;
  // Print mode is used exclusively by the internal Puppeteer PDF export
  // (see app/api/proposals/[uuid]/pdf/route.ts) — it renders the same
  // template with tracking and the live signature pad switched off, so a
  // PDF export is never recorded as a real client visit.
  const isPrintMode = print === "1";

  if (!UUID_PATTERN.test(uuid)) {
    notFound();
  }

  const proposal = await prisma.proposal.findUnique({
    where: { id: uuid },
    include: { signature: true },
  });

  if (!proposal) {
    notFound();
  }

  const walkThroughDateDisplay = new Intl.DateTimeFormat("en-AU", {
    dateStyle: "full",
  }).format(proposal.walkThroughDate);
  const dateIssuedDisplay = formatDateAU(proposal.createdAt);
  const referenceNumber = proposal.id.slice(0, 8).toUpperCase();

  return (
    <div className="min-h-screen bg-hairline/70 px-4 py-10 font-sans print:bg-white print:p-0 sm:py-16">
      {!isPrintMode && <ProposalTracker proposalId={proposal.id} />}
      {!isPrintMode && (
        <div className="mx-auto mb-4 w-full max-w-[210mm] text-right print:hidden">
          <a
            href={`/api/proposals/${proposal.id}/pdf`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-sage hover:text-sage/80"
          >
            Download PDF
          </a>
        </div>
      )}
      <div className="mx-auto w-full max-w-[210mm] bg-paper shadow-[0_1px_2px_rgba(20,35,31,0.08),0_24px_48px_-28px_rgba(20,35,31,0.45)] print:max-w-none print:shadow-none">
        <div className="px-6 py-10 sm:px-[18mm] sm:py-[16mm]">
          <header className="flex items-start justify-between gap-6 border-b border-hairline pb-6">
            <Brand />
            <div className="text-right">
              <p className={text.sectionLabel}>Proposal</p>
              <p className="mt-1.5 font-mono text-xs text-warmgray">Ref. {referenceNumber}</p>
              <p className="mt-0.5 font-mono text-xs text-warmgray">{dateIssuedDisplay}</p>
            </div>
          </header>

          <div className="mt-6">
            <p className={text.sectionLabel}>Prepared for</p>
            <p className="mt-1.5 text-sm font-medium text-ink">{proposal.clientName}</p>
            <p className="text-sm text-warmgray">{proposal.companyName}</p>
            <p className="text-sm text-warmgray">{proposal.companyAddress}</p>
          </div>

          <div id="section-introduction" className="mt-10">
            <h1 className={text.heroTitle}>Hi {proposal.clientName}</h1>
            <p className="mt-3 text-base text-ink/70">
              Here&apos;s your cleaning proposal, prepared for{" "}
              <span className="font-medium text-ink">{proposal.companyName}</span>.
            </p>
            <p className={`mt-1 ${text.small}`}>
              Walk-through scheduled for {walkThroughDateDisplay}
            </p>
          </div>

          <section id="section-scope-of-work" className="mt-10 border-t border-hairline pt-8">
            <h2 className={text.sectionLabel}>Scope of Work</h2>
            <p className={`mt-3 whitespace-pre-line ${text.body}`}>{proposal.scopeOfWork}</p>
          </section>

          <section id="section-pricing" className="mt-10 border-t border-hairline pt-8">
            <h2 className={text.sectionLabel}>Pricing</h2>

            <div className={`mt-3 overflow-hidden ${surface.primary}`}>
              <div className="divide-y divide-hairline">
                <div className="flex items-center justify-between px-5 py-3.5 sm:px-6">
                  <span className={text.muted}>Price per Visit</span>
                  <span className="text-sm font-medium text-ink">
                    {formatCurrencyAUD(proposal.pricePerVisit.toString())}
                  </span>
                </div>
                <div className="flex items-center justify-between px-5 py-3.5 sm:px-6">
                  <span className={text.muted}>Monthly Cost (excl. GST)</span>
                  <span className="text-sm font-medium text-ink">
                    {formatCurrencyAUD(proposal.monthlyCostExclGst.toString())}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-1 bg-ink/[0.035] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <span className="text-sm font-medium text-ink/70">
                  Total Monthly Amount (incl. GST)
                </span>
                <span className={text.priceHeadline}>
                  {formatCurrencyAUD(proposal.totalMonthlyInclGst.toString())}
                </span>
              </div>
            </div>

            <p className={`mt-3 ${text.muted}`}>
              Service Frequency:{" "}
              <span className="font-medium text-ink">{proposal.frequencyOfService}</span>
            </p>
          </section>

          <section id="section-terms" className="mt-10 border-t border-hairline pt-8">
            <h2 className={text.sectionLabel}>Terms</h2>
            <p className={`mt-2 leading-6 ${text.small}`}>
              This proposal is valid for 30 days from the date issued. Services will commence on a
              mutually agreed date following acceptance. Either party may terminate the service
              agreement with 30 days&apos; written notice. Payment is due monthly in advance unless
              otherwise agreed in writing.
            </p>
          </section>

          <section
            id="section-signature-block"
            className={`mt-10 border-t border-hairline pt-8 ${surface.primary} p-6 sm:p-8`}
          >
            <SignatureSection
              proposalId={proposal.id}
              alreadySigned={!!proposal.signature}
              existingSignature={
                proposal.signature
                  ? {
                      typedName: proposal.signature.typedName,
                      signedAt: proposal.signature.signedAt.toISOString(),
                      signatureImage: proposal.signature.signatureImage,
                    }
                  : null
              }
              printMode={isPrintMode}
            />
          </section>

          <footer className="mt-12 flex items-center justify-between border-t border-hairline pt-4">
            <p className={text.small}>Eastern Suburbs Cleaning Group</p>
            <p className={`${text.small} font-mono`}>Ref. {referenceNumber}</p>
          </footer>
        </div>
      </div>
    </div>
  );
}
