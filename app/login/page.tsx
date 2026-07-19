"use client";

import { useState } from "react";
import type { ComponentType } from "react";
import { IconEye, IconEyeOff, IconLock, IconRosetteDiscountCheck, IconSend } from "@tabler/icons-react";
import { Button } from "../components/Button";

// Admin-only color override on the shared Button component (matches the
// same pattern used by app/admin/new/page.tsx) — the client-facing
// proposal page keeps its own separate ink/paper/sage identity, so
// Button.tsx itself stays untouched rather than recoloring its default.
const primaryButtonClass =
  "rounded-[8px]! bg-brand-primary! text-white! hover:bg-brand-primary/90! focus-visible:ring-brand-primary!";

type FeatureIcon = ComponentType<{ size?: number; stroke?: number; className?: string }>;

const FEATURES: { icon: FeatureIcon; title: string; description: string }[] = [
  {
    icon: IconSend,
    title: "One link, always current",
    description: "Share a single trackable link instead of an email attachment or a static PDF.",
  },
  {
    icon: IconEye,
    title: "Real-time engagement",
    description: "See exactly when a proposal is opened, which sections are read, and for how long.",
  },
  {
    icon: IconRosetteDiscountCheck,
    title: "Built-in e-signature",
    description: "Clients review, accept, and sign without ever leaving the page.",
  },
];

function BrandMark({ tone }: { tone: "light" | "dark" }) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] text-sm font-bold ${
          tone === "dark" ? "bg-white/15 text-white" : "bg-brand-primary text-white"
        }`}
        aria-hidden="true"
      >
        E
      </span>
      <span className="flex flex-col leading-tight">
        <span
          className={`text-sm font-bold tracking-tight ${tone === "dark" ? "text-white" : "text-content-charcoal"}`}
        >
          ESCG
        </span>
        <span className={`text-[11px] ${tone === "dark" ? "text-white/60" : "text-text-muted"}`}>
          Eastern Suburbs Cleaning Group
        </span>
      </span>
    </div>
  );
}

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!password) {
      setError("Invalid credentials.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        setError("Invalid credentials.");
        return;
      }

      window.location.href = "/admin";
    } catch {
      setError("Something went wrong, please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel — hidden below lg so mobile stays a plain, uncluttered
          form (a marketing panel has nowhere useful to go on a narrow
          screen); on wider viewports it's what actually uses the space a
          lone centered card used to leave empty. */}
      <div className="relative hidden overflow-hidden bg-brand-primary lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/10 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-black/10 blur-3xl"
        />

        <div className="relative">
          <BrandMark tone="dark" />
        </div>

        <div className="relative max-w-md">
          <h2 className="font-display text-3xl font-bold leading-tight tracking-tight text-white xl:text-4xl">
            Proposals that track themselves.
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-white/70">
            Manage cleaning service proposals from draft to signed, with visibility into how every
            client actually engages with what you send them.
          </p>

          <div className="mt-10 space-y-6">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <div key={title} className="flex items-start gap-3.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15">
                  <Icon size={17} stroke={1.9} className="text-white" />
                </span>
                <div className="min-w-0 pt-0.5">
                  <p className="text-sm font-semibold text-white">{title}</p>
                  <p className="mt-0.5 text-sm leading-snug text-white/65">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-white/45">Internal proposal management tool</p>
      </div>

      {/* Form panel */}
      <div className="flex min-h-screen items-center justify-center bg-surface-off px-6 py-16 lg:min-h-0">
        <div className="w-full max-w-[360px]">
          <div className="mb-8 lg:hidden">
            <BrandMark tone="light" />
          </div>

          <h1 className="font-display text-2xl font-bold tracking-tight text-content-charcoal">
            Welcome back
          </h1>
          <p className="mt-1.5 text-sm text-text-muted">Sign in to manage your proposals.</p>

          <form noValidate onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-content-charcoal">
                Password
              </label>
              <div className="relative mt-1.5">
                <IconLock
                  size={16}
                  stroke={1.9}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
                />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoFocus
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(null);
                  }}
                  disabled={isSubmitting}
                  aria-invalid={!!error}
                  aria-describedby="password-error"
                  className="block w-full rounded-[8px] border border-hairline bg-white py-2.5 pl-9 pr-10 text-sm text-content-charcoal placeholder:text-text-muted/70 focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  tabIndex={-1}
                  title={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-2.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-[6px] text-text-muted transition-colors hover:bg-surface-hover hover:text-content-charcoal"
                >
                  {showPassword ? (
                    <IconEyeOff size={16} stroke={1.9} />
                  ) : (
                    <IconEye size={16} stroke={1.9} />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div
                id="password-error"
                className="rounded-[8px] border border-red/25 bg-red-tint px-3 py-2.5 text-sm text-red"
              >
                {error}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              className={`w-full ${primaryButtonClass}`}
            >
              {isSubmitting ? "Signing in…" : "Log In"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
