import { redirect } from "next/navigation";

// Proposal detail is now shown in-place on /admin via a ?selected= URL param
// (see ProposalsWorkspace) instead of a full route navigation — this route
// only exists so any old bookmarked/copied /admin/{id} links still work.
export default async function ProposalDetailRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/admin?selected=${id}`);
}
