import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDateAU, formatRelativeTime } from "@/lib/format";
import { surface, text } from "@/lib/ui";
import { buttonClasses } from "../components/Button";
import ProposalRow from "./ProposalRow";

const STATUS_OPTIONS = ["Draft", "Sent", "Opened", "Signed", "Lost"] as const;
type StatusOption = (typeof STATUS_OPTIONS)[number];

function isValidStatus(value: string | undefined): value is StatusOption {
  return !!value && (STATUS_OPTIONS as readonly string[]).includes(value);
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className={`${surface.primary} px-5 py-4`}>
      <p className={text.small}>{label}</p>
      <p className="mt-1.5 font-mono text-2xl font-semibold tabular-nums text-ink">{value}</p>
    </div>
  );
}

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; from?: string; to?: string }>;
}) {
  const { status, from, to } = await searchParams;

  const where: {
    status?: StatusOption;
    createdAt?: { gte?: Date; lt?: Date };
  } = {};

  if (isValidStatus(status)) {
    where.status = status;
  }

  const createdAt: { gte?: Date; lt?: Date } = {};
  if (from) {
    const fromDate = new Date(from);
    if (!Number.isNaN(fromDate.getTime())) createdAt.gte = fromDate;
  }
  if (to) {
    const toDate = new Date(to);
    if (!Number.isNaN(toDate.getTime())) {
      toDate.setDate(toDate.getDate() + 1);
      createdAt.lt = toDate;
    }
  }
  if (Object.keys(createdAt).length > 0) {
    where.createdAt = createdAt;
  }

  const proposals = await prisma.proposal.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  const hasFilters = Boolean(status || from || to);

  const totalCount = proposals.length;
  const signedCount = proposals.filter((p) => p.status === "Signed").length;
  const sentCount = proposals.filter((p) => p.status === "Sent").length;
  const lostCount = proposals.filter((p) => p.status === "Lost").length;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className={text.pageTitle}>Proposals</h1>
          <p className={`mt-1 ${text.muted}`}>
            {proposals.length} {proposals.length === 1 ? "proposal" : "proposals"}
            {hasFilters ? " matching your filters" : ""}
          </p>
        </div>
        <Link href="/admin/new" className={buttonClasses("primary")}>
          New Proposal
        </Link>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Proposals" value={totalCount} />
        <StatCard label="Signed" value={signedCount} />
        <StatCard label="Sent (awaiting response)" value={sentCount} />
        <StatCard label="Lost" value={lostCount} />
      </div>

      <form
        method="GET"
        className={`mt-10 flex flex-wrap items-end gap-x-6 gap-y-4 ${surface.nested} px-5 py-4`}
      >
        <div>
          <label htmlFor="status" className="block text-xs font-semibold text-ink">
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={status ?? ""}
            className="mt-1.5 rounded-md border border-hairline bg-paper px-3 py-1.5 text-sm text-ink focus:border-sage focus:outline-none focus:ring-1 focus:ring-sage"
          >
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="from" className="block text-xs font-semibold text-ink">
            Created From
          </label>
          <input
            id="from"
            type="date"
            name="from"
            defaultValue={from ?? ""}
            className="mt-1.5 rounded-md border border-hairline bg-paper px-3 py-1.5 text-sm text-ink focus:border-sage focus:outline-none focus:ring-1 focus:ring-sage"
          />
        </div>

        <div>
          <label htmlFor="to" className="block text-xs font-semibold text-ink">
            Created To
          </label>
          <input
            id="to"
            type="date"
            name="to"
            defaultValue={to ?? ""}
            className="mt-1.5 rounded-md border border-hairline bg-paper px-3 py-1.5 text-sm text-ink focus:border-sage focus:outline-none focus:ring-1 focus:ring-sage"
          />
        </div>

        <div className="flex items-center gap-4">
          <button type="submit" className={buttonClasses("secondary")}>
            Apply Filters
          </button>
          <Link href="/admin" className="text-sm text-warmgray hover:text-ink">
            Clear
          </Link>
        </div>
      </form>

      <div className={`mt-10 overflow-hidden overflow-x-auto ${surface.primary}`}>
        <table className="w-full min-w-[760px] text-left">
          <thead className="border-b border-hairline bg-ink/[0.03]">
            <tr>
              <th className={`px-5 py-3 ${text.sectionLabel}`}>Client Name</th>
              <th className={`px-5 py-3 ${text.sectionLabel}`}>Company</th>
              <th className={`px-5 py-3 ${text.sectionLabel}`}>Date Sent</th>
              <th className={`px-5 py-3 ${text.sectionLabel}`}>Status</th>
              <th className={`px-5 py-3 ${text.sectionLabel}`}>Last Activity</th>
              <th className={`px-5 py-3 ${text.sectionLabel}`}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {proposals.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-20 text-center">
                  <p className="text-sm font-semibold text-ink">No proposals found.</p>
                  <p className={`mt-1 ${text.small}`}>
                    {hasFilters
                      ? "Try adjusting or clearing your filters."
                      : "New proposals will appear here once created."}
                  </p>
                </td>
              </tr>
            ) : (
              proposals.map((proposal) => {
                const hasActivity =
                  proposal.updatedAt.getTime() - proposal.createdAt.getTime() > 2000;
                return (
                  <ProposalRow
                    key={proposal.id}
                    id={proposal.id}
                    clientName={proposal.clientName}
                    companyName={proposal.companyName}
                    dateSentDisplay={
                      proposal.status === "Draft" ? "—" : formatDateAU(proposal.createdAt)
                    }
                    status={proposal.status}
                    lastActivityDisplay={
                      hasActivity ? formatRelativeTime(proposal.updatedAt) : "Never"
                    }
                  />
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
