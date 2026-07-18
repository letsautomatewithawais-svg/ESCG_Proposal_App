import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[50vh] w-full max-w-md flex-col items-center justify-center px-6 text-center">
      <h1 className="text-xl font-semibold text-gray-900">Proposal not found</h1>
      <p className="mt-2 text-sm text-gray-500">
        This proposal may have been removed or the link is incorrect.
      </p>
      <Link href="/admin" className="mt-4 text-sm font-medium text-gray-900 hover:underline">
        &larr; Back to Proposals
      </Link>
    </div>
  );
}
