export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="h-9 w-40 animate-pulse rounded-xl bg-[var(--c-surface-2)]" />
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-44 animate-pulse rounded-2xl bg-[var(--c-surface-2)]" />
        ))}
      </div>
    </div>
  );
}