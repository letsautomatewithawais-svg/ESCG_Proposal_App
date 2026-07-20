import type { Icon } from "@tabler/icons-react";
import {
  IconArmchair,
  IconBed,
  IconBiohazard,
  IconBlender,
  IconBuildingStore,
  IconBucketDroplet,
  IconChefHat,
  IconDesk,
  IconDroplet,
  IconFaceMask,
  IconFirstAidKit,
  IconStethoscope,
  IconToiletPaper,
  IconUsers,
  IconVirus,
} from "@tabler/icons-react";
import { DocumentPage } from "./DocumentPage";
import { BEST_PRACTICE_TIPS, COLOUR_CODE_ROWS, type ColourCodeRow } from "./content";

const ROW_STYLE: Record<ColourCodeRow["color"], { bg: string; text: string; icons: Icon[] }> = {
  blue: { bg: "bg-[#1e3a6e]", text: "text-white", icons: [IconDesk, IconArmchair, IconBed] },
  red: { bg: "bg-[#b23a34]", text: "text-white", icons: [IconToiletPaper, IconDroplet, IconBucketDroplet] },
  yellow: { bg: "bg-[#d9a621]", text: "text-white", icons: [IconBiohazard, IconVirus, IconFaceMask] },
  white: { bg: "bg-white", text: "text-escg-navy", icons: [IconStethoscope, IconUsers, IconFirstAidKit] },
  green: { bg: "bg-[#5a8a3c]", text: "text-white", icons: [IconChefHat, IconBlender, IconBuildingStore] },
};

export function ColourCodingPage() {
  return (
    <DocumentPage id="section-colour-coding" decorated={false}>
      <h2 className="font-display text-xl font-bold text-[#4a8f3c]">
        Colour Coding for Cleaning Equipment
      </h2>
      <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-escg-muted">
        Prevent infections and cross contamination
      </p>

      <div className="mt-6 space-y-3">
        {COLOUR_CODE_ROWS.map((row) => {
          const style = ROW_STYLE[row.color];
          return (
            <div
              key={row.color}
              className={`flex items-center justify-between gap-4 rounded-full border border-escg-hairline px-6 py-4 ${style.bg} ${style.text}`}
            >
              <div className="min-w-0">
                <p className="text-base font-bold uppercase">{row.label}</p>
                <p className="mt-0.5 text-sm opacity-90">{row.description}</p>
              </div>
              <div className="flex shrink-0 gap-2">
                {style.icons.map((IconCmp, index) => (
                  <span
                    key={index}
                    className={`flex h-9 w-9 items-center justify-center rounded-full border ${
                      row.color === "white" ? "border-escg-navy/30" : "border-white/40"
                    }`}
                  >
                    <IconCmp size={18} stroke={1.75} />
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-[4px] bg-escg-navy p-5 sm:p-6">
        <p className="text-xs font-bold uppercase tracking-wide text-white">Best Practice</p>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {BEST_PRACTICE_TIPS.map((tip, index) => (
            <div key={index} className="flex gap-2.5 rounded-[4px] bg-white/10 p-3">
              <span className="text-xs font-bold text-escg-teal">{index + 1}</span>
              <p className="text-xs leading-5 text-white/90">{tip}</p>
            </div>
          ))}
        </div>
      </div>
    </DocumentPage>
  );
}
