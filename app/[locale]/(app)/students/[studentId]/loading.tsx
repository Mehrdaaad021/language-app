export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="h-5 w-24 animate-pulse rounded-lg bg-[var(--c-surface-2)]" />
      <div className="h-40 animate-pulse rounded-2xl bg-[var(--c-surface-2)]" />
      <div className="grid gap-5 lg:grid-cols-2">
        {[0, 1].map((i) => (
          <div key={i} className="h-64 animate-pulse rounded-2xl bg-[var(--c-surface-2)]" />
        ))}
      </div>
      <div className="h-56 animate-pulse rounded-2xl bg-[var(--c-surface-2)]" />
    </div>
  );
}