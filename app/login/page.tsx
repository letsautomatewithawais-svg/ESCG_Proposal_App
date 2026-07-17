"use client";

import { useState } from "react";
import { Brand } from "../components/Brand";
import { Button } from "../components/Button";
import { surface, text } from "@/lib/ui";

export default function LoginPage() {
  const [password, setPassword] = useState("");
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
    <div className="flex min-h-screen items-center justify-center bg-paper px-4">
      <div className={`w-full max-w-sm ${surface.primary} p-8`}>
        <div className="flex flex-col items-center text-center">
          <Brand />
          <h1 className={`mt-4 ${text.cardTitle}`}>Admin Login</h1>
          <p className={`mt-1 ${text.muted}`}>Sign in to manage proposals.</p>
        </div>

        <form noValidate onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label htmlFor="password" className={text.label}>
              Password
            </label>
            <input
              id="password"
              type="password"
              autoFocus
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(null);
              }}
              disabled={isSubmitting}
              aria-invalid={!!error}
              aria-describedby="password-error"
              className="mt-1 block w-full rounded-[3px] border border-hairline bg-paper px-3 py-2 text-sm text-ink focus:border-sage focus:outline-none focus:ring-1 focus:ring-sage disabled:opacity-50"
            />
          </div>

          {error && (
            <div
              id="password-error"
              className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          <Button type="submit" variant="primary" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Logging in…" : "Log In"}
          </Button>
        </form>
      </div>
    </div>
  );
}
