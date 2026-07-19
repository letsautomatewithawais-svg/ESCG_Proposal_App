import Link from "next/link";
import type { ComponentType } from "react";
import {
  IconClipboardList,
  IconEye,
  IconPlus,
  IconRosetteDiscountCheck,
  IconSend,
  IconX,
} from "@tabler/icons-react";
import { brand } from "@/lib/ui";
import { formatRelativeTime } from "@/lib/format";

type StatIconType = ComponentType<{ size?: number; stroke?: number; className?: string }>;

type StatSummary = {
  count: number;
  trendPercent: number | null;
  trendRaw: number;
};

function TrendLabel({ trendPercent, trendRaw }: { trendPercent: number | null; trendRaw: number }) {
  if (trendPercent === null && trendRaw === 0) return null;

  const isUp = trendRaw >= 0;
  const colorClass = isUp ? "text-brand-green" : "text-red";
  const text =
    trendPercent === null
      ? `${Math.abs(trendRaw)} new`
      : trendPercent === 0
        ? "No change"
        : `${Math.abs(trendPercent)}%`;

  return (
    <span className={`text-xs font-bold ${colorClass}`}>
      {isUp ? "↑" : "↓"} {text}{" "}
      <span className="font-medium text-text-muted">vs last 30 days</span>
    </span>
  );
}

function StatCard({
  label,
  stat,
  icon: Icon,
  chipClassName,
  iconClassName,
}: {
  label: string;
  stat: StatSummary;
  icon?: StatIconType;
  chipClassName?: string;
  iconClassName?: string;
}) {
  return (
    <div className={`${brand.card} flex flex-col p-3.5`}>
      <div className="flex items-start justify-between gap-2">
        <p className={`${brand.label} whitespace-nowrap`}>{label}</p>
        {Icon && (
          <div className={`${brand.iconChip} h-6 w-6 ${chipClassName}`}>
            <Icon size={12} stroke={2} className={iconClassName} />
          </div>
        )}
      </div>
      {/* Proportional display font + tabular-nums, not the monospace ticket
          font — a true monospace face on a headline KPI number is a known
          "makes the whole dashboard read like a terminal" mistake. tabular-nums
          alone already gives the fixed-width digit alignment that mono was
          otherwise being used for. */}
      <p className="mt-1.5 font-display text-xl font-bold leading-none tracking-tight tabular-nums text-content-charcoal">
        {stat.count}
      </p>
      <div className="mt-1 h-3.5">
        <TrendLabel trendPercent={stat.trendPercent} trendRaw={stat.trendRaw} />
      </div>
    </div>
  );
}

type StatStripProps = {
  total: StatSummary;
  sent: StatSummary;
  opened: StatSummary;
  signed: StatSummary;
  lost: StatSummary;
  lastActivityAt: string | null;
};

// Rendered exclusively by /admin's own page.tsx now (not a shared layout
// that also wraps /admin/[id]), so it no longer needs to check the current
// route itself.
export default function StatStrip({ total, sent, opened, signed, lost, lastActivityAt }: StatStripProps) {
  return (
    <div className="border-b border-hairline bg-surface-off px-6 py-4 sm:px-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-xl text-content-charcoal sm:text-2xl">Proposals</h1>
          <p className="mt-0.5 text-xs text-text-muted">
            {total.count} {total.count === 1 ? "proposal" : "proposals"}
            {lastActivityAt &&
              ` · Last activity ${formatRelativeTime(new Date(lastActivityAt))}`}
          </p>
        </div>
        <Link
          href="/admin/new"
          className={`flex shrink-0 items-center gap-1.5 rounded-full bg-brand-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-primary/90 active:scale-[0.98] ${brand.focusRing}`}
        >
          <IconPlus size={16} stroke={2.25} />
          New Proposal
        </Link>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard
          label="Total Proposals"
          stat={total}
          icon={IconClipboardList}
          chipClassName="bg-neutral-tint"
          iconClassName="text-content-charcoal/70"
        />
        <StatCard
          label="Sent"
          stat={sent}
          icon={IconSend}
          chipClassName="bg-blue-tint"
          iconClassName="text-blue"
        />
        <StatCard
          label="Opened"
          stat={opened}
          icon={IconEye}
          chipClassName="bg-amber-tint"
          iconClassName="text-amber"
        />
        <StatCard
          label="Signed"
          stat={signed}
          icon={IconRosetteDiscountCheck}
          chipClassName="bg-brand-green-tint"
          iconClassName="text-brand-green"
        />
        <StatCard
          label="Lost"
          stat={lost}
          icon={IconX}
          chipClassName="bg-red-tint"
          iconClassName="text-red"
        />
      </div>
    </div>
  );
}
