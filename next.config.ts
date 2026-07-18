import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Hides Next's dev-only on-screen route indicator (the floating "N" badge,
  // bottom-left by default) — it was overlapping the admin sidebar's Log Out
  // button. Dev-only either way; never renders in production.
  devIndicators: false,
};

export default nextConfig;
