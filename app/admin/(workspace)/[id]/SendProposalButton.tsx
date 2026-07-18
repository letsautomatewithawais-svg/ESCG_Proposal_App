"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/app/components/Button";

export default function SendProposalButton({ proposalId }: { proposalId: string }) {
  const router = useRouter();
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  async function handleSend() {
    setIsSending(true);
    setError(null);
    setWarning(null);
    try {
      const res = await fetch(`/api/proposals/${proposalId}/send`, { method: "POST" });
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(
          typeof json?.error === "string" ? json.error : "Something went wrong, please try again.",
        );
        return;
      }

      if (json?.emailSent === false) {
        setWarning("Marked as sent, but the email failed to deliver. Copy the link and send it manually.");
      }
      router.refresh();
    } catch {
      setError("Something went wrong, please try again.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button type="button" variant="primary" size="sm" onClick={handleSend} disabled={isSending}>
        {isSending ? "Sending…" : "Send Proposal"}
      </Button>
      {error && <p className="max-w-[16rem] text-right text-xs text-red-600">{error}</p>}
      {warning && <p className="max-w-[16rem] text-right text-xs text-amber-700">{warning}</p>}
    </div>
  );
}
