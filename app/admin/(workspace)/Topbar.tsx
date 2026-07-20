"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { IconRefresh } from "@tabler/icons-react";
import { REFRESH_EVENT } from "@/lib/ui";

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
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDetailView = Boolean(searchParams.get("selected"));
  const [isRefreshing, setIsRefreshing] = useState(false);

  function handleRefresh() {
    setIsRefreshing(true);
    router.refresh();
    // ProposalDetailPanel listens for this to reload its own client-side
    // fetch, which router.refresh() alone doesn't reach.
    window.dispatchEvent(new Event(REFRESH_EVENT));
    setTimeout(() => setIsRefreshing(false), 600);
  }

  return (
    // Hidden below `sm`: this breadcrumb ("Proposals" / "Proposals / Details")
    // duplicates the mobile Sidebar's own nav tabs on the list view, and
    // duplicates ProposalDetailPanel's own "Back to Proposals" + refresh
    // cluster on the detail view — on a phone screen that's a whole extra
    // header row saying nothing new before any real content appears.
    <div className="hidden items-center justify-between gap-1.5 border-b border-hairline px-6 py-3 sm:flex sm:px-8">
      <div className="flex items-center gap-1.5">
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

      <button
        type="button"
        onClick={handleRefresh}
        disabled={isRefreshing}
        title="Refresh"
        className="flex h-8 w-8 items-center justify-center rounded-[8px] text-text-muted transition-all hover:bg-surface-hover hover:text-content-charcoal disabled:opacity-50"
      >
        <IconRefresh size={16} stroke={1.9} className={isRefreshing ? "animate-spin" : ""} />
      </button>
    </div>
  );
}
