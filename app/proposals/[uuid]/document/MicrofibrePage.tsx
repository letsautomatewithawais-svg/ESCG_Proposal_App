import { IconCheck } from "@tabler/icons-react";
import { DocumentPage } from "./DocumentPage";
import { MICROFIBRE_CLOTH_STEPS, MICROFIBRE_MOP_STEPS } from "./content";

function ChecklistColumn({
  title,
  steps,
  photoSrc,
}: {
  title: string;
  steps: string[];
  photoSrc: string;
}) {
  return (
    <div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={photoSrc} alt="" className="h-32 w-full rounded-[4px] object-cover" />
      <h3 className="mt-3 font-display text-base font-bold text-escg-navy">{title}</h3>
      <ul className="mt-3 space-y-2.5">
        {steps.map((step, index) => (
          <li key={index} className="flex gap-2.5">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-escg-teal-tint text-escg-teal">
              <IconCheck size={13} stroke={2.5} />
            </span>
            <p className="text-sm leading-5 text-escg-text">{step}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function MicrofibrePage() {
  return (
    <DocumentPage id="section-microfibre" decorated={false} isLast>
      <div className="relative overflow-hidden rounded-[4px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/cleaning-closet.jpg" alt="" className="h-32 w-full object-cover sm:h-36" />
        <div className="absolute inset-0 bg-gradient-to-r from-escg-navy/85 via-escg-navy/60 to-escg-teal/50" />
        <h2 className="absolute inset-0 flex flex-col justify-center px-6 font-display text-lg font-bold leading-tight text-white sm:px-8 sm:text-xl">
          Microfibre Cloth &amp; Mop
          <br />
          Sanitising Procedures
        </h2>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <ChecklistColumn
          title="Sanitising of Microfibre Cloths"
          steps={MICROFIBRE_CLOTH_STEPS}
          photoSrc="/microfibre-cloths.jpg"
        />
        <ChecklistColumn
          title="Sanitising Mop Heads"
          steps={MICROFIBRE_MOP_STEPS}
          photoSrc="/mop-heads.jpg"
        />
      </div>
    </DocumentPage>
  );
}
