"use client";

import { useState } from "react";
import { IconEye, IconEyeOff, IconLock } from "@tabler/icons-react";
import { Button } from "../components/Button";
import { brand } from "@/lib/ui";

// Admin-only color override on the shared Button component (matches the
// same pattern used by app/admin/new/page.tsx) — the client-facing
// proposal page keeps its own separate ink/paper/sage identity, so
// Button.tsx itself stays untouched rather than recoloring its default.
const primaryButtonClass =
  "rounded-[8px]! bg-brand-primary! text-white! hover:bg-brand-primary/90! focus-visible:ring-brand-primary!";

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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-surface-off px-4">
      {/* Restrained ambient brand glow behind the card — a soft blurred
          circle, not a loud gradient wash, in keeping with the rest of the
          admin identity's border-first, low-shadow philosophy. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-primary/[0.07] blur-3xl"
      />

      <div className={`relative w-full max-w-[400px] p-8 sm:p-9 ${brand.card}`}>
        <div className="flex flex-col items-center text-center">
          <span
            className="flex h-11 w-11 items-center justify-center rounded-[10px] bg-brand-primary text-base font-bold text-white shadow-[0_4px_14px_-3px_rgba(124,92,252,0.5)]"
            aria-hidden="true"
          >
            E
          </span>
          <h1 className="mt-4 font-display text-2xl font-bold tracking-tight text-content-charcoal">
            Welcome back
          </h1>
          <p className="mt-1.5 text-sm text-text-muted">
            Sign in to manage Eastern Suburbs Cleaning Group proposals.
          </p>
        </div>

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
  );
}
