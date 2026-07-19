"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

// The global search box that used to live here was purely decorative (never
// wired to anything) — replaced by the real, working search in
// ProposalsTable's filter row instead of keeping two search boxes where only
// one actually works. The notification bell that used to sit here was
// removed for the same reason: no notification system exists yet (see the
// dev brief audit — Tory notifications are the one remaining built gap), so
// showing a bell with nothing behind it was a fake affordance, not a feature.
//
// Reads ?selected= directly (rather than the page passing a prop) so it
// stays in sync with ProposalsWorkspace's own client-side selection state
// without needing to thread that state through the layout tree.
export default function Topbar() {
  const searchParams = useSearchParams();
  const isDetailView = Boolean(searchParams.get("selected"));

  return (
    <div className="flex items-center gap-1.5 border-b border-hairline px-6 py-3 sm:px-8">
      <Link
        href="/admin"
        scroll={false}
        className={`text-sm font-medium transition-colors ${
          isDetailView ? "text-text-muted hover:text-content-charcoal" : "text-content-charcoal"
        }`}
      >
        Proposals
      </Link>
      {isDetailView && (
        <>
          <span className="text-sm text-text-muted">/</span>
          <span className="text-sm font-medium text-content-charcoal">Details</span>
        </>
      )}
    </div>
  );
}
