"use client";

import { useState } from "react";
import { IconLogout } from "@tabler/icons-react";
import { Button } from "../components/Button";

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
        className={className}
      >
        <IconLogout size={16} stroke={1.75} />
      </button>
    );
  }

  return (
    <Button
      type="button"
      variant="ghost"
      onClick={handleLogout}
      disabled={isLoggingOut}
      className={className}
    >
      {isLoggingOut ? "Logging out…" : "Log Out"}
    </Button>
  );
}
