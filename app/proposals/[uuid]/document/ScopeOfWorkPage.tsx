import { DocumentPage } from "./DocumentPage";

// Admin enters scopeOfWork as free text, one line item per line (see the
// textarea placeholder in app/admin/new/page.tsx) — split on newlines into
// bullets rather than rendering it as a single paragraph, matching the
// sample PDF's bulleted "Scope Of Work" page. Lines that are already
// bulleted ("- " or "• ") have that marker stripped so it isn't doubled up.
function toBullets(scopeOfWork: string): string[] {
  return scopeOfWork
    .split("\n")
    .map((line) => line.trim().replace(/^[-•]\s*/, ""))
    .filter(Boolean);
}

export function ScopeOfWorkPage({ scopeOfWork }: { scopeOfWork: string }) {
  const bullets = toBullets(scopeOfWork);

  return (
    <DocumentPage id="section-scope-of-work">
      <h2 className="font-display text-xl font-bold text-escg-navy">Scope Of Work</h2>

      <ul className="mt-6 space-y-2.5">
        {bullets.map((bullet, index) => (
          <li key={index} className="flex gap-2.5 text-sm leading-6 text-escg-text">
            <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-escg-teal" aria-hidden="true" />
            {bullet}
          </li>
        ))}
      </ul>
    </DocumentPage>
  );
}
