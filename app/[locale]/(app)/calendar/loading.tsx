export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="h-9 w-40 animate-pulse rounded-xl bg-[var(--c-surface-2)]" />
      <div className="h-[500px] animate-pulse rounded-2xl bg-[var(--c-surface-2)]" />
      <div className="h-48 animate-pulse rounded-2xl bg-[var(--c-surface-2)]" />
    </div>
  );
}