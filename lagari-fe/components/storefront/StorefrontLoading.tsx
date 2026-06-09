export function StorefrontLoading() {
  return (
    <div className="mx-auto max-w-7xl animate-pulse px-4 py-10 sm:px-6 sm:py-14">
      <div className="mb-10 h-4 w-16 rounded bg-lagari-surface" />
      <div className="mb-3 h-10 w-64 max-w-full rounded bg-lagari-surface" />
      <div className="mb-8 h-4 w-40 rounded bg-lagari-surface" />
      <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="aspect-[4/5] rounded-sm border border-lagari-border bg-lagari-surface"
          />
        ))}
      </div>
    </div>
  );
}
