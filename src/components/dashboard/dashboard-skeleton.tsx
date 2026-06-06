export function DashboardSkeleton() {
  return (
    <div className="mt-8 space-y-6" aria-label="Loading dashboard metrics">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className="h-36 animate-pulse rounded-2xl border border-slate-200 bg-white/80 motion-reduce:animate-none"
          />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-5">
        <div className="h-96 animate-pulse rounded-2xl border border-slate-200 bg-white/80 motion-reduce:animate-none xl:col-span-3" />
        <div className="h-96 animate-pulse rounded-2xl border border-slate-200 bg-white/80 motion-reduce:animate-none xl:col-span-2" />
      </div>
    </div>
  );
}
