import type { ComponentType } from "react";
import { IconCheck, IconEye, IconFileText, IconSend, IconX } from "@tabler/icons-react";

const PILL_BASE =
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide shadow-[0_1px_1px_rgba(16,24,40,0.03)]";

type StatusVisual = {
  icon: ComponentType<{ size?: number; stroke?: number; className?: string }>;
  chipClassName: string;
  iconClassName: string;
  pillClassName: string;
};

const DEFAULT_VISUAL: StatusVisual = {
  icon: IconFileText,
  chipClassName: "bg-neutral-tint",
  iconClassName: "text-text-muted",
  pillClassName: "border-hairline bg-white text-text-muted",
};

// Single source of truth for each status's color/icon — used by both the
// pill badge below and ProposalRow's row-leading icon chip, so the two never
// drift out of sync. Signed=green, Sent=blue, Opened=amber, Lost=red,
// Draft/unrecognized=neutral.
const STATUS_VISUALS: Record<string, StatusVisual> = {
  Signed: {
    icon: IconCheck,
    chipClassName: "bg-brand-green-tint",
    iconClassName: "text-brand-green",
    pillClassName: "border-brand-green/40 bg-brand-green-tint text-brand-green",
  },
  Sent: {
    icon: IconSend,
    chipClassName: "bg-blue-tint",
    iconClassName: "text-blue",
    pillClassName: "border-blue/40 bg-blue-tint text-blue",
  },
  Opened: {
    icon: IconEye,
    chipClassName: "bg-amber-tint",
    iconClassName: "text-amber",
    pillClassName: "border-amber/40 bg-amber-tint text-amber",
  },
  Lost: {
    icon: IconX,
    chipClassName: "bg-red-tint",
    iconClassName: "text-red",
    pillClassName: "border-red/40 bg-red-tint text-red",
  },
};

export function statusVisual(status: string): StatusVisual {
  return STATUS_VISUALS[status] ?? DEFAULT_VISUAL;
}

function Dot({ className }: { className: string }) {
  return <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${className}`} aria-hidden="true" />;
}

// Every status gets the same pill treatment (bordered, icon-or-dot + label),
// each with its own color so the list is scannable by color at a glance —
// Signed=green, Sent=blue, Opened=amber, Lost=red, Draft=neutral. Shared
// between the proposals list (ProposalRow.tsx) and the ticket detail page
// ([id]/page.tsx) so the two never drift apart.
export default function StatusPill({ status }: { status: string }) {
  const visual = statusVisual(status);
  const Icon = visual.icon;

  if (status === "Signed" || status === "Sent" || status === "Lost") {
    return (
      <span className={`${PILL_BASE} ${visual.pillClassName}`}>
        <Icon size={12} stroke={2.75} />
        {status}
      </span>
    );
  }
  if (status === "Opened") {
    return (
      <span className={`${PILL_BASE} ${visual.pillClassName}`}>
        <Dot className="bg-amber" />
        Opened
      </span>
    );
  }
  // Draft and anything else unrecognized
  return (
    <span className={`${PILL_BASE} ${visual.pillClassName}`}>
      <Dot className="bg-text-muted/60" />
      {status}
    </span>
  );
}
