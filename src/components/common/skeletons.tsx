import { Skeleton } from '../ui/skeleton';
import { cn } from '../../lib/utils';

// ─── Table Skeleton ─────────────────────────────────────────────────────
interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  className?: string;
  showHeader?: boolean;
}

export function TableSkeleton({ rows = 5, columns = 5, className, showHeader = true }: TableSkeletonProps) {
  return (
    <div className={cn('w-full rounded-lg border border-border overflow-hidden', className)}>
      {showHeader && (
        <div className="flex gap-4 px-4 py-3 bg-muted/50 border-b border-border">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} className="h-3.5 flex-1 max-w-[120px]" />
          ))}
        </div>
      )}
      {Array.from({ length: rows }).map((_, row) => (
        <div key={row} className="flex items-center gap-4 px-4 py-3 border-b border-border last:border-b-0">
          {Array.from({ length: columns }).map((_, col) => (
            <Skeleton
              key={col}
              className={cn(
                'h-4 flex-1',
                col === 0 ? 'max-w-[80px]' : col === 1 ? 'max-w-[160px]' : 'max-w-[100px]'
              )}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── Stat Cards Skeleton ────────────────────────────────────────────────
interface StatCardSkeletonProps {
  count?: number;
  className?: string;
}

export function StatCardsSkeleton({ count = 4, className }: StatCardSkeletonProps) {
  return (
    <div className={cn('grid grid-cols-2 md:grid-cols-4 gap-4', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-3.5 w-20" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </div>
          <Skeleton className="h-7 w-16" />
          <Skeleton className="h-3 w-24" />
        </div>
      ))}
    </div>
  );
}

// ─── Card Grid Skeleton ─────────────────────────────────────────────────
interface CardGridSkeletonProps {
  count?: number;
  columns?: number;
  className?: string;
}

export function CardGridSkeleton({ count = 6, columns = 3, className }: CardGridSkeletonProps) {
  return (
    <div className={cn(
      'grid gap-4',
      columns === 2 ? 'grid-cols-1 md:grid-cols-2' :
      columns === 3 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' :
      'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
      className
    )}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
          <div className="flex gap-2 pt-1">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── List Skeleton ──────────────────────────────────────────────────────
interface ListSkeletonProps {
  rows?: number;
  showAvatar?: boolean;
  className?: string;
}

export function ListSkeleton({ rows = 5, showAvatar = true, className }: ListSkeletonProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card">
          {showAvatar && <Skeleton className="h-10 w-10 rounded-full shrink-0" />}
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}

// ─── Form Skeleton ──────────────────────────────────────────────────────
interface FormSkeletonProps {
  fields?: number;
  className?: string;
}

export function FormSkeleton({ fields = 4, className }: FormSkeletonProps) {
  return (
    <div className={cn('space-y-5', className)}>
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
      ))}
      <Skeleton className="h-10 w-32 rounded-md" />
    </div>
  );
}

// ─── Chart Skeleton ─────────────────────────────────────────────────────
interface ChartSkeletonProps {
  height?: number;
  className?: string;
}

export function ChartSkeleton({ height = 220, className }: ChartSkeletonProps) {
  return (
    <div className={cn('rounded-xl border border-border bg-card p-5', className)}>
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-8 w-24 rounded-md" />
      </div>
      <Skeleton className={`w-full rounded-lg`} style={{ height }} />
    </div>
  );
}

// ─── Page Skeleton (full page loading) ──────────────────────────────────
interface PageSkeletonProps {
  type?: 'table' | 'cards' | 'list' | 'dashboard';
  className?: string;
}

export function PageSkeleton({ type = 'table', className }: PageSkeletonProps) {
  return (
    <div className={cn('space-y-6 animate-in fade-in-50 duration-300', className)}>
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24 rounded-md" />
          <Skeleton className="h-9 w-9 rounded-md" />
        </div>
      </div>

      {/* Stat cards */}
      <StatCardsSkeleton />

      {/* Toolbar skeleton */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 flex-1 max-w-xs rounded-md" />
        <Skeleton className="h-9 w-28 rounded-md" />
        <Skeleton className="h-9 w-28 rounded-md" />
      </div>

      {/* Content skeleton based on type */}
      {type === 'table' && <TableSkeleton />}
      {type === 'cards' && <CardGridSkeleton />}
      {type === 'list' && <ListSkeleton />}
      {type === 'dashboard' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
      )}
    </div>
  );
}
