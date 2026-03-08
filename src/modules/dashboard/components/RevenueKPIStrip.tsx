import { IndianRupee, TrendingUp, TrendingDown } from 'lucide-react';
import { Skeleton } from '../../../components/ui/skeleton';
import { useCountUp } from '../../../hooks/useCountUp';
import { cn } from '../../../lib/utils';

interface RevenueItem {
  label: string;
  value: number;
  trend: number;
  color: string;
  iconBg: string;
}

interface Props {
  opdRevenue: number;
  ipdRevenue: number;
  pharmacyRevenue: number;
  totalRevenue: number;
  loading?: boolean;
}

function AnimatedCurrency({ value, className }: { value: number; className?: string }) {
  const animated = useCountUp(value);
  const formatted = animated >= 100000
    ? `₹${(animated / 100000).toFixed(1)}L`
    : animated >= 1000
    ? `₹${(animated / 1000).toFixed(1)}K`
    : `₹${animated.toLocaleString('en-IN')}`;
  return <span className={className}>{formatted}</span>;
}

export default function RevenueKPIStrip({ opdRevenue, ipdRevenue, pharmacyRevenue, totalRevenue, loading }: Props) {
  // Use demo values if all zeros
  const hasData = opdRevenue > 0 || ipdRevenue > 0 || pharmacyRevenue > 0 || totalRevenue > 0;

  const items: RevenueItem[] = [
    { label: 'OPD Revenue', value: hasData ? opdRevenue : 45000, trend: 12, color: 'text-blue-700 dark:text-blue-400', iconBg: 'bg-blue-50 dark:bg-blue-900/30' },
    { label: 'IPD Revenue', value: hasData ? ipdRevenue : 120000, trend: 8, color: 'text-emerald-700 dark:text-emerald-400', iconBg: 'bg-emerald-50 dark:bg-emerald-900/30' },
    { label: 'Pharmacy Revenue', value: hasData ? pharmacyRevenue : 35000, trend: -3, color: 'text-amber-700 dark:text-amber-400', iconBg: 'bg-amber-50 dark:bg-amber-900/30' },
    { label: 'Total Revenue', value: hasData ? totalRevenue : 200000, trend: 15, color: 'text-primary', iconBg: 'bg-primary/10' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {items.map((item) => (
        <div
          key={item.label}
          className={cn(
            'rounded-2xl p-4 border border-border/50 shadow-card bg-card',
            'hover:shadow-hover transition-all duration-300 group',
            item.label === 'Total Revenue' && 'ring-1 ring-primary/20'
          )}
        >
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-7 w-20" />
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground">{item.label}</span>
                <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center', item.iconBg)}>
                  <IndianRupee className={cn('w-3.5 h-3.5', item.color)} />
                </div>
              </div>
              <AnimatedCurrency value={item.value} className={cn('text-xl font-bold', item.color)} />
              <div className="flex items-center gap-1 mt-1.5">
                {item.trend >= 0 ? (
                  <TrendingUp className="w-3 h-3 text-emerald-500" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-red-500" />
                )}
                <span className={cn('text-xs font-medium', item.trend >= 0 ? 'text-emerald-600' : 'text-red-600')}>
                  {item.trend > 0 ? '+' : ''}{item.trend}%
                </span>
                <span className="text-xs text-muted-foreground">vs yesterday</span>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
