import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatCurrencyAUD } from "@/lib/format";
import { surface, text } from "@/lib/ui";
import { Brand } from "../../components/Brand";
import SignatureSection from "./SignatureSection";
import ProposalTracker from "./ProposalTracker";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function ProposalPage({
  params,
}: {
  params: Promise<{ uuid: string }>;
}) {
  const { uuid } = await params;

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

  return (
    <div className="min-h-screen bg-white font-sans">
      <ProposalTracker proposalId={proposal.id} />
      <div className="mx-auto w-full max-w-2xl px-6 py-12 sm:px-8 sm:py-16">
        <header className="flex flex-col gap-1 border-b border-gray-100 pb-8">
          <Brand />
          <span className={text.small}>Eastern Suburbs Cleaning Group</span>
        </header>

        <div id="section-introduction" className="mt-10 sm:mt-12">
          <h1 className={text.heroTitle}>Hi {proposal.clientName}</h1>
          <p className="mt-3 text-base text-gray-500">
            Here&apos;s your cleaning proposal, prepared for{" "}
            <span className="font-medium text-gray-700">{proposal.companyName}</span>.
          </p>
          <p className={`mt-1 ${text.small}`}>
            Walk-through scheduled for {walkThroughDateDisplay}
          </p>
        </div>

        <section id="section-scope-of-work" className="mt-12">
          <h2 className={text.sectionLabel}>Scope of Work</h2>
          <p className={`mt-3 max-w-prose whitespace-pre-line ${text.body}`}>
            {proposal.scopeOfWork}
          </p>
        </section>

        <section id="section-pricing" className="mt-12">
          <h2 className={text.sectionLabel}>Pricing</h2>

          <div className={`mt-3 overflow-hidden ${surface.primary}`}>
            <div className="divide-y divide-gray-100">
              <div className="flex items-center justify-between px-5 py-3.5 sm:px-6">
                <span className={text.muted}>Price per Visit</span>
                <span className="text-sm font-medium text-gray-900">
                  {formatCurrencyAUD(proposal.pricePerVisit.toString())}
                </span>
              </div>
              <div className="flex items-center justify-between px-5 py-3.5 sm:px-6">
                <span className={text.muted}>Monthly Cost (excl. GST)</span>
                <span className="text-sm font-medium text-gray-900">
                  {formatCurrencyAUD(proposal.monthlyCostExclGst.toString())}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-1 bg-gray-50 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <span className="text-sm font-medium text-gray-600">
                Total Monthly Amount (incl. GST)
              </span>
              <span className={text.priceHeadline}>
                {formatCurrencyAUD(proposal.totalMonthlyInclGst.toString())}
              </span>
            </div>
          </div>

          <p className={`mt-3 ${text.muted}`}>
            Service Frequency:{" "}
            <span className="font-medium text-gray-700">{proposal.frequencyOfService}</span>
          </p>
        </section>

        <section id="section-terms" className="mt-10 border-t border-gray-100 pt-6">
          <h2 className={text.sectionLabel}>Terms</h2>
          <p className={`mt-2 max-w-prose leading-6 ${text.small}`}>
            This proposal is valid for 30 days from the date issued. Services will commence on a
            mutually agreed date following acceptance. Either party may terminate the service
            agreement with 30 days&apos; written notice. Payment is due monthly in advance unless
            otherwise agreed in writing.
          </p>
        </section>

        <section id="section-signature-block" className={`mt-12 ${surface.primary} p-6 sm:p-8`}>
          <SignatureSection
            proposalId={proposal.id}
            alreadySigned={!!proposal.signature}
            existingSignature={
              proposal.signature
                ? {
                    typedName: proposal.signature.typedName,
                    signedAt: proposal.signature.signedAt.toISOString(),
                  }
                : null
            }
          />
        </section>
      </div>
    </div>
  );
}
