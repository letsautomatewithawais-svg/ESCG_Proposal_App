import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Hides Next's dev-only on-screen route indicator (the floating "N" badge,
  // bottom-left by default) — it was overlapping the admin sidebar's Log Out
  // button. Dev-only either way; never renders in production.
  devIndicators: false,
  // @sparticuz/chromium ships a compressed browser binary it unpacks from
  // its own node_modules directory at runtime; puppeteer-core dynamically
  // requires platform-specific files. Next's default server bundling
  // doesn't handle either well (breaks the on-disk layout they rely on),
  // which is why the PDF route 500s on Vercel despite working locally —
  // marking them external skips bundling and lets them run as plain
  // node_modules requires, the way they're designed to.
  serverExternalPackages: ["@sparticuz/chromium", "puppeteer-core"],
};

export default nextConfig;
