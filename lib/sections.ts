// Single source of truth for the client-facing proposal document's tracked
// sections. Used by: ProposalTracker.tsx (which DOM id maps to which name),
// ProposalDetailPanel.tsx (progress bar / timeline), and the tracking API
// route (to reject section names it doesn't recognize). Keep this list in
// sync with the actual <DocumentPage id="..."> ids in app/proposals/[uuid]/document —
// and with the hardcoded "Signature Block" name in
// app/api/proposals/[uuid]/sign/route.ts, which isn't derived from here.
export const TRACKED_SECTIONS = [
  { id: "section-cover", name: "Cover" },
  { id: "section-introduction", name: "Introduction" },
  { id: "section-features", name: "What You Get" },
  { id: "section-scope-of-work", name: "Scope of Work" },
  { id: "section-scheduling", name: "Scheduling" },
  { id: "section-pricing", name: "Pricing" },
  { id: "section-insurance", name: "Insurance" },
  { id: "section-terms", name: "Terms" },
  { id: "section-additional-services", name: "Additional Services" },
  { id: "section-signature-block", name: "Signature Block" },
  { id: "section-quality-methodology", name: "Quality Methodology" },
  { id: "section-colour-coding", name: "Colour Coding" },
  { id: "section-microfibre", name: "Microfibre Procedures" },
] as const;

export const TRACKED_SECTION_NAMES = TRACKED_SECTIONS.map((s) => s.name);
