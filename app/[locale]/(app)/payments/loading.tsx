export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="h-9 w-44 animate-pulse rounded-xl bg-[var(--c-surface-2)]" />
      <div className="grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-[var(--c-surface-2)]" />
        ))}
      </div>
      <div className="space-y-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-2xl bg-[var(--c-surface-2)]" />
        ))}
      </div>
    </div>
  );
}