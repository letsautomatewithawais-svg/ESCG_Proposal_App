import { DocumentPage } from "./DocumentPage";
import {
  QUALITY_OBJECTIVE,
  QUALITY_OUTCOMES,
  QUALITY_ROLES,
  QUALITY_STANDARDS,
  QUALITY_WHATSAPP_NOTE,
} from "./content";

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2.5 text-sm leading-6 text-escg-text">
      <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-escg-teal" aria-hidden="true" />
      {children}
    </li>
  );
}

export function QualityMethodologyPage() {
  return (
    <DocumentPage id="section-quality-methodology">
      <h2 className="font-display text-xl font-bold text-escg-navy">Our Quality Methodology</h2>

      <div className="mt-5">
        <h3 className="text-xs font-bold uppercase tracking-wide text-escg-navy">
          Objective &amp; Standards
        </h3>
        <p className="mt-1.5 text-sm leading-6 text-escg-text">{QUALITY_OBJECTIVE}</p>
        <p className="mt-3 text-sm font-medium text-escg-navy">Outcomes we manage:</p>
        <ul className="mt-2 space-y-1.5">
          {QUALITY_OUTCOMES.map((outcome) => (
            <Bullet key={outcome}>{outcome}</Bullet>
          ))}
        </ul>
      </div>

      <div className="mt-6">
        <h3 className="text-xs font-bold uppercase tracking-wide text-escg-navy">
          Roles &amp; Governance
        </h3>
        <ul className="mt-2 space-y-1.5">
          {QUALITY_ROLES.map((role) => (
            <Bullet key={role.role}>
              <span>
                <span className="font-semibold text-escg-navy">{role.role}</span> –{" "}
                {role.description}
              </span>
            </Bullet>
          ))}
        </ul>
        <p className="mt-3 text-sm leading-6 text-escg-text">{QUALITY_WHATSAPP_NOTE}</p>
      </div>

      <div className="mt-6">
        <h3 className="text-xs font-bold uppercase tracking-wide text-escg-navy">
          Standards, SOPs &amp; Compliance
        </h3>
        <ul className="mt-2 space-y-1.5">
          {QUALITY_STANDARDS.map((standard) => (
            <Bullet key={standard}>{standard}</Bullet>
          ))}
        </ul>
      </div>
    </DocumentPage>
  );
}
