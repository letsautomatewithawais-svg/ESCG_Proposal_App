import Sidebar from "./Sidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-paper sm:flex-row">
      <Sidebar />
      <main className="min-w-0 flex-1 px-6 py-8 sm:px-10 sm:py-10">{children}</main>
    </div>
  );
}
