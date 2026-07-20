"use client";

import { useState } from "react";
import { IconEye, IconEyeOff, IconLock } from "@tabler/icons-react";
import { Button } from "../components/Button";

// Admin-only color override on the shared Button component (matches the
// same pattern used by app/admin/new/page.tsx) — the client-facing
// proposal page keeps its own separate ink/paper/sage identity, so
// Button.tsx itself stays untouched rather than recoloring its default.
const primaryButtonClass =
  "rounded-[8px]! bg-brand-primary! text-white! hover:bg-brand-primary/90! focus-visible:ring-brand-primary!";

function BrandMark() {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/logo.png" alt="Eastern Suburbs Cleaning Group" className="h-10 w-auto shrink-0" />;
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
    <div className="flex min-h-dvh items-center justify-center bg-surface-off px-6 py-16">
      <div className="w-full max-w-[360px]">
        <div className="mb-8 flex justify-center">
          <BrandMark />
        </div>

        <h1 className="text-center font-display text-2xl font-bold tracking-tight text-content-charcoal">
          Welcome back
        </h1>
        <p className="mt-1.5 text-center text-sm text-text-muted">Sign in to manage your proposals.</p>

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
