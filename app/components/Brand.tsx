type BrandProps = {
  label?: string;
};

export function Brand({ label }: BrandProps) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="h-2.5 w-2.5 shrink-0 bg-sage" aria-hidden="true" />
      <span className="inline-flex items-baseline gap-1.5">
        <span className="font-serif text-sm font-semibold tracking-tight text-ink [font-variant-caps:small-caps]">
          escg
        </span>
        {label && <span className="font-sans text-xs font-medium text-warmgray">{label}</span>}
      </span>
    </span>
  );
}
