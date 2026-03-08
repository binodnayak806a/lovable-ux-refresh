import { Clock, UserCheck, CheckCircle2, XCircle } from 'lucide-react';
import { Skeleton } from '../../../components/ui/skeleton';
import type { AppointmentsByStatus } from '../../../services/dashboard.service';
import { cn } from '../../../lib/utils';
import { useCountUp } from '../../../hooks/useCountUp';

interface Props {
  data: AppointmentsByStatus[];
  loading?: boolean;
}

const DEMO_DATA: AppointmentsByStatus[] = [
  { status: 'scheduled', count: 32 },
  { status: 'in_progress', count: 8 },
  { status: 'completed', count: 45 },
  { status: 'cancelled', count: 5 },
];

const STATUS_CONFIG = [
  {
    key: 'waiting',
    statuses: ['scheduled', 'confirmed'],
    label: 'Waiting',
    icon: Clock,
    bgColor: 'bg-amber-50 dark:bg-amber-900/30',
    borderColor: 'border-amber-200/60 dark:border-amber-700/40',
    textColor: 'text-amber-700 dark:text-amber-400',
    iconColor: 'text-amber-500 dark:text-amber-400',
    dotColor: 'bg-amber-400',
    progressColor: 'bg-amber-400',
  },
  {
    key: 'engaged',
    statuses: ['in_progress'],
    label: 'Engaged',
    icon: UserCheck,
    bgColor: 'bg-blue-50 dark:bg-blue-900/30',
    borderColor: 'border-blue-200/60 dark:border-blue-700/40',
    textColor: 'text-blue-700 dark:text-blue-400',
    iconColor: 'text-blue-500 dark:text-blue-400',
    dotColor: 'bg-blue-400',
    progressColor: 'bg-blue-400',
  },
  {
    key: 'done',
    statuses: ['completed'],
    label: 'Done',
    icon: CheckCircle2,
    bgColor: 'bg-emerald-50 dark:bg-emerald-900/30',
    borderColor: 'border-emerald-200/60 dark:border-emerald-700/40',
    textColor: 'text-emerald-700 dark:text-emerald-400',
    iconColor: 'text-emerald-500 dark:text-emerald-400',
    dotColor: 'bg-emerald-400',
    progressColor: 'bg-emerald-400',
  },
  {
    key: 'cancelled',
    statuses: ['cancelled', 'no_show'],
    label: 'Cancelled',
    icon: XCircle,
    bgColor: 'bg-red-50 dark:bg-red-900/30',
    borderColor: 'border-red-200/60 dark:border-red-700/40',
    textColor: 'text-red-700 dark:text-red-400',
    iconColor: 'text-red-400',
    dotColor: 'bg-red-400',
    progressColor: 'bg-red-400',
  },
] as const;

function getCount(data: AppointmentsByStatus[], statuses: readonly string[]): number {
  return data
    .filter(d => statuses.includes(d.status))
    .reduce((sum, d) => sum + d.count, 0);
}

function AnimatedCount({ value, className }: { value: number; className: string }) {
  const animated = useCountUp(value);
  return <span className={className}>{animated}</span>;
}

export default function AppointmentStatusStrip({ data: rawData, loading }: Props) {
  const hasData = rawData.some(d => d.count > 0);
  const data = hasData ? rawData : DEMO_DATA;
  const total = data.reduce((sum, d) => sum + d.count, 0) || 1;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {STATUS_CONFIG.map(config => {
        const count = getCount(data, config.statuses);
        const Icon = config.icon;
        const pct = Math.round((count / total) * 100);

        if (loading) {
          return (
            <div key={config.key} className="bg-card border border-border/50 rounded-2xl p-4">
              <Skeleton className="h-8 w-12 mb-2" />
              <Skeleton className="h-4 w-16" />
            </div>
          );
        }

        return (
          <div
            key={config.key}
            className={cn(
              'rounded-2xl p-4 border transition-all duration-300 hover:shadow-sm hover:scale-[1.01] cursor-default',
              config.bgColor, config.borderColor
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <AnimatedCount value={count} className={cn('text-2xl font-bold', config.textColor)} />
              <Icon className={cn('w-5 h-5', config.iconColor)} />
            </div>
            <div className="flex items-center gap-1.5 mb-2">
              <span className={cn('w-1.5 h-1.5 rounded-full', config.dotColor)} />
              <span className={cn('text-xs font-medium', config.textColor)}>
                {config.label}
              </span>
            </div>
            <div className="w-full h-1 rounded-full bg-black/5">
              <div
                className={cn('h-full rounded-full transition-all duration-700', config.progressColor)}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
