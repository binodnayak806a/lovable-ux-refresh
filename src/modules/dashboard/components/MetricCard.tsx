import { TrendingUp, TrendingDown } from 'lucide-react';
import { Skeleton } from '../../../components/ui/skeleton';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: number;
  icon: React.ElementType;
  loading?: boolean;
  gradient?: string;
}

function MiniSparkline({ trend }: { trend: number }) {
  const isPositive = trend >= 0;
  const strokeColor = isPositive ? '#10b981' : '#ef4444';

  const points = isPositive
    ? 'M0,20 L10,18 L20,15 L30,12 L40,14 L50,10 L60,8'
    : 'M0,8 L10,10 L20,12 L30,15 L40,13 L50,17 L60,20';

  return (
    <svg
      width="60"
      height="28"
      viewBox="0 0 60 28"
      className="opacity-60"
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
  loading,
}: MetricCardProps) {
  const trendPositive = trend !== undefined && trend > 0;
  const trendNegative = trend !== undefined && trend < 0;

  if (loading) {
    return (
      <div
        className="bg-card border border-border rounded-xl p-5 shadow-sm"
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
      className="bg-card rounded-2xl p-6 shadow-card hover:shadow-hover transition-all duration-300"
      aria-label={`${title}: ${value}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-muted-foreground font-medium mb-4">{title}</p>
          <p className="text-3xl font-bold text-foreground tracking-tight mb-2">{value}</p>
          {trend !== undefined && (
            <div className="flex items-center gap-2 mt-3">
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                  trendPositive ? 'bg-green-50 text-green-700' : trendNegative ? 'bg-red-50 text-red-700' : 'bg-gray-50 text-gray-600'
                }`}
                aria-label={`${trend > 0 ? 'Increased by' : trend < 0 ? 'Decreased by' : 'No change:'} ${Math.abs(trend)}% compared to last week`}
              >
                {trendPositive && <TrendingUp aria-hidden="true" className="w-3 h-3" />}
                {trendNegative && <TrendingDown aria-hidden="true" className="w-3 h-3" />}
                {trend > 0 ? '+' : ''}{trend}%
              </span>
              <span className="text-xs text-gray-400">vs last week</span>
            </div>
          )}
          {!trend && subtitle && (
            <p className="text-sm text-muted-foreground mt-1.5">{subtitle}</p>
          )}
        </div>
        {trend !== undefined && (
          <div className="shrink-0 ml-3">
            <MiniSparkline trend={trend} />
          </div>
        )}
      </div>
    </article>
  );
}
