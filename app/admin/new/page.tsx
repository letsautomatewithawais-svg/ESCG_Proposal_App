"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { IconCheck, IconX } from "@tabler/icons-react";
import { Button, buttonClasses } from "../../components/Button";
import { brand } from "@/lib/ui";

type SendMode = "send_now" | "save_draft" | "";

type FormState = {
  walkthroughDate: string;
  companyName: string;
  companyAddress: string;
  clientName: string;
  frequencyOfService: string;
  schedulingDay: string;
  schedulingTime: string;
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
  schedulingDay: "",
  schedulingTime: "",
  scopeOfWork: "",
  pricePerVisit: "",
  monthlyCostExclGst: "",
  clientEmail: "",
  clientAcquisitionMethod: "",
  sendMode: "",
};

const FREQUENCY_OPTIONS = ["Weekly", "Fortnightly", "Monthly", "Quarterly", "One-off"];

const DAY_OPTIONS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const TIME_OF_DAY_OPTIONS = ["Business hours", "After-hours", "Early morning"];

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

// Some people naturally type thousands separators into a dollar amount
// (e.g. "25,000.23") — stripping commas before validating/parsing means
// that's accepted instead of either silently miscalculating the live
// GST-inclusive total (parseFloat stops at the first comma, so
// "25,000.23" was read as just "25") or blocking submission on a
// "not a valid amount" error most people wouldn't expect for that input.
function parseCurrencyInput(value: string): string {
  return value.replace(/,/g, "").trim();
}

// Maps the API's field names (which mirror the Prisma model) back to this form's state keys.
const SERVER_TO_FORM_FIELD: Record<string, keyof FormState> = {
  walkThroughDate: "walkthroughDate",
  companyName: "companyName",
  companyAddress: "companyAddress",
  clientName: "clientName",
  frequencyOfService: "frequencyOfService",
  schedulingDay: "schedulingDay",
  schedulingTime: "schedulingTime",
  scopeOfWork: "scopeOfWork",
  pricePerVisit: "pricePerVisit",
  monthlyCostExclGst: "monthlyCostExclGst",
  clientEmail: "clientEmail",
  acquisitionMethod: "clientAcquisitionMethod",
  sendMode: "sendMode",
};

const STEPS = ["Client", "Service Details", "Pricing", "Review & Send"] as const;

// Which form fields belong to each step — used both to gate "Continue" (only
// that step's fields need to be valid) and, on final submit, to figure out
// which earlier step to jump back to if something there is still invalid.
const STEP_FIELDS: (keyof FormState)[][] = [
  ["companyName", "companyAddress", "clientName", "clientEmail"],
  ["walkthroughDate", "frequencyOfService", "scopeOfWork"],
  ["pricePerVisit", "monthlyCostExclGst", "clientAcquisitionMethod"],
  ["sendMode"],
];

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
  } else if (!CURRENCY_PATTERN.test(parseCurrencyInput(data.pricePerVisit))) {
    errors.pricePerVisit = "Enter a valid amount, e.g. 120 or 120.50.";
  }

  if (!data.monthlyCostExclGst.trim()) {
    errors.monthlyCostExclGst = "Monthly cost is required.";
  } else if (!CURRENCY_PATTERN.test(parseCurrencyInput(data.monthlyCostExclGst))) {
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
    <p id={id} className="mt-1 text-xs text-red">
      {message}
    </p>
  );
}

const inputClass =
  "block w-full rounded-[6px] border border-hairline bg-white px-3 py-2 text-sm text-content-charcoal placeholder:text-text-muted/70 focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary";
const inputErrorClass = "border-red/50 focus:border-red focus:ring-red";
const labelClass = "block text-sm font-semibold text-content-charcoal";

// Admin-only color override on the shared Button component (also used by the
// client-facing proposal page, which must keep its own separate ink/paper/sage
// identity) — same `!`-important override pattern Sidebar.tsx already uses
// for LogoutButton, so Button.tsx itself stays untouched.
const primaryButtonClass =
  "rounded-[8px]! bg-brand-primary! text-white! hover:bg-brand-primary/90! focus-visible:ring-brand-primary!";
const secondaryButtonClass =
  "rounded-[8px]! border-hairline! text-content-charcoal! hover:bg-surface-hover!";

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 first:pt-0">
      <span className="text-xs text-text-muted">{label}</span>
      <span className="max-w-[60%] text-right text-sm text-content-charcoal">{value || "—"}</span>
    </div>
  );
}

export default function NewProposalPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
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

  const monthlyCostNum = parseFloat(parseCurrencyInput(form.monthlyCostExclGst));
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

  function handleContinue() {
    const allErrors = validate(form);
    const stepKeys = STEP_FIELDS[currentStep];
    const stepErrors = stepKeys.filter((key) => allErrors[key]).length > 0;
    // Only surface errors for the step being left right now — merging in
    // every field's error here would show step 3's validation messages
    // while the user is still on step 1, before they've touched step 3 at all.
    setErrors((prev) => {
      const next = { ...prev };
      for (const key of stepKeys) next[key] = allErrors[key];
      return next;
    });
    if (stepErrors) return;
    setCurrentStep((step) => Math.min(step + 1, STEPS.length - 1));
  }

  function handleBack() {
    setCurrentStep((step) => Math.max(step - 1, 0));
  }

  function goToStep(index: number) {
    // Only allow jumping to a step that's already been reached, or the very
    // next one — otherwise skipping ahead could submit with unseen invalid
    // fields.
    if (index <= currentStep + 1) setCurrentStep(index);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const nextErrors = validate(form);
    setErrors(nextErrors);
    setSubmitError(null);

    if (Object.keys(nextErrors).length > 0) {
      const firstInvalidStep = STEP_FIELDS.findIndex((keys) =>
        keys.some((key) => nextErrors[key]),
      );
      if (firstInvalidStep !== -1) setCurrentStep(firstInvalidStep);
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
          schedulingDay: form.schedulingDay || undefined,
          schedulingTime: form.schedulingTime || undefined,
          scopeOfWork: form.scopeOfWork.trim(),
          pricePerVisit: Number(parseCurrencyInput(form.pricePerVisit)),
          monthlyCostExclGst: Number(parseCurrencyInput(form.monthlyCostExclGst)),
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
          const firstInvalidStep = STEP_FIELDS.findIndex((keys) =>
            keys.some((key) => mapped[key]),
          );
          if (firstInvalidStep !== -1) setCurrentStep(firstInvalidStep);
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
    setCurrentStep(0);
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

  function closeModal() {
    router.push("/admin");
  }

  if (result) {
    const proposalUrl = `${window.location.origin}/proposals/${result.id}`;
    return (
      <div className="fixed inset-0 z-20 flex items-center justify-center bg-content-charcoal/40 p-4">
        <div className={`w-full max-w-lg ${brand.card} p-6 sm:p-8`}>
          <div className="text-center">
            <div className={`${brand.iconChip} mx-auto h-11 w-11 bg-brand-green-tint`}>
              <IconCheck size={20} stroke={2.25} className="text-brand-green" />
            </div>
            <h1 className="mt-3 font-display text-xl font-bold tracking-tight text-content-charcoal">
              {result.sendMode === "send_now" ? "Proposal sent" : "Draft saved"}
            </h1>
            <p className="mt-1.5 text-sm text-text-muted">
              Share the link below with your client.
            </p>
          </div>

          {result.sendMode === "send_now" && result.emailSent === false && (
            <div className="mt-5 rounded-[8px] border border-amber/30 bg-amber-tint p-3 text-sm text-amber">
              <p className="font-semibold">The proposal was saved, but the email failed to send.</p>
              <p className="mt-1">Copy the link below and send it to the client manually.</p>
            </div>
          )}

          <div className="mt-5 rounded-[8px] border border-hairline bg-neutral-tint/50 p-3">
            <p className={brand.label}>Proposal URL</p>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <code className="flex-1 truncate rounded-[6px] border border-hairline bg-white px-3 py-2 text-xs text-content-charcoal">
                {proposalUrl}
              </code>
              <Button
                type="button"
                variant="primary"
                onClick={handleCopyLink}
                className={`shrink-0 ${primaryButtonClass}`}
                size="sm"
              >
                {copied ? "Copied!" : "Copy Link"}
              </Button>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-center gap-3">
            <Button
              type="button"
              variant="primary"
              onClick={handleCreateAnother}
              className={primaryButtonClass}
            >
              Create another
            </Button>
            <Link href="/admin" className={buttonClasses("primary", "md", primaryButtonClass)}>
              Back to Proposals
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-20 flex items-center justify-center bg-content-charcoal/40 p-4"
      onClick={closeModal}
    >
      <div
        className={`flex w-full max-w-3xl overflow-hidden ${brand.card}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Step rail */}
        <div className="hidden w-44 shrink-0 border-r border-hairline bg-neutral-tint/40 p-4 sm:block">
          <p className={`${brand.label} px-1 pb-3`}>New Proposal</p>
          <div className="space-y-0.5">
            {STEPS.map((label, index) => {
              const active = index === currentStep;
              const done = index < currentStep;
              const reachable = index <= currentStep + 1;
              return (
                <button
                  key={label}
                  type="button"
                  disabled={!reachable}
                  onClick={() => goToStep(index)}
                  className={`flex w-full items-center gap-2 rounded-[6px] px-2 py-1.5 text-left text-sm transition-colors ${
                    active
                      ? "bg-brand-primary-tint font-semibold text-brand-primary"
                      : done
                        ? "text-content-charcoal hover:bg-surface-hover"
                        : "text-text-muted"
                  } ${!reachable ? "cursor-not-allowed" : ""}`}
                >
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                      done
                        ? "bg-brand-primary text-white"
                        : active
                          ? "border border-brand-primary text-brand-primary"
                          : "border border-hairline text-text-muted"
                    }`}
                  >
                    {done ? <IconCheck size={11} stroke={3} /> : index + 1}
                  </span>
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Step content */}
        <div className="flex max-h-[calc(100vh-2rem)] min-w-0 flex-1 flex-col">
          <div className="flex items-center justify-between border-b border-hairline px-5 py-3 sm:px-6">
            <p className="text-sm font-semibold text-content-charcoal">
              Step {currentStep + 1} of {STEPS.length} — {STEPS[currentStep]}
            </p>
            <button
              type="button"
              onClick={closeModal}
              title="Close"
              aria-label="Close"
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-surface-hover hover:text-content-charcoal ${brand.pressable} ${brand.focusRing}`}
            >
              <IconX size={18} stroke={2} />
            </button>
          </div>

          <form
            noValidate
            onSubmit={handleSubmit}
            className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6"
          >
            {currentStep === 0 && (
              <div className="space-y-4">
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
              </div>
            )}

            {currentStep === 1 && (
              <div className="space-y-4">
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
                    className={`mt-1 ${inputClass} font-ticket-mono tabular-nums ${errors.walkthroughDate ? inputErrorClass : ""}`}
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

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="schedulingDay" className={labelClass}>
                      Scheduling Day{" "}
                      <span className="font-normal text-text-muted">(optional)</span>
                    </label>
                    <select
                      id="schedulingDay"
                      value={form.schedulingDay}
                      onChange={(e) => updateField("schedulingDay", e.target.value)}
                      className={`mt-1 ${inputClass}`}
                    >
                      <option value="">Select day&hellip;</option>
                      {DAY_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="schedulingTime" className={labelClass}>
                      Time of Day <span className="font-normal text-text-muted">(optional)</span>
                    </label>
                    <select
                      id="schedulingTime"
                      value={form.schedulingTime}
                      onChange={(e) => updateField("schedulingTime", e.target.value)}
                      className={`mt-1 ${inputClass}`}
                    >
                      <option value="">Select time&hellip;</option>
                      {TIME_OF_DAY_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
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
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="pricePerVisit" className={labelClass}>
                      Price per Visit
                    </label>
                    <div className="relative mt-1">
                      <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-text-muted">
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
                        className={`${inputClass} pl-7 font-ticket-mono tabular-nums ${errors.pricePerVisit ? inputErrorClass : ""}`}
                      />
                    </div>
                    <FieldError id="pricePerVisit-error" message={errors.pricePerVisit} />
                  </div>

                  <div>
                    <label htmlFor="monthlyCostExclGst" className={labelClass}>
                      Monthly Cost (excl. GST)
                    </label>
                    <div className="relative mt-1">
                      <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-text-muted">
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
                        className={`${inputClass} pl-7 font-ticket-mono tabular-nums ${errors.monthlyCostExclGst ? inputErrorClass : ""}`}
                      />
                    </div>
                    <FieldError id="monthlyCostExclGst-error" message={errors.monthlyCostExclGst} />
                  </div>
                </div>

                <div className="rounded-[8px] border border-hairline bg-neutral-tint/50 p-3">
                  <div className="flex items-center gap-2">
                    <label htmlFor="totalMonthlyInclGst" className={labelClass}>
                      Total Monthly (incl. GST)
                    </label>
                    <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-text-muted">
                      Auto-calculated
                    </span>
                  </div>
                  <div className="relative mt-2">
                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-text-muted">
                      $
                    </span>
                    <input
                      id="totalMonthlyInclGst"
                      type="text"
                      readOnly
                      tabIndex={-1}
                      value={totalInclGstDisplay}
                      placeholder="0.00"
                      className="block w-full cursor-not-allowed rounded-[6px] border border-hairline bg-neutral-tint py-2 pl-7 pr-3 font-ticket-mono text-sm font-medium tabular-nums text-content-charcoal"
                    />
                  </div>
                </div>

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
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-5">
                <div className="rounded-[8px] border border-hairline bg-neutral-tint/40 p-4">
                  <p className={brand.label}>Summary</p>
                  <div className="mt-1.5 divide-y divide-hairline">
                    <ReviewRow label="Company" value={form.companyName} />
                    <ReviewRow label="Client" value={form.clientName} />
                    <ReviewRow label="Client Email" value={form.clientEmail} />
                    <ReviewRow label="Walk-through Date" value={form.walkthroughDate} />
                    <ReviewRow label="Frequency" value={form.frequencyOfService} />
                    <ReviewRow
                      label="Scheduling"
                      value={[form.schedulingDay, form.schedulingTime].filter(Boolean).join(" — ")}
                    />
                    <ReviewRow
                      label="Price per Visit"
                      value={form.pricePerVisit ? `$${form.pricePerVisit}` : ""}
                    />
                    <ReviewRow
                      label="Monthly (incl. GST)"
                      value={totalInclGstDisplay ? `$${totalInclGstDisplay}` : ""}
                    />
                    <ReviewRow label="Acquisition" value={form.clientAcquisitionMethod} />
                  </div>
                </div>

                <div className="rounded-[8px] border border-brand-primary/25 bg-brand-primary-tint/50 p-4">
                  <h2 className={`${brand.label} text-brand-primary`}>Send Mode</h2>
                  <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    <label
                      className={`flex cursor-pointer items-start gap-2.5 rounded-[8px] border p-3 transition-colors ${
                        form.sendMode === "send_now"
                          ? "border-brand-primary bg-brand-primary-tint"
                          : "border-hairline bg-white hover:bg-surface-hover"
                      }`}
                    >
                      <input
                        type="radio"
                        name="sendMode"
                        value="send_now"
                        checked={form.sendMode === "send_now"}
                        onChange={(e) => updateField("sendMode", e.target.value as SendMode)}
                        className="mt-0.5 h-4 w-4 border-hairline text-brand-primary accent-brand-primary focus:ring-brand-primary"
                      />
                      <span>
                        <span className="block text-sm font-semibold text-content-charcoal">
                          Send Now
                        </span>
                        <span className="mt-0.5 block text-xs text-text-muted">
                          Emails the proposal immediately.
                        </span>
                      </span>
                    </label>

                    <label
                      className={`flex cursor-pointer items-start gap-2.5 rounded-[8px] border p-3 transition-colors ${
                        form.sendMode === "save_draft"
                          ? "border-brand-primary bg-brand-primary-tint"
                          : "border-hairline bg-white hover:bg-surface-hover"
                      }`}
                    >
                      <input
                        type="radio"
                        name="sendMode"
                        value="save_draft"
                        checked={form.sendMode === "save_draft"}
                        onChange={(e) => updateField("sendMode", e.target.value as SendMode)}
                        className="mt-0.5 h-4 w-4 border-hairline text-brand-primary accent-brand-primary focus:ring-brand-primary"
                      />
                      <span>
                        <span className="block text-sm font-semibold text-content-charcoal">
                          Save as Draft
                        </span>
                        <span className="mt-0.5 block text-xs text-text-muted">
                          Hidden from the client until sent later.
                        </span>
                      </span>
                    </label>
                  </div>
                  <FieldError id="sendMode-error" message={errors.sendMode} />
                </div>

                {submitError && (
                  <div className="rounded-[8px] border border-red/25 bg-red-tint p-3 text-sm text-red">
                    {submitError}
                  </div>
                )}
              </div>
            )}
          </form>

          <div className="flex items-center justify-between border-t border-hairline px-5 py-3 sm:px-6">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClear}
              disabled={isSubmitting}
              className={`${secondaryButtonClass} text-xs!`}
              size="sm"
            >
              Clear
            </Button>
            <div className="flex items-center gap-2">
              {currentStep > 0 && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleBack}
                  disabled={isSubmitting}
                  className={secondaryButtonClass}
                >
                  Back
                </Button>
              )}
              {currentStep < STEPS.length - 1 ? (
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleContinue}
                  className={primaryButtonClass}
                >
                  Continue
                </Button>
              ) : (
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isSubmitting}
                  onClick={handleSubmit}
                  className={primaryButtonClass}
                >
                  {isSubmitting
                    ? "Submitting…"
                    : form.sendMode === "send_now"
                      ? "Send Proposal"
                      : form.sendMode === "save_draft"
                        ? "Save Draft"
                        : "Save Proposal"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
