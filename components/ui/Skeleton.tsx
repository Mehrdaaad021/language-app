/* اسکلتون‌های shimmer — جایگزین animate-pulse ساده */

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} aria-hidden="true" />;
}

export function SkeletonCard() {
  return (
    <div className="rounded-3xl bg-[var(--c-surface)] p-5 shadow-[0_10px_30px_-18px_rgba(74,36,48,0.35)]">
      <div className="flex items-start gap-4">
        <Skeleton className="h-12 w-12 rounded-2xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
        <Skeleton className="h-6 w-14 rounded-full" />
      </div>
      <Skeleton className="mt-4 h-3 w-1/3" />
    </div>
  );
}

export function SkeletonStat() {
  return (
    <div className="stat-cream rounded-3xl p-5">
      <Skeleton className="h-3 w-1/2" />
      <Skeleton className="mt-3 h-8 w-2/3" />
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="flex items-center justify-between rounded-xl bg-[var(--c-surface-2)] p-3">
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-9 rounded-full" />
        <div className="space-y-1.5">
          <Skeleton className="h-3.5 w-28" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <Skeleton className="h-6 w-12 rounded-lg" />
    </div>
  );
}