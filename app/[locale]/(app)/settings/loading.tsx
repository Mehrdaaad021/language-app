export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="h-9 w-40 animate-pulse rounded-xl bg-[var(--c-surface-2)]" />
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-40 animate-pulse rounded-2xl bg-[var(--c-surface-2)]" />
      ))}
    </div>
  );
}