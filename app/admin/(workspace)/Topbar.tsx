// The global search box that used to live here was purely decorative (never
// wired to anything) — replaced by the real, working search in
// ProposalsTable's filter row instead of keeping two search boxes where only
// one actually works. The notification bell that used to sit here was
// removed for the same reason: no notification system exists yet (see the
// dev brief audit — Tory notifications are the one remaining built gap), so
// showing a bell with nothing behind it was a fake affordance, not a feature.
export default function Topbar() {
  return (
    <div className="flex items-center border-b border-hairline px-6 py-3 sm:px-8">
      <span className="text-sm font-medium text-content-charcoal">Proposals</span>
    </div>
  );
}
