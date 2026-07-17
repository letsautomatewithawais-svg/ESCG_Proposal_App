"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Button } from "../../components/Button";
import { surface, text } from "@/lib/ui";

type SendMode = "send_now" | "save_draft" | "";

type FormState = {
  walkthroughDate: string;
  companyName: string;
  companyAddress: string;
  clientName: string;
  frequencyOfService: string;
  scopeOfWork: string;
  pricePerVisit: string;
  monthlyCostExclGst: string;
  clientEmail: string;
  clientAcquisitionMethod: string;
  sendMode: SendMode;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

const INITIAL_FORM: FormState = {
  walkthroughDate: "",
  companyName: "",
  companyAddress: "",
  clientName: "",
  frequencyOfService: "",
  scopeOfWork: "",
  pricePerVisit: "",
  monthlyCostExclGst: "",
  clientEmail: "",
  clientAcquisitionMethod: "",
  sendMode: "",
};

const FREQUENCY_OPTIONS = ["Weekly", "Fortnightly", "Monthly", "Quarterly", "One-off"];

const ACQUISITION_OPTIONS = [
  "Referral",
  "Cold Outreach",
  "Website",
  "Networking Event",
  "Other",
];

const CURRENCY_PATTERN = /^\d+(\.\d{1,2})?$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const GST_MULTIPLIER = 1.1;

// Maps the API's field names (which mirror the Prisma model) back to this form's state keys.
const SERVER_TO_FORM_FIELD: Record<string, keyof FormState> = {
  walkThroughDate: "walkthroughDate",
  companyName: "companyName",
  companyAddress: "companyAddress",
  clientName: "clientName",
  frequencyOfService: "frequencyOfService",
  scopeOfWork: "scopeOfWork",
  pricePerVisit: "pricePerVisit",
  monthlyCostExclGst: "monthlyCostExclGst",
  clientEmail: "clientEmail",
  acquisitionMethod: "clientAcquisitionMethod",
  sendMode: "sendMode",
};

function validate(data: FormState): FormErrors {
  const errors: FormErrors = {};

  if (!data.walkthroughDate) {
    errors.walkthroughDate = "Walk-through date is required.";
  }
  if (!data.companyName.trim()) {
    errors.companyName = "Company name is required.";
  }
  if (!data.companyAddress.trim()) {
    errors.companyAddress = "Company address is required.";
  }
  if (!data.clientName.trim()) {
    errors.clientName = "Client's name is required.";
  }
  if (!data.frequencyOfService) {
    errors.frequencyOfService = "Frequency of service is required.";
  }
  if (!data.scopeOfWork.trim()) {
    errors.scopeOfWork = "Scope of work is required.";
  }

  if (!data.pricePerVisit.trim()) {
    errors.pricePerVisit = "Price per visit is required.";
  } else if (!CURRENCY_PATTERN.test(data.pricePerVisit.trim())) {
    errors.pricePerVisit = "Enter a valid amount, e.g. 120 or 120.50.";
  }

  if (!data.monthlyCostExclGst.trim()) {
    errors.monthlyCostExclGst = "Monthly cost is required.";
  } else if (!CURRENCY_PATTERN.test(data.monthlyCostExclGst.trim())) {
    errors.monthlyCostExclGst = "Enter a valid amount, e.g. 480 or 480.50.";
  }

  if (!data.clientEmail.trim()) {
    errors.clientEmail = "Client email is required.";
  } else if (!EMAIL_PATTERN.test(data.clientEmail.trim())) {
    errors.clientEmail = "Enter a valid email address.";
  }

  if (!data.clientAcquisitionMethod) {
    errors.clientAcquisitionMethod = "Client acquisition method is required.";
  }
  if (!data.sendMode) {
    errors.sendMode = "Choose Send Now or Save as Draft.";
  }

  return errors;
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1 text-xs text-red-600">
      {message}
    </p>
  );
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className={`${surface.primary} p-6 sm:p-7`}>
      <h2 className={text.sectionLabel}>{title}</h2>
      <div className="mt-5 space-y-5">{children}</div>
    </div>
  );
}

const inputClass =
  "block w-full rounded-md border border-hairline bg-paper px-3 py-2 text-sm text-ink placeholder:text-warmgray/60 focus:border-sage focus:outline-none focus:ring-1 focus:ring-sage";
const inputErrorClass = "border-red-300 focus:border-red-400 focus:ring-red-400";
const labelClass = text.label;

export default function NewProposalPage() {
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    id: string;
    sendMode: SendMode;
    emailSent?: boolean;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const monthlyCostNum = parseFloat(form.monthlyCostExclGst);
  const totalInclGstDisplay = useMemo(() => {
    if (!Number.isFinite(monthlyCostNum) || form.monthlyCostExclGst.trim() === "") {
      return "";
    }
    return (monthlyCostNum * GST_MULTIPLIER).toFixed(2);
  }, [monthlyCostNum, form.monthlyCostExclGst]);

  function updateField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const nextErrors = validate(form);
    setErrors(nextErrors);
    setSubmitError(null);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walkThroughDate: form.walkthroughDate,
          companyName: form.companyName.trim(),
          companyAddress: form.companyAddress.trim(),
          clientName: form.clientName.trim(),
          clientEmail: form.clientEmail.trim(),
          frequencyOfService: form.frequencyOfService,
          scopeOfWork: form.scopeOfWork.trim(),
          pricePerVisit: Number(form.pricePerVisit),
          monthlyCostExclGst: Number(form.monthlyCostExclGst),
          acquisitionMethod: form.clientAcquisitionMethod,
          sendMode: form.sendMode,
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        const serverErrors = json?.errors as Record<string, string> | undefined;
        if (serverErrors) {
          const mapped: FormErrors = {};
          for (const [key, message] of Object.entries(serverErrors)) {
            const formKey = SERVER_TO_FORM_FIELD[key];
            if (formKey) mapped[formKey] = message;
          }
          setErrors((prev) => ({ ...prev, ...mapped }));
        }
        setSubmitError(
          typeof json?.error === "string"
            ? json.error
            : "Something went wrong, please try again.",
        );
        return;
      }

      if (typeof json?.id === "string") {
        setResult({ id: json.id, sendMode: form.sendMode, emailSent: json?.emailSent });
      } else {
        setSubmitError("Something went wrong, please try again.");
      }
    } catch {
      setSubmitError("Something went wrong, please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleClear() {
    setForm(INITIAL_FORM);
    setErrors({});
    setSubmitError(null);
  }

  function handleCreateAnother() {
    handleClear();
    setResult(null);
    setCopied(false);
  }

  async function handleCopyLink() {
    if (!result) return;
    const url = `${window.location.origin}/proposals/${result.id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  if (result) {
    const proposalUrl = `${window.location.origin}/proposals/${result.id}`;
    return (
      <div className="mx-auto w-full max-w-2xl">
        <div className="text-center">
          <h1 className={text.pageTitle}>
            {result.sendMode === "send_now" ? "Proposal sent" : "Draft saved"}
          </h1>
          <p className={`mt-2 ${text.muted}`}>
            The proposal has been saved to the database. Share the link below with your client.
          </p>
        </div>

        {result.sendMode === "send_now" && result.emailSent === false && (
          <div className="mt-8 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <p className="font-semibold">The proposal was saved, but the email failed to send.</p>
            <p className="mt-1">
              Copy the link below and send it to the client manually, or try resending later.
            </p>
          </div>
        )}

        <div className={`mt-10 ${surface.primary} p-6 sm:p-8`}>
          <p className={text.sectionLabel}>Proposal URL</p>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            <code className="flex-1 truncate rounded-md border border-hairline bg-ink/[0.03] px-4 py-3 text-sm text-ink">
              {proposalUrl}
            </code>
            <Button type="button" variant="primary" onClick={handleCopyLink} className="shrink-0">
              {copied ? "Copied!" : "Copy Link"}
            </Button>
          </div>
          <p className={`mt-4 ${text.small}`}>
            Proposal ID: <span className={`${text.mono} text-warmgray`}>{result.id}</span>
          </p>
        </div>

        <div className="mt-8 flex items-center justify-center gap-3">
          <Button type="button" variant="primary" onClick={handleCreateAnother}>
            Create another proposal
          </Button>
          <Link href="/admin" className="text-sm font-medium text-warmgray hover:text-ink">
            Back to Proposals
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <Link href="/admin" className="text-sm text-warmgray hover:text-ink">
        &larr; Back to Proposals
      </Link>

      <h1 className={`mt-4 ${text.pageTitle}`}>New Proposal</h1>
      <p className={`mt-1 ${text.muted}`}>
        Enter the walk-through details to generate a client proposal.
      </p>

      <form noValidate onSubmit={handleSubmit} className="mt-8 space-y-6">
        <FormSection title="Client Details">
          <div>
            <label htmlFor="companyName" className={labelClass}>
              Company Name
            </label>
            <input
              id="companyName"
              type="text"
              value={form.companyName}
              onChange={(e) => updateField("companyName", e.target.value)}
              aria-invalid={!!errors.companyName}
              aria-describedby="companyName-error"
              className={`mt-1 ${inputClass} ${errors.companyName ? inputErrorClass : ""}`}
            />
            <FieldError id="companyName-error" message={errors.companyName} />
          </div>

          <div>
            <label htmlFor="companyAddress" className={labelClass}>
              Company Address
            </label>
            <textarea
              id="companyAddress"
              rows={2}
              value={form.companyAddress}
              onChange={(e) => updateField("companyAddress", e.target.value)}
              aria-invalid={!!errors.companyAddress}
              aria-describedby="companyAddress-error"
              className={`mt-1 ${inputClass} ${errors.companyAddress ? inputErrorClass : ""}`}
            />
            <FieldError id="companyAddress-error" message={errors.companyAddress} />
          </div>

          <div>
            <label htmlFor="clientName" className={labelClass}>
              Client&apos;s Name
            </label>
            <input
              id="clientName"
              type="text"
              value={form.clientName}
              onChange={(e) => updateField("clientName", e.target.value)}
              aria-invalid={!!errors.clientName}
              aria-describedby="clientName-error"
              className={`mt-1 ${inputClass} ${errors.clientName ? inputErrorClass : ""}`}
            />
            <FieldError id="clientName-error" message={errors.clientName} />
          </div>

          <div>
            <label htmlFor="clientEmail" className={labelClass}>
              Client Email
            </label>
            <input
              id="clientEmail"
              type="email"
              value={form.clientEmail}
              onChange={(e) => updateField("clientEmail", e.target.value)}
              aria-invalid={!!errors.clientEmail}
              aria-describedby="clientEmail-error"
              className={`mt-1 ${inputClass} ${errors.clientEmail ? inputErrorClass : ""}`}
            />
            <FieldError id="clientEmail-error" message={errors.clientEmail} />
          </div>
        </FormSection>

        <FormSection title="Service Details">
          <div>
            <label htmlFor="walkthroughDate" className={labelClass}>
              Walk-through Date
            </label>
            <input
              id="walkthroughDate"
              type="date"
              value={form.walkthroughDate}
              onChange={(e) => updateField("walkthroughDate", e.target.value)}
              aria-invalid={!!errors.walkthroughDate}
              aria-describedby="walkthroughDate-error"
              className={`mt-1 ${inputClass} font-mono tabular-nums ${errors.walkthroughDate ? inputErrorClass : ""}`}
            />
            <FieldError id="walkthroughDate-error" message={errors.walkthroughDate} />
          </div>

          <div>
            <label htmlFor="frequencyOfService" className={labelClass}>
              Frequency of Service
            </label>
            <select
              id="frequencyOfService"
              value={form.frequencyOfService}
              onChange={(e) => updateField("frequencyOfService", e.target.value)}
              aria-invalid={!!errors.frequencyOfService}
              aria-describedby="frequencyOfService-error"
              className={`mt-1 ${inputClass} ${errors.frequencyOfService ? inputErrorClass : ""}`}
            >
              <option value="">Select frequency&hellip;</option>
              {FREQUENCY_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <FieldError id="frequencyOfService-error" message={errors.frequencyOfService} />
          </div>

          <div>
            <label htmlFor="scopeOfWork" className={labelClass}>
              Scope of Work
            </label>
            <textarea
              id="scopeOfWork"
              rows={5}
              value={form.scopeOfWork}
              onChange={(e) => updateField("scopeOfWork", e.target.value)}
              aria-invalid={!!errors.scopeOfWork}
              aria-describedby="scopeOfWork-error"
              placeholder={"e.g.\n- Vacuum and mop all floors\n- Clean and sanitize restrooms\n- Empty bins and replace liners"}
              className={`mt-1 ${inputClass} ${errors.scopeOfWork ? inputErrorClass : ""}`}
            />
            <FieldError id="scopeOfWork-error" message={errors.scopeOfWork} />
          </div>
        </FormSection>

        <FormSection title="Pricing">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="pricePerVisit" className={labelClass}>
                Price per Visit
              </label>
              <div className="relative mt-1">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-warmgray">
                  $
                </span>
                <input
                  id="pricePerVisit"
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={form.pricePerVisit}
                  onChange={(e) => updateField("pricePerVisit", e.target.value)}
                  aria-invalid={!!errors.pricePerVisit}
                  aria-describedby="pricePerVisit-error"
                  className={`${inputClass} pl-7 font-mono tabular-nums ${errors.pricePerVisit ? inputErrorClass : ""}`}
                />
              </div>
              <FieldError id="pricePerVisit-error" message={errors.pricePerVisit} />
            </div>

            <div>
              <label htmlFor="monthlyCostExclGst" className={labelClass}>
                Monthly Cost (excl. GST)
              </label>
              <div className="relative mt-1">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-warmgray">
                  $
                </span>
                <input
                  id="monthlyCostExclGst"
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={form.monthlyCostExclGst}
                  onChange={(e) => updateField("monthlyCostExclGst", e.target.value)}
                  aria-invalid={!!errors.monthlyCostExclGst}
                  aria-describedby="monthlyCostExclGst-error"
                  className={`${inputClass} pl-7 font-mono tabular-nums ${errors.monthlyCostExclGst ? inputErrorClass : ""}`}
                />
              </div>
              <FieldError id="monthlyCostExclGst-error" message={errors.monthlyCostExclGst} />
            </div>
          </div>

          <div className={`${surface.nested} p-4`}>
            <div className="flex items-center gap-2">
              <label htmlFor="totalMonthlyInclGst" className={labelClass}>
                Total Monthly Amount (incl. GST)
              </label>
              <span className="rounded-full bg-hairline/70 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-warmgray">
                Auto-calculated
              </span>
            </div>
            <div className="relative mt-2">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-warmgray">
                $
              </span>
              <input
                id="totalMonthlyInclGst"
                type="text"
                readOnly
                tabIndex={-1}
                value={totalInclGstDisplay}
                placeholder="0.00"
                className="block w-full cursor-not-allowed rounded-md border border-hairline bg-ink/[0.05] py-2 pl-7 pr-3 font-mono text-sm font-medium tabular-nums text-ink"
              />
            </div>
            <p className={`mt-1.5 ${text.small}`}>
              Calculated automatically as Monthly Cost &times; 1.1.
            </p>
          </div>
        </FormSection>

        <FormSection title="Metadata">
          <div>
            <label htmlFor="clientAcquisitionMethod" className={labelClass}>
              Client Acquisition Method
            </label>
            <select
              id="clientAcquisitionMethod"
              value={form.clientAcquisitionMethod}
              onChange={(e) => updateField("clientAcquisitionMethod", e.target.value)}
              aria-invalid={!!errors.clientAcquisitionMethod}
              aria-describedby="clientAcquisitionMethod-error"
              className={`mt-1 ${inputClass} ${errors.clientAcquisitionMethod ? inputErrorClass : ""}`}
            >
              <option value="">Select method&hellip;</option>
              {ACQUISITION_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <FieldError
              id="clientAcquisitionMethod-error"
              message={errors.clientAcquisitionMethod}
            />
          </div>
        </FormSection>

        <div className="rounded-lg border border-sage/25 bg-sage/5 p-6 sm:p-7">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-sage">Send Mode</h2>
          <p className={`mt-1 ${text.muted}`}>
            Choose whether to send this proposal to the client now or save it as a draft for
            later.
          </p>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label
              className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors ${
                form.sendMode === "send_now"
                  ? "border-sage bg-sage/10"
                  : "border-hairline bg-paper hover:bg-ink/5"
              }`}
            >
              <input
                type="radio"
                name="sendMode"
                value="send_now"
                checked={form.sendMode === "send_now"}
                onChange={(e) => updateField("sendMode", e.target.value as SendMode)}
                className="mt-0.5 h-4 w-4 accent-sage border-hairline text-sage focus:ring-sage"
              />
              <span>
                <span className="block text-sm font-semibold text-ink">Send Now</span>
                <span className={`mt-0.5 block ${text.small}`}>
                  Emails the proposal to the client immediately.
                </span>
              </span>
            </label>

            <label
              className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors ${
                form.sendMode === "save_draft"
                  ? "border-sage bg-sage/10"
                  : "border-hairline bg-paper hover:bg-ink/5"
              }`}
            >
              <input
                type="radio"
                name="sendMode"
                value="save_draft"
                checked={form.sendMode === "save_draft"}
                onChange={(e) => updateField("sendMode", e.target.value as SendMode)}
                className="mt-0.5 h-4 w-4 accent-sage border-hairline text-sage focus:ring-sage"
              />
              <span>
                <span className="block text-sm font-semibold text-ink">Save as Draft</span>
                <span className={`mt-0.5 block ${text.small}`}>
                  Keeps it hidden from the client until you send it later.
                </span>
              </span>
            </label>
          </div>
          <FieldError id="sendMode-error" message={errors.sendMode} />
        </div>

        {submitError && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {submitError}
          </div>
        )}

        <div className="flex items-center gap-3 border-t border-hairline pt-6">
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting
              ? "Submitting…"
              : form.sendMode === "send_now"
                ? "Send Proposal"
                : form.sendMode === "save_draft"
                  ? "Save Draft"
                  : "Save Proposal"}
          </Button>
          <Button type="button" variant="secondary" onClick={handleClear} disabled={isSubmitting}>
            Clear form
          </Button>
        </div>
      </form>
    </div>
  );
}
