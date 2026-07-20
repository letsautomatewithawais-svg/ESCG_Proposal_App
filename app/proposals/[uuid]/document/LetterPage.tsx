import { DocumentPage } from "./DocumentPage";
import { FOUNDER, LETTER_PARAGRAPHS } from "./content";

export function LetterPage({ clientName }: { clientName: string }) {
  return (
    <DocumentPage id="section-introduction">
      <p className="text-sm text-escg-text">Dear {clientName},</p>

      <div className="mt-5 space-y-4 text-sm leading-6 text-escg-text">
        {LETTER_PARAGRAPHS.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>

      <div className="mt-8">
        <p className="text-sm text-escg-text">Sincerely,</p>
        <p className="mt-4 font-signature text-4xl text-escg-navy">{FOUNDER.name}</p>
        <p className="mt-1 text-sm font-semibold text-escg-navy">{FOUNDER.name}</p>
        <p className="text-sm text-escg-muted">{FOUNDER.title}</p>
        <p className="mt-2 text-sm text-escg-muted">{FOUNDER.phone}</p>
        <p className="text-sm text-escg-muted">{FOUNDER.website}</p>
        <p className="text-sm text-escg-muted">{FOUNDER.email}</p>
      </div>
    </DocumentPage>
  );
}
