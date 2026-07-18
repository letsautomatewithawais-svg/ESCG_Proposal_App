type BrandProps = {
  label?: string;
  /** For placement on a dark surface (e.g. the admin sidebar). Every other
   * call site (login, client proposal page, mobile admin header) stays on
   * its default light styling — this is an explicit opt-in, not a new default. */
  dark?: boolean;
};

export function Brand({ label, dark = false }: BrandProps) {
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className={`h-2.5 w-2.5 shrink-0 ${dark ? "bg-brand-green" : "bg-sage"}`}
        aria-hidden="true"
      />
      <span className="inline-flex items-baseline gap-1.5">
        <span
          className={`font-serif text-sm font-semibold tracking-tight [font-variant-caps:small-caps] ${
            dark ? "text-surface-off" : "text-ink"
          }`}
        >
          escg
        </span>
        {label && (
          <span
            className={`font-sans text-xs font-medium ${dark ? "text-text-muted" : "text-warmgray"}`}
          >
            {label}
          </span>
        )}
      </span>
    </span>
  );
}
