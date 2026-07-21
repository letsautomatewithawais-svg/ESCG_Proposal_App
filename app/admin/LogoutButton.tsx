"use client";

import { useState } from "react";
import { IconLogout } from "@tabler/icons-react";
import { brand } from "@/lib/ui";

// Deliberately its own styled <button> rather than the shared Button
// component — Button's "ghost"/"secondary" variants still hardcode the
// retired ink/sage identity (text-ink, focus-visible:ring-sage), which read
// as an unstyled, out-of-place link next to the brand-primary/content-
// charcoal admin chrome around it.

export default function LogoutButton({
  className = "",
  iconOnly = false,
}: {
  className?: string;
  iconOnly?: boolean;
}) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      window.location.href = "/login";
    }
  }

  if (iconOnly) {
    return (
      <button
        type="button"
        onClick={handleLogout}
        disabled={isLoggingOut}
        title="Log Out"
        aria-label="Log Out"
        className={`flex items-center justify-center rounded-[6px] text-text-muted transition-colors hover:bg-surface-hover hover:text-content-charcoal disabled:cursor-not-allowed disabled:opacity-50 ${brand.pressable} ${className}`}
      >
        <IconLogout size={16} stroke={1.75} />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isLoggingOut}
      className={`flex items-center gap-2 rounded-full border border-hairline px-3.5 py-2.5 text-sm font-medium text-text-muted transition-colors hover:border-border-strong hover:bg-surface-hover hover:text-content-charcoal disabled:cursor-not-allowed disabled:opacity-50 ${brand.pressable} ${className}`}
    >
      <IconLogout size={16} stroke={1.85} className="shrink-0" />
      {isLoggingOut ? "Logging out…" : "Log Out"}
    </button>
  );
}
