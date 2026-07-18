import Topbar from "./Topbar";
import { brand } from "@/lib/ui";

// Structural rollback: this used to render a persistent two-pane shell
// (a left ticket queue alongside {children}). /admin and /admin/[id] are
// full, independent pages again — this layout now only provides the shared
// Topbar (search/bell) and the panel chrome around them. Uses the flat
// `panel` tier, not `card` — a reference dashboard (Stripe) doesn't wrap its
// whole workspace in an ambient shadow, just a hairline border.
export default function AdminWorkspaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`flex min-h-full flex-col ${brand.panel}`}>
      <Topbar />
      {children}
    </div>
  );
}
