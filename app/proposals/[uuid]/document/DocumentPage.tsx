// Shared "A4 page" shell for the client-facing proposal document — every
// page (cover excluded, which has its own unique layout) gets the same
// recurring header (gray diagonal stripes + circular logo badge) and a navy
// diagonal corner accent, matching Tory's sales PDF template.
//
// `break-after-page` (a real Tailwind/CSS break-after utility, not custom
// CSS) is what makes Puppeteer's page.pdf() emit one PDF page per section —
// see app/api/proposals/[uuid]/pdf/route.ts, which relies on @page margin:0
// plus this break for pagination. On screen, pages are stacked with a
// visible gap/shadow (like a document preview) instead of touching edge to
// edge; print:mb-0/print:shadow-none collapse that back down for export.

type DocumentPageProps = {
  id?: string;
  className?: string;
  children: React.ReactNode;
  decorated?: boolean;
  isLast?: boolean;
  /** Cover page only: makes the content column a fixed-height flex column
   * (instead of a min-height block) so a `flex-1` hero image can stretch to
   * fill the rest of the page, matching the sample's near-full-bleed photo
   * instead of a small boxed thumbnail. */
  fill?: boolean;
};

function StripeAccent() {
  return (
    <div className="flex gap-1.5" aria-hidden="true">
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          className="h-7 w-3 -skew-x-[20deg] bg-escg-stripe"
          style={{ opacity: 1 - i * 0.18 }}
        />
      ))}
    </div>
  );
}

export function DocumentPage({
  id,
  className = "",
  children,
  decorated = true,
  isLast = false,
  fill = false,
}: DocumentPageProps) {
  return (
    <section
      id={id}
      className={`relative mx-auto mb-8 w-full max-w-[210mm] overflow-hidden bg-white shadow-[0_1px_2px_rgba(20,35,55,0.08),0_24px_48px_-28px_rgba(20,35,55,0.45)] print:mb-0 print:shadow-none ${
        isLast ? "" : "break-after-page"
      } ${className}`}
    >
      {decorated && (
        <>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute right-0 top-0 h-16 w-16 bg-escg-navy sm:h-24 sm:w-24"
            style={{ clipPath: "polygon(100% 0, 100% 100%, 0 0)" }}
          />
          <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between px-6 pt-6 sm:px-[18mm] sm:pt-[12mm]">
            <StripeAccent />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-icon.png" alt="" className="h-20 w-20 shrink-0 object-contain sm:h-24 sm:w-24" />
          </div>
        </>
      )}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 right-0 h-20 w-20 bg-escg-navy sm:h-28 sm:w-28"
        style={{ clipPath: "polygon(100% 0, 100% 100%, 0 100%)" }}
      />
      <div
        className={`relative px-6 pb-10 sm:px-[18mm] sm:pb-[16mm] ${
          decorated ? "pt-24 sm:pt-[34mm]" : "pt-10 sm:pt-[16mm]"
        } ${fill ? "flex h-[297mm] flex-col" : "min-h-[297mm]"}`}
      >
        {children}
      </div>
    </section>
  );
}
