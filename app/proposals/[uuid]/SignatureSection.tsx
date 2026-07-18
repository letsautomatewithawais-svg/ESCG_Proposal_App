"use client";

import { useEffect, useRef, useState } from "react";
import SignaturePad from "signature_pad";
import { Button } from "../../components/Button";
import { text } from "@/lib/ui";

type ExistingSignature = { typedName: string; signedAt: string; signatureImage: string } | null;

type SignatureSectionProps = {
  proposalId: string;
  alreadySigned: boolean;
  existingSignature: ExistingSignature;
  /** Static rendering for the Puppeteer PDF export — never mounts the live
   * canvas widget (no point in an interactive signature pad in a downloaded
   * PDF), and shows a plain "not yet signed" line instead when unsigned. */
  printMode?: boolean;
};

export default function SignatureSection({
  proposalId,
  alreadySigned,
  existingSignature,
  printMode = false,
}: SignatureSectionProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const padRef = useRef<SignaturePad | null>(null);
  const [typedName, setTypedName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signed, setSigned] = useState(alreadySigned);
  const [signedInfo, setSignedInfo] = useState<ExistingSignature>(existingSignature);

  useEffect(() => {
    if (signed || printMode) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const pad = new SignaturePad(canvas, { backgroundColor: "rgb(255, 255, 255)" });
    padRef.current = pad;

    function resizeCanvas() {
      if (!canvas) return;
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      canvas.width = canvas.offsetWidth * ratio;
      canvas.height = canvas.offsetHeight * ratio;
      canvas.getContext("2d")?.scale(ratio, ratio);
      pad.clear();
    }

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      pad.off();
    };
  }, [signed, printMode]);

  function handleClear() {
    padRef.current?.clear();
    setError(null);
  }

  async function handleAcceptAndSign() {
    setError(null);

    if (!typedName.trim()) {
      setError("Please type your name.");
      return;
    }
    if (!padRef.current || padRef.current.isEmpty()) {
      setError("Please provide your signature.");
      return;
    }

    const signatureImage = padRef.current.toDataURL("image/png");
    const signedAt = new Date().toISOString();

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/proposals/${proposalId}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signatureImage,
          typedName: typedName.trim(),
          signedAt,
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(
          typeof json?.error === "string" ? json.error : "Something went wrong, please try again.",
        );
        return;
      }

      setSignedInfo({ typedName: typedName.trim(), signedAt, signatureImage });
      setSigned(true);
    } catch {
      setError("Something went wrong, please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (signed) {
    return (
      <div className="rounded-[3px] border border-sage/30 bg-sage/5 p-6 text-center sm:p-8">
        <p className="text-sm font-medium text-sage">
          Thank you, your proposal has been signed.
        </p>
        {signedInfo && (
          <>
            <p className="mt-1 text-xs text-sage/80">
              Signed by {signedInfo.typedName} on{" "}
              {new Intl.DateTimeFormat("en-AU", { dateStyle: "long", timeStyle: "short" }).format(
                new Date(signedInfo.signedAt),
              )}
            </p>
            {signedInfo.signatureImage && (
              /* eslint-disable-next-line @next/next/no-img-element -- stored base64 data URL, not an optimizable static asset */
              <img
                src={signedInfo.signatureImage}
                alt={`Signature of ${signedInfo.typedName}`}
                className="mx-auto mt-4 h-24 max-w-full object-contain"
              />
            )}
          </>
        )}
      </div>
    );
  }

  if (printMode) {
    return (
      <div>
        <h2 className={text.sectionLabel}>Accept &amp; Sign</h2>
        <p className={`mt-3 ${text.muted}`}>Awaiting signature.</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className={text.sectionLabel}>Accept &amp; Sign</h2>

      <div className="mt-4 overflow-hidden rounded-[3px] border border-hairline bg-white">
        <canvas ref={canvasRef} className="h-48 w-full touch-none sm:h-56" />
      </div>
      <Button type="button" variant="secondary" size="sm" onClick={handleClear} disabled={isSubmitting} className="mt-2">
        Clear
      </Button>

      <div className="mt-5">
        <label htmlFor="typedName" className={text.label}>
          Type your name
        </label>
        <input
          id="typedName"
          type="text"
          value={typedName}
          onChange={(e) => setTypedName(e.target.value)}
          disabled={isSubmitting}
          className="mt-1.5 block w-full rounded-[3px] border border-hairline bg-white px-3 py-2.5 text-sm text-ink focus:border-sage focus:outline-none focus:ring-1 focus:ring-sage disabled:opacity-50"
        />
      </div>

      {error && (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <Button
        type="button"
        variant="primary"
        onClick={handleAcceptAndSign}
        disabled={isSubmitting}
        className="mt-6 w-full"
      >
        {isSubmitting ? "Submitting…" : "Accept and Sign"}
      </Button>
    </div>
  );
}
