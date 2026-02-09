export function CardSkeleton() {
  return (
    <div className="bg-surface border border-border rounded-xl p-6 shadow-sm">
      <div className="h-4 w-24 bg-surface-hover rounded animate-pulse mb-3" />
      <div className="h-9 w-20 bg-surface-hover rounded animate-pulse mb-2" />
      <div className="h-3 w-32 bg-surface-hover rounded animate-pulse" />
    </div>
  );
}

export function ChartSkeleton({ height = 300 }: { height?: number }) {
  return (
    <div className="bg-surface border border-border rounded-xl p-6 shadow-sm">
      <div className="h-5 w-40 bg-surface-hover rounded animate-pulse mb-6" />
      <div className={`bg-surface-hover/50 rounded animate-pulse`} style={{ height }} />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-surface border border-border rounded-xl p-6 shadow-sm">
      <div className="h-5 w-40 bg-surface-hover rounded animate-pulse mb-6" />
      <div className="space-y-3">
        <div className="flex gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-4 flex-1 bg-surface-hover rounded animate-pulse" />
          ))}
        </div>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-4">
            {[1, 2, 3, 4].map((j) => (
              <div key={j} className="h-4 flex-1 bg-surface-hover/60 rounded animate-pulse" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
