"use client";

import { useState } from "react";
import { Button } from "../components/Button";

export default function LogoutButton() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      window.location.href = "/login";
    }
  }

  return (
    <Button type="button" variant="ghost" onClick={handleLogout} disabled={isLoggingOut}>
      {isLoggingOut ? "Logging out…" : "Log Out"}
    </Button>
  );
}
