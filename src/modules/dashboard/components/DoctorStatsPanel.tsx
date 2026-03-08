import { Stethoscope } from 'lucide-react';
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
  { doctor_id: '6', doctor_name: 'Dr. Anjali Gupta', total: 8, waiting: 1, in_progress: 1, completed: 5, cancelled: 1 },
];

export default function DoctorStatsPanel({ doctors: rawDoctors, loading }: Props) {
  const doctors = rawDoctors.length > 0 ? rawDoctors : DEMO_DOCTORS;

  return (
    <section className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-card">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Stethoscope className="w-4 h-4 text-primary" />
          </div>
          <h2 className="text-sm font-semibold text-foreground">Doctor-wise OPD Summary</h2>
        </div>
        {!loading && (
          <span className="text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full font-medium">
            {doctors.length} active today
          </span>
        )}
      </div>

      {loading ? (
        <div className="p-5 space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="w-9 h-9 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-32 mb-1" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-6 w-12 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-5 py-3 text-left font-medium text-muted-foreground">Doctor</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Total</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground hidden sm:table-cell">Waiting</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground hidden sm:table-cell">Engaged</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Done</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground hidden md:table-cell">Cancelled</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground hidden lg:table-cell">Completion</th>
              </tr>
            </thead>
            <tbody>
              {doctors.slice(0, 6).map((doc) => {
                const initials = doc.doctor_name
                  .split(' ')
                  .slice(0, 2)
                  .map(n => n[0])
                  .join('')
                  .toUpperCase();
                const completionRate = doc.total > 0 ? Math.round((doc.completed / doc.total) * 100) : 0;

                return (
                  <tr key={doc.doctor_id} className="border-b border-border/50 hover:bg-primary/5 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                          {initials}
                        </div>
                        <span className="font-medium text-foreground truncate max-w-[160px]">{doc.doctor_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-full text-xs font-bold bg-muted text-foreground">{doc.total}</span>
                    </td>
                    <td className="px-4 py-3.5 text-center hidden sm:table-cell">
                      <span className={cn('inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-full text-xs font-semibold', doc.waiting > 0 ? 'bg-amber-50 text-amber-700' : 'text-muted-foreground')}>{doc.waiting}</span>
                    </td>
                    <td className="px-4 py-3.5 text-center hidden sm:table-cell">
                      <span className={cn('inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-full text-xs font-semibold', doc.in_progress > 0 ? 'bg-blue-50 text-blue-700' : 'text-muted-foreground')}>{doc.in_progress}</span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={cn('inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-full text-xs font-semibold', doc.completed > 0 ? 'bg-emerald-50 text-emerald-700' : 'text-muted-foreground')}>{doc.completed}</span>
                    </td>
                    <td className="px-4 py-3.5 text-center hidden md:table-cell">
                      <span className={cn('inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-full text-xs font-semibold', doc.cancelled > 0 ? 'bg-red-50 text-red-700' : 'text-muted-foreground')}>{doc.cancelled}</span>
                    </td>
                    <td className="px-4 py-3.5 hidden lg:table-cell">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-muted">
                          <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${completionRate}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground font-medium w-8 text-right">{completionRate}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
