import { TrendingUp, TrendingDown } from 'lucide-react';
import { Skeleton } from '../../../components/ui/skeleton';
import { cn } from '../../../lib/utils';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: number;
  icon: React.ElementType;
  loading?: boolean;
  gradient?: string;
}

const ICON_BG_MAP: Record<string, string> = {
  blue: 'bg-primary/10 text-primary',
  amber: 'bg-amber-50 text-amber-600',
  teal: 'bg-teal-50 text-teal-600',
  rose: 'bg-rose-50 text-rose-600',
  green: 'bg-emerald-50 text-emerald-600',
};

export default function MetricCard({
  title,
  value,
  subtitle,
  trend,
  icon: Icon,
  loading,
  gradient = 'blue',
}: MetricCardProps) {
  const trendPositive = trend !== undefined && trend > 0;
  const trendNegative = trend !== undefined && trend < 0;

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-2xl p-5" role="status" aria-label={`Loading ${title}`}>
        <div className="space-y-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-3 w-28" />
        </div>
      </div>
    );
  }

  return (
    <article
      className="bg-card rounded-2xl p-5 border border-border hover:shadow-hover transition-all duration-200 group"
      aria-label={`${title}: ${value}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">{title}</p>
          <p className="text-2xl font-bold text-foreground tracking-tight">{value}</p>
          {trend !== undefined && (
            <div className="flex items-center gap-1.5 mt-2">
              <span
                className={cn(
                  'inline-flex items-center gap-0.5 text-xs font-medium',
                  trendPositive && 'text-emerald-600',
                  trendNegative && 'text-destructive',
                  !trendPositive && !trendNegative && 'text-muted-foreground',
                )}
              >
                {trendPositive && <TrendingUp className="w-3 h-3" />}
                {trendNegative && <TrendingDown className="w-3 h-3" />}
                {trend > 0 ? '+' : ''}{trend}%
              </span>
            </div>
          )}
          {!trend && subtitle && (
            <p className="text-xs text-muted-foreground mt-1.5">{subtitle}</p>
          )}
        </div>
        <div className={cn(
          'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105',
          ICON_BG_MAP[gradient] || ICON_BG_MAP.blue,
        )}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </article>
  );
}
