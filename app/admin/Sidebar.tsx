"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Brand } from "../components/Brand";
import LogoutButton from "./LogoutButton";

function DesktopNavLink({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`block rounded-[3px] border-l-2 px-3 py-2 text-sm font-medium transition-colors ${
        active
          ? "border-sage bg-sage/10 text-ink"
          : "border-transparent text-warmgray hover:bg-ink/5 hover:text-ink"
      }`}
    >
      {label}
    </Link>
  );
}

function MobileNavLink({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`rounded-[3px] px-2.5 py-1 text-sm font-medium transition-colors ${
        active ? "bg-sage/10 text-ink" : "text-warmgray hover:text-ink"
      }`}
    >
      {label}
    </Link>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const isNewActive = pathname === "/admin/new";
  const isProposalsActive = !isNewActive;

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-hairline bg-ink/[0.035] sm:flex">
        <div className="px-6 py-6">
          <Brand />
        </div>
        <nav className="flex-1 space-y-1 px-3">
          <DesktopNavLink href="/admin" label="Proposals" active={isProposalsActive} />
          <DesktopNavLink href="/admin/new" label="New Proposal" active={isNewActive} />
        </nav>
        <div className="border-t border-hairline px-3 py-4">
          <LogoutButton />
        </div>
      </aside>

      {/* Mobile fallback: simple top bar, no sidebar */}
      <header className="border-b border-hairline bg-paper sm:hidden">
        <div className="flex items-center justify-between px-6 py-4">
          <Brand label="Admin" />
          <LogoutButton />
        </div>
        <nav className="flex items-center gap-1 border-t border-hairline px-4 py-2">
          <MobileNavLink href="/admin" label="Proposals" active={isProposalsActive} />
          <MobileNavLink href="/admin/new" label="New Proposal" active={isNewActive} />
        </nav>
      </header>
    </>
  );
}
