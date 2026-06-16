export function AdminLoading() {
  return (
    <div className="animate-pulse p-6 sm:p-8">
      <div className="mb-8 h-8 w-48 rounded bg-lagari-surface" />
      <div className="mb-3 h-4 w-72 max-w-full rounded bg-lagari-surface" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="admin-card h-24 rounded-sm" />
        ))}
      </div>
      <div className="admin-card mt-8 h-64 rounded-sm" />
    </div>
  );
}
