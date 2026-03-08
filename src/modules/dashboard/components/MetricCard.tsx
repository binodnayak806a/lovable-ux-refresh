import { TrendingUp, TrendingDown, ChevronRight } from 'lucide-react';
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
  compact?: boolean;
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
  const fillColor = isPositive
    ? 'hsl(142, 76%, 36%, 0.08)'
    : 'hsl(0, 84%, 60%, 0.08)';

  const points = isPositive
    ? 'M0,20 L10,18 L20,15 L30,12 L40,14 L50,10 L60,8'
    : 'M0,8 L10,10 L20,12 L30,15 L40,13 L50,17 L60,20';

  const areaPoints = isPositive
    ? 'M0,20 L10,18 L20,15 L30,12 L40,14 L50,10 L60,8 L60,28 L0,28 Z'
    : 'M0,8 L10,10 L20,12 L30,15 L40,13 L50,17 L60,20 L60,28 L0,28 Z';

  return (
    <svg width="60" height="28" viewBox="0 0 60 28" className="opacity-60" aria-hidden="true">
      <path d={areaPoints} fill={fillColor} />
      <path d={points} fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
  compact = false,
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
      <div className={cn('rounded-2xl shadow-card border border-border/50', compact ? 'p-4' : 'p-6', GRADIENT_MAP[gradient])} role="status" aria-label={`Loading ${title}`}>
        <div className="space-y-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className={compact ? 'h-7 w-16' : 'h-9 w-20'} />
          <Skeleton className="h-3 w-28" />
        </div>
      </div>
    );
  }

  return (
    <article
      className={cn(
        'rounded-2xl shadow-card border border-border/50',
        compact ? 'p-4' : 'p-6',
        'hover:shadow-hover transition-all duration-300 group overflow-hidden relative',
        GRADIENT_MAP[gradient],
        ACCENT_MAP[gradient],
      )}
      aria-label={`${title}: ${value}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className={cn('flex items-center gap-2', compact ? 'mb-2' : 'mb-3')}>
            <div className={cn(
              'rounded-xl flex items-center justify-center shrink-0',
              'transition-all duration-300 group-hover:scale-110 group-hover:shadow-sm',
              compact ? 'w-8 h-8' : 'w-10 h-10',
              ICON_BG_MAP[gradient] || ICON_BG_MAP.blue,
            )}>
              <Icon className={compact ? 'w-4 h-4' : 'w-5 h-5'} />
            </div>
            <p className={cn('text-muted-foreground font-medium', compact ? 'text-xs' : 'text-sm')}>{title}</p>
          </div>
          <p className={cn('font-bold tracking-tight text-foreground mb-1', compact ? 'text-2xl' : 'text-3xl')}>{displayValue}</p>
          {trend !== undefined && (
            <div className="flex items-center gap-2 mt-2">
              <span
                className={cn(
                  'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold',
                  trendPositive && 'bg-emerald-100/80 text-emerald-700',
                  trendNegative && 'bg-red-100/80 text-red-700',
                  !trendPositive && !trendNegative && 'bg-muted text-muted-foreground',
                )}
              >
                {trendPositive && <TrendingUp className="w-3 h-3" />}
                {trendNegative && <TrendingDown className="w-3 h-3" />}
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

      {/* Hover reveal link */}
      <div className="absolute bottom-0 left-0 right-0 py-2 px-6 bg-gradient-to-t from-card/90 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-300">
        <span className="text-xs font-medium text-primary flex items-center gap-1">
          View Details <ChevronRight className="w-3 h-3" />
        </span>
      </div>
    </article>
  );
}
