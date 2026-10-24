export default function Loading() {
  return (
    <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">
      {/* Sidebar skeleton */}
      <aside className="hidden lg:block w-[260px] shrink-0 border-r border-[var(--border-color)] pr-3 space-y-3">
        <div className="h-4 w-28 bg-[var(--bg-surface)] rounded animate-pulse" />
        <div className="space-y-2 pt-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-7 w-full bg-[var(--bg-surface)] rounded animate-pulse" />
          ))}
        </div>
      </aside>

      {/* Main content skeleton */}
      <div className="flex-1 min-w-0 space-y-6">
        <div className="pb-6 border-b border-[var(--border-color)] space-y-3">
          <div className="h-8 w-3/4 bg-[var(--bg-surface)] rounded animate-pulse" />
          <div className="h-4 w-1/2 bg-[var(--bg-surface)] rounded animate-pulse" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-28 bg-[var(--bg-surface)] rounded border border-[var(--border-color)] animate-pulse" />
          ))}
        </div>

        <div className="space-y-4 pt-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-[var(--bg-surface)] rounded border border-[var(--border-color)] animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
