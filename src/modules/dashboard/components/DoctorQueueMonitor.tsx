import { Users, Clock } from 'lucide-react';
import { Skeleton } from '../../../components/ui/skeleton';
import type { DoctorStat } from '../../../services/dashboard.service';
import { cn } from '../../../lib/utils';

interface Props {
  doctors: DoctorStat[];
  loading?: boolean;
}

const DEMO_DOCTORS: DoctorStat[] = [
  { doctor_id: '1', doctor_name: 'Dr. Amit Shah', total: 22, waiting: 7, in_progress: 2, completed: 12, cancelled: 1 },
  { doctor_id: '2', doctor_name: 'Dr. Rajesh Mehta', total: 18, waiting: 5, in_progress: 1, completed: 11, cancelled: 1 },
  { doctor_id: '3', doctor_name: 'Dr. Priya Patel', total: 14, waiting: 3, in_progress: 1, completed: 9, cancelled: 1 },
  { doctor_id: '4', doctor_name: 'Dr. Vikram Sharma', total: 16, waiting: 4, in_progress: 2, completed: 9, cancelled: 1 },
  { doctor_id: '5', doctor_name: 'Dr. Neha Desai', total: 10, waiting: 2, in_progress: 1, completed: 6, cancelled: 1 },
];

export default function DoctorQueueMonitor({ doctors: rawDoctors, loading }: Props) {
  const doctors = rawDoctors.length > 0 ? rawDoctors : DEMO_DOCTORS;
  const sortedDoctors = [...doctors].sort((a, b) => b.waiting - a.waiting);

  return (
    <section className="bg-card border border-border/50 rounded-2xl overflow-hidden h-full shadow-card">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
            <Users className="w-4 h-4 text-amber-600" />
          </div>
          <h2 className="text-sm font-semibold text-foreground">Doctor Queue</h2>
        </div>
        <span className="text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full font-medium flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          Live
        </span>
      </div>

      <div className="px-5 py-3">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="w-8 h-8 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-3.5 w-28 mb-1" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {sortedDoctors.slice(0, 6).map((doc) => {
              const initials = doc.doctor_name
                .split(' ')
                .slice(0, 2)
                .map((n) => n[0])
                .join('')
                .toUpperCase();
              const queueLevel = doc.waiting >= 7 ? 'high' : doc.waiting >= 4 ? 'medium' : 'low';

              return (
                <div key={doc.doctor_id} className="flex items-center gap-3 py-2 px-2 rounded-xl hover:bg-muted/30 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{doc.doctor_name}</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>{doc.completed} done · {doc.total} total</span>
                    </div>
                  </div>
                  <div className={cn(
                    'px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1',
                    queueLevel === 'high' && 'bg-red-50 text-red-700',
                    queueLevel === 'medium' && 'bg-amber-50 text-amber-700',
                    queueLevel === 'low' && 'bg-emerald-50 text-emerald-700',
                  )}>
                    <span className={cn(
                      'w-1.5 h-1.5 rounded-full',
                      queueLevel === 'high' && 'bg-red-500 animate-pulse',
                      queueLevel === 'medium' && 'bg-amber-500',
                      queueLevel === 'low' && 'bg-emerald-500',
                    )} />
                    {doc.waiting} waiting
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
