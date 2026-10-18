export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="h-10 w-56 animate-pulse rounded-2xl bg-white/30" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-[24px] bg-white/25" />
        ))}
      </div>
    </div>
  );
}