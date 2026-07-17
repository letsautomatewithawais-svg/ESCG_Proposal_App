// Shared design tokens for the app. Keep component-level styling choices
// (typography scale, status colors, surface elevation) referencing these
// instead of re-guessing Tailwind classes per file.
//
// Palette: ink (primary text), paper (page background), sage (single accent),
// warmgray (muted text), gold (pricing total emphasis only), hairline
// (borders). See app/globals.css for the @theme definitions.

export const text = {
  /** Top-level page heading, e.g. "Proposals", "New Proposal". Serif display face. */
  pageTitle: "font-serif text-2xl font-semibold tracking-tight text-ink sm:text-3xl",
  /** Heading inside a compact card (e.g. login), smaller than a full page title. Serif. */
  cardTitle: "font-serif text-xl font-semibold tracking-tight text-ink",
  /** Larger greeting-style heading, used once per client proposal page. Serif. */
  heroTitle: "font-serif text-3xl font-semibold tracking-tight text-ink sm:text-4xl",
  /** Small uppercase section/group label, e.g. "Pricing", "Scope of Work". */
  sectionLabel: "text-xs font-semibold uppercase tracking-wider text-warmgray",
  /** Standard paragraph copy. */
  body: "text-[15px] leading-7 text-ink/80",
  /** Secondary supporting copy. */
  muted: "text-sm text-warmgray",
  /** Least prominent copy — captions, helper text, timestamps. */
  small: "text-xs text-warmgray",
  /** Form field label. */
  label: "block text-sm font-semibold text-ink",
  /** The single largest, most emphasized figure on a page (e.g. total price). Serif + gold. */
  priceHeadline: "font-serif text-3xl font-bold tracking-tight text-gold",
  /** Layered onto numeric/data values — prices, dates, the UUID — alongside size/color classes. */
  mono: "font-mono tabular-nums",
} as const;

/** Status badge colors — sage is reserved for Signed; every other status stays neutral ink/warmgray. */
export const statusStyles: Record<string, string> = {
  Draft: "border border-hairline text-warmgray",
  Sent: "bg-ink/[0.06] text-ink",
  Opened: "bg-ink/10 font-semibold text-ink",
  Signed: "bg-sage/10 text-sage",
  Lost: "bg-warmgray/10 text-warmgray",
};

/** Elevation: no shadows — hairline borders are the only separator between primary cards and nested sub-sections. */
export const surface = {
  primary: "rounded-[3px] border border-hairline bg-paper",
  nested: "rounded-[3px] border border-hairline bg-ink/[0.035]",
} as const;
