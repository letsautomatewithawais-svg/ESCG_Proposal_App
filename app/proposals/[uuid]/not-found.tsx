export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col items-center justify-center px-6 text-center">
      <span className="text-lg font-bold tracking-tight text-gray-900">ESCG</span>
      <h1 className="mt-6 text-xl font-semibold text-gray-900">Proposal not found</h1>
      <p className="mt-2 text-sm text-gray-500">
        This link may be invalid or the proposal may have been removed. Please check the link or
        contact Eastern Suburbs Cleaning Group for a new one.
      </p>
    </div>
  );
}
