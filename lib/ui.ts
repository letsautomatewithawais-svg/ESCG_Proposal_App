// Shared design tokens for the app. Keep component-level styling choices
// (typography scale, status colors, surface elevation) referencing these
// instead of re-guessing Tailwind classes per file.
//
// Palette: ink (primary text), paper (page background), sage (single accent),
// warmgray (muted text), gold (pricing total emphasis only), hairline
// (borders). See app/globals.css for the @theme definitions.

// Fired by the admin Topbar's manual refresh button so client components
// with their own fetch (unreached by Next's router.refresh()) — currently
// ProposalDetailPanel — can reload too.
export const REFRESH_EVENT = "escg:refresh";

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

/**
 * Restrained "brand green" identity tokens — now the app's only admin
 * identity. The "service ticket" concept that previously lived here (a
 * `ticket` token object plus ticket-ink/paper/steel/stamp/caution in
 * globals.css) has been fully migrated off and removed.
 */
export const brand = {
  /** Small uppercase muted label — sidebar nav group headers, stat card labels, detail-pane field labels. */
  label: "text-[11px] font-semibold uppercase tracking-wider text-text-muted",
  /** Small reference/ticket-ID label, e.g. a work order or PO number. Sized
   * explicitly (~11px) so it stays visually secondary to whatever heading
   * it sits near — without an explicit size it falls back to the browser
   * default (16px), which reads larger than a 14px name above it. */
  number: "font-ticket-mono text-[11px] uppercase tracking-wide text-text-muted",
  /**
   * Small rounded status pill. Deliberately has no color of its own —
   * compose with a per-status background/text pair at the call site
   * (bg-brand-green-tint/text-brand-green for Signed, bg-amber-tint/text-amber
   * for Opened) since those tints are each reserved for exactly one status.
   */
  pill: "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
  /**
   * Elevation system — "border-first" (Vercel's stated philosophy): a crisp
   * hairline border carries most static surfaces, shadow is a soft, low-
   * opacity ambient layer tinted to content-charcoal (not pure black) rather
   * than one harsh default shadow. Radius scale is deliberate, not one
   * repeated value: 6px controls/inputs, 8px buttons, 12px cards/panels,
   * 16px floating/dropdown surfaces, full for pills/avatars — see individual
   * tokens below.
   *
   * `card` = static surfaces (detail-page cards — still has a soft ambient
   * shadow since those are discrete stacked panels on an open canvas).
   * `panel` = flat, dense working surfaces (the proposals table/list) — a
   * reference dashboard (Stripe) uses almost no shadow at all on these, just
   * a 1px border, so this tier is deliberately flatter than `card`.
   * `cardHover` = add alongside `transition-shadow` for anything clickable.
   * `floating` = anything that hovers above content — dropdowns, popovers.
   */
  card: "rounded-[12px] border border-hairline/70 bg-white shadow-[0_2px_2px_rgba(31,36,33,0.03),0_8px_20px_-8px_rgba(31,36,33,0.10)]",
  panel: "rounded-[8px] border border-hairline bg-white",
  cardHover:
    "hover:shadow-[0_2px_4px_rgba(31,36,33,0.05),0_16px_32px_-10px_rgba(31,36,33,0.16)]",
  floating:
    "rounded-[10px] border border-hairline/70 bg-white shadow-[0_1px_1px_rgba(31,36,33,0.02),0_4px_8px_-4px_rgba(31,36,33,0.06),0_16px_24px_-8px_rgba(31,36,33,0.10)]",
  /** Inline filter control, restyled as a compact pill instead of a boxed
   * label-over-input field — the denser, more restrained pattern a reference
   * dashboard (Stripe) uses for its filter row. */
  filterPill:
    "flex items-center gap-1.5 rounded-full border border-hairline bg-neutral-tint px-3 py-1.5 text-xs text-content-charcoal transition-colors focus-within:border-brand-primary",
  /** Small colored circular chip behind a standalone icon (stat cards, card
   * headers). Compose with a per-context bg/text pair, e.g.
   * `bg-brand-green-tint text-brand-green` for the Signed stat,
   * `bg-brand-primary-tint text-brand-primary` for brand/neutral chips. */
  iconChip: "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
  /**
   * Custom focus-visible ring (brand-primary, offset so it reads as floating
   * rather than a hard outline) — use instead of ad-hoc
   * `focus:ring-1 focus:ring-brand-primary` on new interactive elements.
   */
  focusRing:
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-off",
  /** Button-press micro-interaction — cheap, GPU-only, one of the more
   * noticeable "this was actually designed" signals on click. */
  pressable: "transition-transform active:scale-[0.97]",
} as const;
