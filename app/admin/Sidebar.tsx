"use client";

import type { ComponentType } from "react";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconChevronLeft, IconChevronRight, IconClipboardList, IconPlus } from "@tabler/icons-react";
import { Brand } from "../components/Brand";
import LogoutButton from "./LogoutButton";
import { brand } from "@/lib/ui";

type NavIcon = ComponentType<{ size?: number; stroke?: number; className?: string }>;

function DesktopNavLink({
  href,
  label,
  active,
  icon: Icon,
  collapsed,
}: {
  href: string;
  label: string;
  active: boolean;
  icon: NavIcon;
  collapsed: boolean;
}) {
  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      className={`flex items-center gap-2.5 rounded-[8px] px-3 py-2 text-sm font-medium transition-colors ${
        collapsed ? "justify-center px-0" : ""
      } ${
        active
          ? "bg-brand-green-tint text-brand-green"
          : "text-content-charcoal/70 hover:bg-surface-hover hover:text-content-charcoal"
      }`}
    >
      <Icon size={17} stroke={1.85} className="shrink-0" />
      {!collapsed && label}
    </Link>
  );
}

function NavGroupLabel({ children }: { children: React.ReactNode }) {
  return <p className={`${brand.label} px-3 pb-1.5 pt-4 first:pt-0`}>{children}</p>;
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
      className={`rounded-[6px] px-2.5 py-1 text-sm font-medium transition-colors ${
        active ? "bg-brand-green-tint text-brand-green" : "text-text-muted hover:text-content-charcoal"
      }`}
    >
      {label}
    </Link>
  );
}

export default function Sidebar({ displayName }: { displayName: string }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const avatarInitial = displayName.charAt(0).toUpperCase();
  const isNewActive = pathname === "/admin/new";
  const isProposalsActive = !isNewActive;

  return (
    <>
      {/* Desktop sidebar — a reference dashboard (Stripe) runs a light, near-
          white sidebar with a single restrained accent color rather than a
          dark colored panel, so nav state reads as "flat text + a tinted
          pill", not gradients/glows. Fixed to viewport height (see
          admin/layout.tsx's h-screen/overflow-hidden shell) so the footer
          always stays pinned at the bottom instead of scrolling away with
          long page content. */}
      <aside
        className={`hidden shrink-0 flex-col border-r border-hairline bg-white transition-[width] duration-200 sm:flex ${
          collapsed ? "w-[68px]" : "w-60"
        }`}
      >
        <div
          className={`flex items-center gap-2 px-4 py-5 ${collapsed ? "flex-col" : "justify-between px-5"}`}
        >
          {collapsed ? (
            <span
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[7px] bg-brand-green text-xs font-bold text-white"
              aria-hidden="true"
            >
              E
            </span>
          ) : (
            <div className="flex items-center gap-2.5">
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[7px] bg-brand-green text-xs font-bold text-white"
                aria-hidden="true"
              >
                E
              </span>
              <span className="flex flex-col leading-tight">
                <span className="text-sm font-bold tracking-tight text-content-charcoal">ESCG</span>
                <span className="text-[11px] text-text-muted">Eastern Suburbs Cleaning Group</span>
              </span>
            </div>
          )}
          <button
            type="button"
            onClick={() => setCollapsed((value) => !value)}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[6px] text-text-muted transition-all hover:bg-surface-hover hover:text-content-charcoal active:scale-90"
          >
            {collapsed ? (
              <IconChevronRight size={14} stroke={2} />
            ) : (
              <IconChevronLeft size={14} stroke={2} />
            )}
          </button>
        </div>

        {/* Nav no longer stretches with flex-1 — with only two real items,
            an open-ended stretchy nav read as unfinished rather than
            spacious. Closing it with its own divider, then a genuine (but
            now clearly bounded) gap down to the footer's own border, makes
            the whitespace read as deliberate breathing room between two
            anchored sections instead of one ambiguous void. */}
        <nav className="px-3 pt-2">
          {!collapsed && <NavGroupLabel>Main</NavGroupLabel>}
          <div className={`space-y-1 ${collapsed ? "mt-2" : ""}`}>
            <DesktopNavLink
              href="/admin"
              label="Proposals"
              active={isProposalsActive}
              icon={IconClipboardList}
              collapsed={collapsed}
            />
            <DesktopNavLink
              href="/admin/new"
              label="New Proposal"
              active={isNewActive}
              icon={IconPlus}
              collapsed={collapsed}
            />
          </div>
        </nav>
        <div className="mx-3 mt-3 flex-1 border-t border-border-subtle" aria-hidden="true" />

        <div className="border-t border-hairline px-3 py-4">
          <div className={`flex items-center gap-3 ${collapsed ? "justify-center" : "px-1"}`}>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-green-tint text-sm font-semibold text-brand-green">
              {avatarInitial}
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-content-charcoal">{displayName}</p>
                <p className="truncate text-xs text-text-muted">Administrator</p>
              </div>
            )}
          </div>
          {collapsed ? (
            <LogoutButton
              iconOnly
              className="mt-3 flex w-full items-center justify-center rounded-[8px] p-2 text-text-muted transition-colors hover:bg-surface-hover hover:text-content-charcoal"
            />
          ) : (
            <LogoutButton className="mt-3 w-full justify-start text-text-muted! hover:bg-surface-hover! hover:text-content-charcoal!" />
          )}
        </div>
      </aside>

      {/* Mobile fallback: simple top bar, no sidebar */}
      <header className="border-b border-hairline bg-surface-off sm:hidden">
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
