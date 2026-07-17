"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "../components/Button";
import StatusBadge from "./StatusBadge";

type ProposalRowProps = {
  id: string;
  clientName: string;
  companyName: string;
  dateSentDisplay: string;
  status: string;
  lastActivityDisplay: string;
};

export default function ProposalRow({
  id,
  clientName,
  companyName,
  dateSentDisplay,
  status,
  lastActivityDisplay,
}: ProposalRowProps) {
  const router = useRouter();
  const [currentStatus, setCurrentStatus] = useState(status);
  const [copied, setCopied] = useState(false);
  const [isMarkingLost, setIsMarkingLost] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionWarning, setActionWarning] = useState<string | null>(null);

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
      router.refresh();
    } catch {
      setActionError("Something went wrong, please try again.");
    } finally {
      setIsMarkingLost(false);
    }
  }

  return (
    <tr
      onClick={goToDetail}
      className="cursor-pointer border-b border-hairline transition-colors last:border-0 hover:bg-ink/[0.03]"
    >
      <td className="px-5 py-4 text-sm font-semibold text-ink">
        <Link
          href={`/admin/${id}`}
          onClick={(e) => e.stopPropagation()}
          className="hover:text-sage"
        >
          {clientName}
        </Link>
      </td>
      <td className="px-5 py-4 text-sm font-medium text-ink/80">{companyName}</td>
      <td className="px-5 py-4 font-mono text-xs tabular-nums text-warmgray">{dateSentDisplay}</td>
      <td className="px-5 py-4">
        <StatusBadge status={currentStatus} />
      </td>
      <td className="px-5 py-4 font-mono text-xs tabular-nums text-warmgray">
        {lastActivityDisplay}
      </td>
      <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex flex-wrap items-center gap-1">
          <Button type="button" variant="ghost" size="sm" onClick={handleCopyLink}>
            {copied ? "Copied!" : "Copy Link"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleMarkAsLost}
            disabled={isMarkingLost || currentStatus === "Lost"}
          >
            {isMarkingLost ? "Marking…" : "Mark as Lost"}
          </Button>
          {currentStatus === "Draft" ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleSendProposal}
              disabled={isSending}
            >
              {isSending ? "Sending…" : "Send Proposal"}
            </Button>
          ) : (
            <Button type="button" variant="ghost" size="sm" disabled title="Coming soon">
              Resend Email
            </Button>
          )}
        </div>
        {actionError && <p className="mt-1 text-xs text-red-600">{actionError}</p>}
        {actionWarning && <p className="mt-1 text-xs text-amber-700">{actionWarning}</p>}
      </td>
    </tr>
  );
}
