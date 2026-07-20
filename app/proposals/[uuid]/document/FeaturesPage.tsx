import { IconCheck } from "@tabler/icons-react";
import { DocumentPage } from "./DocumentPage";
import { FEATURES } from "./content";

export function FeaturesPage() {
  return (
    <DocumentPage id="section-features">
      <h2 className="font-display text-xl font-bold text-escg-navy">
        What you get with our services
      </h2>

      <ul className="mt-6 space-y-4">
        {FEATURES.map((feature) => (
          <li key={feature.title} className="flex gap-3">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-escg-teal-tint text-escg-teal">
              <IconCheck size={13} stroke={2.5} />
            </span>
            <p className="text-sm leading-6 text-escg-text">
              <span className="font-semibold text-escg-navy">{feature.title}</span> —{" "}
              {feature.description}
            </p>
          </li>
        ))}
      </ul>
    </DocumentPage>
  );
}
