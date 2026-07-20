import { DocumentPage } from "./DocumentPage";
import { TERMS_SECTIONS } from "./content";

export function TermsPage() {
  return (
    <DocumentPage id="section-terms">
      <h2 className="font-display text-xl font-bold text-escg-navy">Terms Of Service</h2>

      <div className="mt-5 space-y-4">
        {TERMS_SECTIONS.map((section) => (
          <div key={section.heading}>
            <h3 className="text-xs font-bold uppercase tracking-wide text-escg-navy">
              {section.heading}
            </h3>
            <p className="mt-1.5 text-sm leading-6 text-escg-text">{section.body}</p>
          </div>
        ))}
      </div>
    </DocumentPage>
  );
}
