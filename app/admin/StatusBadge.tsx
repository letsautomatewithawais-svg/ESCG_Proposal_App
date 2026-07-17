import { statusStyles } from "@/lib/ui";

export default function StatusBadge({ status }: { status: string }) {
  const className = statusStyles[status] ?? "border border-hairline text-warmgray";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}
    >
      {status}
    </span>
  );
}
