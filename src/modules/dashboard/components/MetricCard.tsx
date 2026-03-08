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

const ACCENT_MAP: Record<string, string> = {
  blue: 'accent-border-blue',
  amber: 'accent-border-amber',
  teal: 'accent-border-teal',
  rose: 'accent-border-rose',
  green: 'accent-border-green',
};

const ICON_BG_MAP: Record<string, string> = {
  blue: 'bg-primary/10 text-primary',
  amber: 'bg-amber-50 text-amber-600',
  teal: 'bg-teal-50 text-teal-600',
  rose: 'bg-rose-50 text-rose-600',
  green: 'bg-emerald-50 text-emerald-600',
};

function MiniSparkline({ trend }: { trend: number }) {
  const isPositive = trend >= 0;
  const strokeColor = isPositive
    ? 'hsl(142, 76%, 36%)'
    : 'hsl(0, 84%, 60%)';

  const points = isPositive
    ? 'M0,20 L10,18 L20,15 L30,12 L40,14 L50,10 L60,8'
    : 'M0,8 L10,10 L20,12 L30,15 L40,13 L50,17 L60,20';

  return (
    <svg
      width="60"
      height="28"
      viewBox="0 0 60 28"
      className="opacity-50"
      aria-hidden="true"
      role="presentation"
    >
      <path
        d={points}
        fill="none"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

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
      <div
        className="bg-card border border-border/50 rounded-2xl p-5 shadow-card"
        role="status"
        aria-label={`Loading ${title}`}
      >
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
      className={cn(
        'bg-card rounded-2xl p-5 shadow-card border border-border/50',
        'hover:shadow-hover transition-all duration-300 group overflow-hidden',
        ACCENT_MAP[gradient],
      )}
      aria-label={`${title}: ${value}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 mb-3">
            <div className={cn(
              'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
              'transition-transform duration-300 group-hover:scale-110',
              ICON_BG_MAP[gradient] || ICON_BG_MAP.blue,
            )}>
              <Icon className="w-4 h-4" />
            </div>
            <p className="text-sm text-muted-foreground font-medium">{title}</p>
          </div>
          <p className="metric-value mb-1">{value}</p>
          {trend !== undefined && (
            <div className="flex items-center gap-2 mt-2">
              <span
                className={cn(
                  'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                  trendPositive && 'bg-emerald-50 text-emerald-700',
                  trendNegative && 'bg-red-50 text-red-700',
                  !trendPositive && !trendNegative && 'bg-muted text-muted-foreground',
                )}
                aria-label={`${trend > 0 ? 'Increased by' : trend < 0 ? 'Decreased by' : 'No change:'} ${Math.abs(trend)}% compared to last week`}
              >
                {trendPositive && <TrendingUp aria-hidden="true" className="w-3 h-3" />}
                {trendNegative && <TrendingDown aria-hidden="true" className="w-3 h-3" />}
                {trend > 0 ? '+' : ''}{trend}%
              </span>
              <span className="text-xs text-muted-foreground">vs last week</span>
            </div>
          )}
          {!trend && subtitle && (
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
        {trend !== undefined && (
          <div className="shrink-0 ml-3 mt-6">
            <MiniSparkline trend={trend} />
          </div>
        )}
      </div>
    </article>
  );
}
