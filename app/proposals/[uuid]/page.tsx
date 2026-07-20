import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase";
import { formatCurrencyAUD } from "@/lib/format";
import { DEFAULT_TIMEZONE } from "@/lib/timezone";
import ProposalTracker from "./ProposalTracker";
import { CoverPage } from "./document/CoverPage";
import { LetterPage } from "./document/LetterPage";
import { FeaturesPage } from "./document/FeaturesPage";
import { ScopeOfWorkPage } from "./document/ScopeOfWorkPage";
import { SchedulingPricingInsurancePage } from "./document/SchedulingPricingInsurancePage";
import { TermsPage } from "./document/TermsPage";
import { AdditionalServicesPage } from "./document/AdditionalServicesPage";
import { AcceptancePage } from "./document/AcceptancePage";
import { QualityMethodologyPage } from "./document/QualityMethodologyPage";
import { ColourCodingPage } from "./document/ColourCodingPage";
import { MicrofibrePage } from "./document/MicrofibrePage";

// Must always reflect live status/signature state — never statically prerendered.
export const dynamic = "force-dynamic";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Matches the sample PDF's "07-02-2026" cover-page date style — distinct
// from lib/format.ts's formatDateAU ("7 Feb 2026"), which is still used
// elsewhere (admin) and isn't the look this document matches.
//
// This is Tory's client-facing document for an Australian client, so its
// date must always read as Australian local time — regardless of which
// timezone the server happens to render in (Vercel's functions run in UTC)
// or where the admin/client's own browser is. Explicit timeZone (not the
// runtime's implicit local one) via formatToParts, since date.getDate() /
// getMonth() only ever reflect the executing runtime's own local zone.
function formatDateDDMMYYYY(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-AU", {
    timeZone: DEFAULT_TIMEZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)!.value;
  return `${get("day")}-${get("month")}-${get("year")}`;
}

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

  const { data: proposal, error: proposalError } = await supabaseAdmin
    .from("Proposal")
    .select("*")
    .eq("id", uuid)
    .maybeSingle();

  if (proposalError) throw proposalError;
  if (!proposal) {
    notFound();
  }

  const { data: signature, error: signatureError } = await supabaseAdmin
    .from("Signature")
    .select("typedName, signedAt, signatureImage")
    .eq("proposalId", uuid)
    .maybeSingle();

  if (signatureError) throw signatureError;

  const dateIssuedDisplay = formatDateDDMMYYYY(new Date(proposal.createdAt));
  const walkThroughDateDisplay = new Intl.DateTimeFormat("en-AU", {
    dateStyle: "full",
    timeZone: DEFAULT_TIMEZONE,
  }).format(new Date(proposal.walkThroughDate));

  return (
    <div className="min-h-screen bg-[#eef1f4] px-0 py-0 font-sans print:bg-white print:px-0! print:py-0! sm:px-4 sm:py-10">
      {!isPrintMode && <ProposalTracker proposalId={proposal.id} />}
      {!isPrintMode && (
        <div className="mx-auto mb-4 w-full max-w-[210mm] px-6 text-right sm:px-0">
          <a
            href={`/api/proposals/${proposal.id}/pdf`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-escg-teal hover:text-escg-teal/80"
          >
            Download PDF
          </a>
        </div>
      )}

      <CoverPage
        companyName={proposal.companyName}
        companyAddress={proposal.companyAddress}
        dateIssuedDisplay={dateIssuedDisplay}
      />
      <LetterPage clientName={proposal.clientName} />
      <FeaturesPage />
      <ScopeOfWorkPage scopeOfWork={proposal.scopeOfWork} />
      <SchedulingPricingInsurancePage
        frequencyOfService={proposal.frequencyOfService}
        schedulingDay={proposal.schedulingDay}
        schedulingTime={proposal.schedulingTime}
        walkThroughDateDisplay={walkThroughDateDisplay}
        pricePerVisitDisplay={formatCurrencyAUD(proposal.pricePerVisit)}
        monthlyCostExclGstDisplay={formatCurrencyAUD(proposal.monthlyCostExclGst)}
        totalMonthlyInclGstDisplay={formatCurrencyAUD(proposal.totalMonthlyInclGst)}
      />
      <TermsPage />
      <AdditionalServicesPage />
      <AcceptancePage
        companyName={proposal.companyName}
        clientName={proposal.clientName}
        dateIssuedDisplay={dateIssuedDisplay}
        proposalId={proposal.id}
        alreadySigned={!!signature}
        existingSignature={
          signature
            ? {
                typedName: signature.typedName,
                signedAt: new Date(signature.signedAt).toISOString(),
                signatureImage: signature.signatureImage,
              }
            : null
        }
        printMode={isPrintMode}
      />
      <QualityMethodologyPage />
      <ColourCodingPage />
      <MicrofibrePage />
    </div>
  );
}
