"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { IconCheck, IconDotsVertical, IconLink } from "@tabler/icons-react";
import StatusPill, { statusVisual } from "./StatusPill";
import { brand } from "@/lib/ui";
import {
  formatCurrencyAUD,
  formatDurationSeconds,
  formatRelativeTime,
  referenceNumber,
} from "@/lib/format";

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
  const [currentStatus, setCurrentStatus] = useState(status);
  const [copied, setCopied] = useState(false);
  const [isMarkingLost, setIsMarkingLost] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionWarning, setActionWarning] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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
    router.push(`/admin/${id}`);
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
  const createdAtDate = new Date(createdAt);
  const updatedAtDate = new Date(updatedAt);
  const hasActivity = updatedAtDate.getTime() - createdAtDate.getTime() > 2000;
  const lastActivityDisplay = hasActivity ? formatRelativeTime(updatedAtDate) : "Never";

  return (
    <div className="border-b border-hairline last:border-0">
      <div
        onClick={goToDetail}
        className="flex cursor-pointer items-center gap-4 px-5 py-3.5 transition-all hover:bg-surface-hover hover:shadow-[inset_3px_0_0_0_#1f5c3f]"
      >
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className={`${brand.iconChip} h-8 w-8 shrink-0 rounded-[8px] ${visual.chipClassName}`}>
            <RowIcon size={15} stroke={1.9} className={visual.iconClassName} />
          </div>
          <div className="min-w-0">
            <Link
              href={`/admin/${id}`}
              onClick={(e) => e.stopPropagation()}
              className="block truncate text-sm font-semibold text-content-charcoal hover:text-brand-green"
            >
              {clientName}
            </Link>
            <p className={`${brand.number} mt-0.5`}>#{referenceNumber(id)}</p>
          </div>
        </div>

        <div className="hidden w-36 shrink-0 truncate text-xs text-text-muted md:block">
          {companyName}
        </div>

        <div className="w-24 shrink-0">
          <StatusPill status={currentStatus} />
        </div>

        <div className="w-24 shrink-0 text-right font-ticket-mono text-xs tabular-nums text-content-charcoal">
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

      {(actionError || actionWarning) && (
        <div className="px-5 pb-3" onClick={(e) => e.stopPropagation()}>
          {actionError && <p className="text-xs text-red-600">{actionError}</p>}
          {actionWarning && <p className="text-xs text-amber-700">{actionWarning}</p>}
        </div>
      )}
    </div>
  );
}
