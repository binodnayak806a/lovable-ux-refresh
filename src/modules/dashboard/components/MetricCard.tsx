import { TrendingUp, TrendingDown } from 'lucide-react';
import { Skeleton } from '../../../components/ui/skeleton';
import { cn } from '../../../lib/utils';
import { useCountUp } from '../../../hooks/useCountUp';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: number;
  icon: React.ElementType;
  loading?: boolean;
  gradient?: string;
}

const GRADIENT_MAP: Record<string, string> = {
  blue: 'metric-gradient-blue',
  amber: 'metric-gradient-amber',
  teal: 'metric-gradient-teal',
  rose: 'metric-gradient-rose',
  green: 'metric-gradient-green',
};

const ACCENT_MAP: Record<string, string> = {
  blue: 'accent-border-blue',
  amber: 'accent-border-amber',
  teal: 'accent-border-teal',
  rose: 'accent-border-rose',
  green: 'accent-border-green',
};

const ICON_BG_MAP: Record<string, string> = {
  blue: 'bg-primary/10 text-primary',
  amber: 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
  teal: 'bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400',
  rose: 'bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400',
  green: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
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

  // Extract numeric for count-up
  const numericStr = String(value).replace(/[^0-9.]/g, '');
  const numericVal = parseFloat(numericStr) || 0;
  const prefix = String(value).match(/^[^\d]*/)?.[0] ?? '';
  const suffix = String(value).replace(/^[^\d]*[\d.,]*/, '') ?? '';
  const animatedNum = useCountUp(loading ? 0 : numericVal);

  const displayValue = loading ? '0' : numericVal > 0
    ? `${prefix}${animatedNum.toLocaleString('en-IN')}${suffix}`
    : value;

  if (loading) {
    return (
      <div className={cn('rounded-2xl shadow-card border border-border/50 p-4 h-[130px]', GRADIENT_MAP[gradient])} role="status" aria-label={`Loading ${title}`}>
        <div className="space-y-3">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
    );
  }

  return (
    <article
      className={cn(
        'rounded-2xl shadow-card border border-border/50 p-4 h-[130px]',
        'hover:shadow-hover transition-all duration-300 group flex flex-col',
        GRADIENT_MAP[gradient],
        ACCENT_MAP[gradient],
      )}
      aria-label={`${title}: ${value}`}
    >
      {/* Title row with icon */}
      <div className="flex items-center gap-2 mb-2">
        <div className={cn(
          'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
          'transition-transform duration-300 group-hover:scale-110',
          ICON_BG_MAP[gradient] || ICON_BG_MAP.blue,
        )}>
          <Icon className="w-4 h-4" />
        </div>
        <p className="text-xs font-medium text-muted-foreground leading-tight">{title}</p>
      </div>

      {/* Value */}
      <p className="text-2xl font-bold tracking-tight text-foreground">{displayValue}</p>

      {/* Trend or subtitle - always same height */}
      <div className="flex items-center gap-2 mt-auto h-5">
        {trend !== undefined ? (
          <>
            <span
              className={cn(
                'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold',
                trendPositive && 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400',
                trendNegative && 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400',
                !trendPositive && !trendNegative && 'bg-muted text-muted-foreground',
              )}
            >
              {trendPositive && <TrendingUp className="w-2.5 h-2.5" />}
              {trendNegative && <TrendingDown className="w-2.5 h-2.5" />}
              {trend > 0 ? '+' : ''}{trend}%
            </span>
            <span className="text-[10px] text-muted-foreground">vs last week</span>
          </>
        ) : subtitle ? (
          <p className="text-[10px] text-muted-foreground">{subtitle}</p>
        ) : (
          <span className="text-[10px] text-muted-foreground invisible">—</span>
        )}
      </div>
    </article>
  );
}
