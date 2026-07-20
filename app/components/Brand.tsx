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
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.png" alt="Eastern Suburbs Cleaning Group" className="h-8 w-auto shrink-0" />
      {label && (
        <span
          className={`font-sans text-xs font-medium ${dark ? "text-text-muted" : "text-warmgray"}`}
        >
          {label}
        </span>
      )}
    </span>
  );
}
