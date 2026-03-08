import { Stethoscope, Users } from 'lucide-react';
import { Skeleton } from '../../../components/ui/skeleton';
import type { DoctorStat } from '../../../services/dashboard.service';
import { cn } from '../../../lib/utils';

interface Props {
  doctors: DoctorStat[];
  loading?: boolean;
}

export default function DoctorStatsPanel({ doctors, loading }: Props) {
  return (
    <section className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Stethoscope className="w-4 h-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">
            Doctor-wise OPD Summary
          </h2>
        </div>
        {!loading && doctors.length > 0 && (
          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md">
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
      ) : doctors.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
            <Users className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">No doctor activity today</p>
          <p className="text-xs text-muted-foreground mt-1">Stats will appear when appointments are scheduled</p>
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

                return (
                  <tr
                    key={doc.doctor_id}
                    className="border-b border-border/50 hover:bg-muted/50 transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                          {initials}
                        </div>
                        <span className="font-medium text-foreground truncate max-w-[160px]">
                          {doc.doctor_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-full text-xs font-bold bg-muted text-foreground">
                        {doc.total}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center hidden sm:table-cell">
                      <span className={cn(
                        'inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-full text-xs font-semibold',
                        doc.waiting > 0 ? 'bg-amber-50 text-amber-700' : 'text-muted-foreground'
                      )}>
                        {doc.waiting}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center hidden sm:table-cell">
                      <span className={cn(
                        'inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-full text-xs font-semibold',
                        doc.in_progress > 0 ? 'bg-blue-50 text-blue-700' : 'text-muted-foreground'
                      )}>
                        {doc.in_progress}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={cn(
                        'inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-full text-xs font-semibold',
                        doc.completed > 0 ? 'bg-emerald-50 text-emerald-700' : 'text-muted-foreground'
                      )}>
                        {doc.completed}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center hidden md:table-cell">
                      <span className={cn(
                        'inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-full text-xs font-semibold',
                        doc.cancelled > 0 ? 'bg-red-50 text-red-700' : 'text-muted-foreground'
                      )}>
                        {doc.cancelled}
                      </span>
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
