"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { IconCheck, IconDotsVertical, IconLink } from "@tabler/icons-react";
import StatusPill, { statusVisual } from "./StatusPill";
import { brand } from "@/lib/ui";
import {
  formatCurrencyAUD,
  formatDurationSeconds,
  formatRelativeTime,
  referenceNumber,
} from "@/lib/format";

// Never actually fires — just lets useSyncExternalStore give the server a
// stable snapshot and the client its real one, without a hydration mismatch.
function subscribeToNothing() {
  return () => {};
}

type ProposalRowProps = {
  id: string;
  clientName: string;
  companyName: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  totalMonthlyInclGst: string;
  openCount: number;
  totalSeconds: number | null;
};

export default function ProposalRow({
  id,
  clientName,
  companyName,
  status,
  createdAt,
  updatedAt,
  totalMonthlyInclGst,
  openCount,
  totalSeconds,
}: ProposalRowProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentStatus, setCurrentStatus] = useState(status);
  const [copied, setCopied] = useState(false);
  const [isMarkingLost, setIsMarkingLost] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionWarning, setActionWarning] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const hasActivity = new Date(updatedAt).getTime() - new Date(createdAt).getTime() > 2000;
  // "X hours ago" depends on the current moment, which differs between the
  // server render and client hydration — a plain computation would mismatch.
  // useSyncExternalStore lets the server render a stable snapshot while the
  // client renders the real, live value, with no hydration warning.
  const lastActivityDisplay = useSyncExternalStore(
    subscribeToNothing,
    () => (hasActivity ? formatRelativeTime(new Date(updatedAt)) : "Never"),
    () => (hasActivity ? "" : "Never"),
  );

  useEffect(() => {
    if (!menuOpen) return;

    function handleOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }

    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [menuOpen]);

  function goToDetail() {
    // A ?selected= URL param handled client-side by ProposalsWorkspace, not
    // a route change to /admin/[id] — that used to be a real Next.js
    // navigation (server re-fetch + page transition) despite looking like a
    // side panel opening.
    const params = new URLSearchParams(searchParams.toString());
    params.set("selected", id);
    router.push(`/admin?${params.toString()}`, { scroll: false });
  }

  async function handleCopyLink() {
    const url = `${window.location.origin}/proposals/${id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  async function handleSendProposal() {
    if (currentStatus !== "Draft") return;

    setIsSending(true);
    setActionError(null);
    setActionWarning(null);
    try {
      const res = await fetch(`/api/proposals/${id}/send`, { method: "POST" });
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setActionError(
          typeof json?.error === "string" ? json.error : "Something went wrong, please try again.",
        );
        return;
      }

      setCurrentStatus("Sent");
      setMenuOpen(false);
      if (json?.emailSent === false) {
        setActionWarning("Marked as sent, but the email failed to deliver. Copy the link and send it manually.");
      }
      router.refresh();
    } catch {
      setActionError("Something went wrong, please try again.");
    } finally {
      setIsSending(false);
    }
  }

  async function handleMarkAsLost() {
    if (currentStatus === "Lost") return;
    const confirmed = window.confirm(`Mark the proposal for ${clientName} as Lost?`);
    if (!confirmed) return;

    setIsMarkingLost(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/proposals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Lost" }),
      });

      if (!res.ok) {
        setActionError("Something went wrong, please try again.");
        return;
      }

      setCurrentStatus("Lost");
      setMenuOpen(false);
      router.refresh();
    } catch {
      setActionError("Something went wrong, please try again.");
    } finally {
      setIsMarkingLost(false);
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      `Permanently delete the proposal for ${clientName}? This cannot be undone.`,
    );
    if (!confirmed) return;

    setIsDeleting(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/proposals/${id}`, { method: "DELETE" });

      if (!res.ok) {
        setActionError("Something went wrong, please try again.");
        setIsDeleting(false);
        return;
      }

      router.refresh();
    } catch {
      setActionError("Something went wrong, please try again.");
      setIsDeleting(false);
    }
  }

  const visual = statusVisual(currentStatus);
  const RowIcon = visual.icon;

  return (
    <div className="border-b border-hairline last:border-0">
      <div
        onClick={goToDetail}
        className="flex cursor-pointer flex-col gap-2 px-5 py-3 transition-all hover:bg-surface-hover hover:shadow-[inset_3px_0_0_0_var(--color-brand-primary)] sm:flex-row sm:items-center sm:gap-3 sm:py-2.5"
      >
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <div className={`${brand.iconChip} h-7 w-7 shrink-0 rounded-[7px] ${visual.chipClassName}`}>
            <RowIcon size={13} stroke={1.9} className={visual.iconClassName} />
          </div>
          <div className="min-w-0">
            <Link
              href={`/admin?selected=${id}`}
              scroll={false}
              onClick={(e) => e.stopPropagation()}
              className="block truncate text-sm font-semibold text-content-charcoal hover:text-brand-primary"
            >
              {clientName}
            </Link>
            <p className={`${brand.number} mt-0.5`}>#{referenceNumber(id)}</p>
          </div>
        </div>

        {/* Below `sm`, this becomes a real flex row (a second line under the
            name, since the row above switches to flex-col) so Status/Value/
            actions don't have to share one line with the name — that's what
            was overflowing the viewport on phones. At `sm` and up it's
            `contents`, so it un-boxes and every child below rejoins the
            outer row's flex layout in the same DOM order as before —
            pixel-identical to the original single-line desktop row. */}
        <div className="flex flex-wrap items-center justify-between gap-2 sm:contents">
          <div className="hidden w-36 shrink-0 truncate text-xs text-text-muted md:block">
            {companyName}
          </div>

          <div className="shrink-0 sm:w-24">
            <StatusPill status={currentStatus} />
          </div>

          <div className="shrink-0 text-right font-ticket-mono text-xs tabular-nums text-content-charcoal sm:w-24">
            {formatCurrencyAUD(totalMonthlyInclGst)}
          </div>

          <div className="hidden w-28 shrink-0 truncate text-xs text-text-muted md:block">
            {lastActivityDisplay}
          </div>

          <div className="hidden w-16 shrink-0 text-xs tabular-nums text-text-muted sm:block">
            {openCount > 0 ? openCount : "—"}
          </div>

          <div className="hidden w-24 shrink-0 text-xs tabular-nums text-text-muted lg:block">
            {totalSeconds !== null ? formatDurationSeconds(totalSeconds) : "—"}
          </div>

          <div
            className="flex w-[72px] shrink-0 items-center justify-end gap-0.5"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={handleCopyLink}
              title="Copy client link"
              className="rounded-[8px] p-2 text-text-muted transition-all hover:bg-content-charcoal/[0.06] hover:text-content-charcoal active:scale-90"
            >
              {copied ? (
                <IconCheck size={16} stroke={2.25} className="text-brand-green" />
              ) : (
                <IconLink size={16} stroke={1.75} />
              )}
            </button>

            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                title="More actions"
                className="rounded-[8px] p-2 text-text-muted transition-all hover:bg-content-charcoal/[0.06] hover:text-content-charcoal active:scale-90"
              >
                <IconDotsVertical size={16} stroke={1.75} />
              </button>

              {menuOpen && (
                <div className={`absolute right-0 z-10 mt-1.5 w-44 overflow-hidden py-1 ${brand.floating}`}>
                  <button
                    type="button"
                    onClick={handleMarkAsLost}
                    disabled={isMarkingLost || currentStatus === "Lost"}
                    className="block w-full px-3 py-2 text-left text-sm text-content-charcoal transition-colors hover:bg-content-charcoal/[0.05] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {isMarkingLost ? "Marking…" : "Mark as Lost"}
                  </button>
                  {currentStatus === "Draft" ? (
                    <button
                      type="button"
                      onClick={handleSendProposal}
                      disabled={isSending}
                      className="block w-full px-3 py-2 text-left text-sm text-content-charcoal transition-colors hover:bg-content-charcoal/[0.05] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {isSending ? "Sending…" : "Send Proposal"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled
                      title="Coming soon"
                      className="block w-full cursor-not-allowed px-3 py-2 text-left text-sm text-text-disabled"
                    >
                      Resend Email
                    </button>
                  )}
                  <div className="my-1 border-t border-hairline" />
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="block w-full px-3 py-2 text-left text-sm text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {isDeleting ? "Deleting…" : "Delete"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {(actionError || actionWarning) && (
        <div className="px-5 pb-3" onClick={(e) => e.stopPropagation()}>
          {actionError && <p className="text-xs text-red-600">{actionError}</p>}
          {actionWarning && <p className="text-xs text-amber-700">{actionWarning}</p>}
        </div>
      )}
    </div>
  );
}
