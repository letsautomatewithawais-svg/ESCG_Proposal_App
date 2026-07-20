// The business (Eastern Suburbs Cleaning Group) and its client are in
// Australia, but the admin viewing this dashboard may not be — dates
// previously formatted without an explicit IANA timeZone silently fall back
// to whatever timezone the rendering runtime (browser or server) happens to
// be in, which is meaningless/confusing for both the client-facing document
// (must always read as Australian local time, regardless of server/viewer
// location) and the admin dashboard (viewer may be anywhere and wants to
// pick which zone timestamps display in).
export const DEFAULT_TIMEZONE = "Australia/Sydney";

// Curated, not exhaustive — the admin's actual location plus every distinct
// Australian mainland time zone, so "what time was it there when they opened
// this" is answerable without a long IANA list to scroll through.
export const TIMEZONE_OPTIONS = [
  { value: "Australia/Sydney", label: "Sydney / Melbourne / Canberra / Hobart (AEST/AEDT)" },
  { value: "Australia/Brisbane", label: "Brisbane (AEST)" },
  // Adelaide observes daylight saving, Darwin doesn't — same standard
  // offset (ACST) but they diverge for roughly half the year, so these stay
  // two separate IANA zones rather than one combined option.
  { value: "Australia/Adelaide", label: "Adelaide (ACST/ACDT)" },
  { value: "Australia/Darwin", label: "Darwin (ACST)" },
  { value: "Australia/Perth", label: "Perth (AWST)" },
  { value: "Asia/Karachi", label: "Karachi / Islamabad (PKT)" },
  { value: "UTC", label: "UTC" },
] as const;
