export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="h-9 w-56 animate-pulse rounded-xl bg-[var(--c-surface-2)]" />
      <div className="h-4 w-72 animate-pulse rounded-lg bg-[var(--c-surface-2)]" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-2xl bg-[var(--c-surface-2)]" />
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        {[0, 1].map((i) => (
          <div key={i} className="h-72 animate-pulse rounded-2xl bg-[var(--c-surface-2)]" />
        ))}
      </div>
    </div>
  );
}