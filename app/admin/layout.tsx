import Sidebar from "./Sidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const displayName = process.env.ADMIN_DISPLAY_NAME || "Admin";

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-surface-off sm:flex-row">
      <Sidebar displayName={displayName} />
      <main className="min-w-0 flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
    </div>
  );
}
