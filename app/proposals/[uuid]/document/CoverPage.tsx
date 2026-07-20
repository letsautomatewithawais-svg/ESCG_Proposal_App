import { DocumentPage } from "./DocumentPage";

type CoverPageProps = {
  companyName: string;
  companyAddress: string;
  dateIssuedDisplay: string;
};

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 border-b border-escg-hairline py-2.5 sm:flex-row sm:items-baseline sm:gap-6">
      <span className="w-32 shrink-0 text-sm text-escg-muted">{label}</span>
      <span className="text-sm font-medium text-escg-text">{value}</span>
    </div>
  );
}

export function CoverPage({ companyName, companyAddress, dateIssuedDisplay }: CoverPageProps) {
  return (
    <DocumentPage id="section-cover" decorated={false} fill>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 -mx-6 h-10 bg-escg-navy sm:-mx-[18mm] sm:h-14"
        style={{ left: 0, right: 0, clipPath: "polygon(0 0, 64% 0, 38% 100%, 0 100%)" }}
      />
      <div className="relative z-10 shrink-0">
        <div className="flex items-start gap-4 sm:gap-6">
          <div className="flex shrink-0 gap-1.5" aria-hidden="true">
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className="h-9 w-4 -skew-x-[20deg] bg-escg-stripe" style={{ opacity: 1 - i * 0.18 }} />
            ))}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="inline-block border-b-2 border-escg-navy pb-1 font-display text-base font-bold uppercase tracking-tight text-escg-navy sm:text-xl">
              Eastern Suburbs Cleaning Group Pty Ltd
            </h1>
            <p className="mt-3 font-display text-2xl font-bold leading-tight text-escg-navy sm:text-4xl">
              Cleaning Services Proposal
            </p>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-icon.png" alt="Eastern Suburbs Cleaning Group" className="h-16 w-16 shrink-0 sm:h-20 sm:w-20" />
        </div>

        <div className="mt-6 border-t border-escg-hairline sm:mt-8">
          <Row label="Prepared For" value={companyName} />
          <Row label="Location" value={companyAddress} />
          <Row label="Date" value={dateIssuedDisplay} />
        </div>
      </div>

      {/* Full-bleed hero photo — breaks out of the page's own side/bottom
          padding (negative margins exactly cancel it) so the photo reaches
          the true page edges on the left, right and bottom, matching the
          sample, instead of sitting inset like the rest of the content. */}
      <div className="relative mt-6 -mx-6 -mb-10 min-h-0 flex-1 overflow-hidden sm:mt-8 sm:-mx-[18mm] sm:-mb-[16mm]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/cover-hero.jpg" alt="" className="h-full w-full object-cover" />
      </div>
    </DocumentPage>
  );
}
