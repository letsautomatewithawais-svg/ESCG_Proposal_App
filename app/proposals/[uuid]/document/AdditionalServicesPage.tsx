import { DocumentPage } from "./DocumentPage";
import { ADDITIONAL_SERVICES, ADDITIONAL_SERVICES_INTRO } from "./content";

export function AdditionalServicesPage() {
  return (
    <DocumentPage id="section-additional-services">
      <h2 className="font-display text-xl font-bold text-escg-navy">Additional Services We Offer</h2>
      <p className="mt-3 text-sm leading-6 text-escg-text">{ADDITIONAL_SERVICES_INTRO}</p>

      <ul className="mt-6 space-y-3">
        {ADDITIONAL_SERVICES.map((service) => (
          <li key={service} className="flex items-center gap-2.5">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-escg-teal" aria-hidden="true" />
            <span className="text-sm font-semibold text-escg-navy">{service}</span>
          </li>
        ))}
      </ul>
    </DocumentPage>
  );
}
