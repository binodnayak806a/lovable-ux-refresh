import { Clock, UserCheck, CheckCircle2, XCircle } from 'lucide-react';
import { Skeleton } from '../../../components/ui/skeleton';
import type { AppointmentsByStatus } from '../../../services/dashboard.service';
import { cn } from '../../../lib/utils';

interface Props {
  data: AppointmentsByStatus[];
  loading?: boolean;
}

const STATUS_CONFIG = [
  {
    key: 'waiting',
    statuses: ['scheduled', 'confirmed'],
    label: 'Waiting',
    icon: Clock,
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    textColor: 'text-amber-700',
    iconColor: 'text-amber-500',
    dotColor: 'bg-amber-400',
  },
  {
    key: 'engaged',
    statuses: ['in_progress'],
    label: 'Engaged',
    icon: UserCheck,
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-700',
    iconColor: 'text-blue-500',
    dotColor: 'bg-blue-400',
  },
  {
    key: 'done',
    statuses: ['completed'],
    label: 'Done',
    icon: CheckCircle2,
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    textColor: 'text-emerald-700',
    iconColor: 'text-emerald-500',
    dotColor: 'bg-emerald-400',
  },
  {
    key: 'cancelled',
    statuses: ['cancelled', 'no_show'],
    label: 'Cancelled',
    icon: XCircle,
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    textColor: 'text-red-700',
    iconColor: 'text-red-400',
    dotColor: 'bg-red-400',
  },
] as const;

function getCount(data: AppointmentsByStatus[], statuses: readonly string[]): number {
  return data
    .filter(d => statuses.includes(d.status))
    .reduce((sum, d) => sum + d.count, 0);
}

export default function AppointmentStatusStrip({ data, loading }: Props) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {STATUS_CONFIG.map(config => {
        const count = getCount(data, config.statuses);
        const Icon = config.icon;

        if (loading) {
          return (
            <div key={config.key} className="bg-card border border-border rounded-xl p-4">
              <Skeleton className="h-8 w-12 mb-2" />
              <Skeleton className="h-4 w-16" />
            </div>
          );
        }

        return (
          <div
            key={config.key}
            className={cn(
              'rounded-xl p-4 border transition-all duration-200 hover:shadow-sm cursor-default',
              config.bgColor, config.borderColor
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <span className={cn('text-2xl font-bold', config.textColor)}>
                {count}
              </span>
              <Icon className={cn('w-5 h-5', config.iconColor)} />
            </div>
            <div className="flex items-center gap-1.5">
              <span className={cn('w-1.5 h-1.5 rounded-full', config.dotColor)} />
              <span className={cn('text-xs font-medium', config.textColor)}>
                {config.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
