const HAS_ZONE_DESIGNATOR = /[Zz]|[+-]\d{2}:?\d{2}$/;

// Every timestamp column in this app is Postgres `timestamp` (no time zone) —
// see prisma/schema.prisma / database-updates.sql. All writes go in as UTC
// clock digits (`.toISOString()` or the DB's `now()`, whose session TimeZone
// is UTC), so the value read back is always a UTC instant — it just arrives
// as a string with no "Z", e.g. "2026-07-19T20:36:09.5". `new Date(...)` on
// a string like that is parsed as *local time of whatever runtime calls it*
// (browser or server, whichever's local TZ isn't UTC), silently shifting the
// instant. Stamp the "Z" back on before it ever reaches `new Date(...)` so
// parsing is unambiguous everywhere, regardless of client/server TZ.
export function utcIso(value: string): string;
export function utcIso(value: string | null | undefined): string | null;
export function utcIso(value: string | null | undefined): string | null {
  if (!value) return null;
  return HAS_ZONE_DESIGNATOR.test(value) ? value : `${value}Z`;
}
