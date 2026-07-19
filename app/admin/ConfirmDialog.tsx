"use client";

import { useEffect } from "react";
import { Button } from "@/app/components/Button";
import { brand } from "@/lib/ui";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Red confirm button for destructive actions (delete) vs. the brand
   * color for merely consequential ones (mark as lost). */
  destructive?: boolean;
  isBusy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

const primaryButtonClass =
  "rounded-[8px]! bg-brand-primary! text-white! hover:bg-brand-primary/90! focus-visible:ring-brand-primary!";
const destructiveButtonClass =
  "rounded-[8px]! bg-red! text-white! hover:bg-red/90! focus-visible:ring-red!";
const secondaryButtonClass =
  "rounded-[8px]! border-hairline! text-content-charcoal! hover:bg-surface-hover!";

/** Shared admin confirmation modal — replaces window.confirm() (Mark as
 * Lost, Delete) with something that matches the rest of the app instead of
 * a bare OS dialog. */
export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  isBusy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return;
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-content-charcoal/40 p-4"
      onClick={onCancel}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
        className={`w-full max-w-sm p-6 ${brand.card}`}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="confirm-dialog-title" className="font-display text-lg font-semibold text-content-charcoal">
          {title}
        </h2>
        <p id="confirm-dialog-description" className="mt-2 text-sm text-text-muted">
          {description}
        </p>
        <div className="mt-6 flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onCancel}
            disabled={isBusy}
            className={secondaryButtonClass}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={onConfirm}
            disabled={isBusy}
            className={destructive ? destructiveButtonClass : primaryButtonClass}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
