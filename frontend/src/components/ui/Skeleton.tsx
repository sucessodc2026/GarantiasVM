interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-[var(--bg-elevated)] ${className}`}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl p-6 space-y-4">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-3 w-40" />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border-subtle)]">
      <div className="flex gap-3 px-5 py-3 bg-[var(--bg-elevated)] border-b border-[var(--border-subtle)]">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-3 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex gap-3 px-5 py-4 border-b border-[var(--border-subtle)]"
        >
          {[1, 2, 3, 4].map((j) => (
            <Skeleton key={j} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function ListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl p-6 space-y-3"
        >
          <div className="flex justify-between">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <Skeleton className="h-3 w-64" />
          <Skeleton className="h-3 w-full" />
        </div>
      ))}
    </div>
  );
}
