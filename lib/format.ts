export function referenceNumber(id: string): string {
  return id.slice(0, 8).toUpperCase();
}

export function formatCurrencyAUD(value: number | string): string {
  return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(
    Number(value),
  );
}

// `timeZone` defaults to undefined — Intl.DateTimeFormat then falls back to
// the executing runtime's own local zone (the browser's for a client
// component, the server's for SSR), which is exactly the ambiguity that
// prompted adding this param: pass an explicit IANA zone (see
// lib/timezone.ts) wherever "whose local time is this" actually matters.
export function formatDateAU(date: Date, timeZone?: string): string {
  return new Intl.DateTimeFormat("en-AU", { dateStyle: "medium", timeZone }).format(date);
}

export function formatDateTimeAU(date: Date, timeZone?: string): string {
  return new Intl.DateTimeFormat("en-AU", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone,
  }).format(date);
}

export function formatDateTimeAUWithSeconds(date: Date, timeZone?: string): string {
  return new Intl.DateTimeFormat("en-AU", {
    dateStyle: "medium",
    timeStyle: "medium",
    timeZone,
  }).format(date);
}

export function formatDurationSeconds(totalSeconds: number): string {
  const seconds = Math.max(0, Math.round(totalSeconds));
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

const RELATIVE_TIME_DIVISIONS: { amount: number; unit: Intl.RelativeTimeFormatUnit }[] = [
  { amount: 60, unit: "seconds" },
  { amount: 60, unit: "minutes" },
  { amount: 24, unit: "hours" },
  { amount: 7, unit: "days" },
  { amount: 4.34524, unit: "weeks" },
  { amount: 12, unit: "months" },
  { amount: Number.POSITIVE_INFINITY, unit: "years" },
];

export function formatRelativeTime(date: Date, now: Date = new Date()): string {
  let duration = (date.getTime() - now.getTime()) / 1000;
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "always" });

  for (const division of RELATIVE_TIME_DIVISIONS) {
    if (Math.abs(duration) < division.amount) {
      return rtf.format(Math.round(duration), division.unit);
    }
    duration /= division.amount;
  }

  return rtf.format(Math.round(duration), "years");
}
