import SignatureSection from "../SignatureSection";
import { DocumentPage } from "./DocumentPage";

type AcceptancePageProps = {
  companyName: string;
  clientName: string;
  dateIssuedDisplay: string;
  proposalId: string;
  alreadySigned: boolean;
  existingSignature: { typedName: string; signedAt: string; signatureImage: string } | null;
  printMode: boolean;
};

export function AcceptancePage({
  companyName,
  clientName,
  dateIssuedDisplay,
  proposalId,
  alreadySigned,
  existingSignature,
  printMode,
}: AcceptancePageProps) {
  return (
    <DocumentPage id="section-signature-block">
      <h2 className="font-display text-xl font-bold text-escg-navy">
        Proposal Acceptance &amp; Authorisation
      </h2>
      <p className="mt-3 text-sm leading-6 text-escg-text">
        By signing below, both parties agree to the terms outlined in this proposal. This
        agreement shall take effect upon the date of the last signature.
      </p>

      <div className="mt-6 space-y-1.5 text-sm text-escg-text">
        <p>
          <span className="text-escg-muted">For </span>
          <span className="font-medium">{companyName}</span>
        </p>
        <p>
          <span className="text-escg-muted">Name: </span>
          <span className="font-medium">{clientName}</span>
        </p>
        <p>
          <span className="text-escg-muted">Date: </span>
          <span className="font-medium">{dateIssuedDisplay}</span>
        </p>
      </div>

      <div className="mt-8 rounded-[4px] border border-escg-hairline bg-white p-5 sm:p-6">
        <SignatureSection
          proposalId={proposalId}
          alreadySigned={alreadySigned}
          existingSignature={existingSignature}
          printMode={printMode}
        />
      </div>
    </DocumentPage>
  );
}
