import { Clock, UserCheck, CheckCircle2, Play, XCircle } from 'lucide-react';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import type { WeekAppointment } from '../../../services/appointments.service';
import { cn } from '../../../lib/utils';

interface Props {
  appointments: WeekAppointment[];
  onStatusChange: (id: string, status: string) => void;
}

const STATUS_ORDER: Record<string, number> = {
  in_progress: 0,
  qr_booked: 1,
  scheduled: 2,
  confirmed: 3,
  completed: 4,
  cancelled: 5,
  no_show: 6,
};

export default function PatientQueueSidebar({ appointments, onStatusChange }: Props) {
  const todayStr = new Date().toISOString().split('T')[0];
  const todayAppts = appointments
    .filter(a => a.appointment_date === todayStr)
    .sort((a, b) => {
      const orderDiff = (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9);
      if (orderDiff !== 0) return orderDiff;
      return (a.appointment_time ?? '').localeCompare(b.appointment_time ?? '');
    });

  const waiting = todayAppts.filter(a => a.status === 'scheduled' || a.status === 'confirmed').length;
  const engaged = todayAppts.filter(a => a.status === 'in_progress').length;
  const done = todayAppts.filter(a => a.status === 'completed').length;

  return (
    <div className="bg-white border border-gray-200 rounded-xl h-full flex flex-col">
      <div className="px-4 py-3 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-400" />
          Patient Queue
        </h3>
        <div className="flex items-center gap-3 mt-2">
          <span className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full font-medium">
            {waiting} waiting
          </span>
          <span className="text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full font-medium">
            {engaged} engaged
          </span>
          <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-medium">
            {done} done
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {todayAppts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Clock className="w-8 h-8 text-gray-300 mb-2" />
            <p className="text-sm text-gray-500">No appointments today</p>
          </div>
        ) : (
          todayAppts.map(appt => {
            const initials = appt.patient_name
              ?.split(' ')
              .slice(0, 2)
              .map(n => n[0])
              .join('')
              .toUpperCase() || '?';

            const isWaiting = appt.status === 'scheduled' || appt.status === 'confirmed' || appt.status === 'qr_booked';
            const isEngaged = appt.status === 'in_progress';
            const isDone = appt.status === 'completed';
            const isCancelled = appt.status === 'cancelled' || appt.status === 'no_show';

            return (
              <div
                key={appt.id}
                className={cn(
                  'flex items-center gap-2.5 p-2.5 rounded-lg transition-all',
                  isEngaged && 'bg-blue-50 border border-blue-100',
                  isDone && 'opacity-60',
                  isCancelled && 'opacity-40',
                  !isEngaged && !isDone && !isCancelled && 'hover:bg-gray-50'
                )}
              >
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                  isEngaged ? 'bg-blue-600 text-white' :
                  isDone ? 'bg-emerald-100 text-emerald-700' :
                  'bg-gray-100 text-gray-700'
                )}>
                  {initials}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium text-gray-900 truncate">
                      {appt.patient_name}
                    </span>
                    {appt.token_number && (
                      <Badge variant="outline" className="text-[10px] px-1 py-0 border-gray-200 text-gray-500">
                        #{appt.token_number}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
                    <span>{appt.appointment_time?.slice(0, 5)}</span>
                    <span className="text-gray-300">|</span>
                    <span className="truncate">{appt.doctor_name}</span>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-1">
                  {isWaiting && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onStatusChange(appt.id, 'in_progress')}
                      className="h-7 w-7 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      title="Start consultation"
                    >
                      <Play className="w-3.5 h-3.5" />
                    </Button>
                  )}
                  {isEngaged && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onStatusChange(appt.id, 'completed')}
                      className="h-7 w-7 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                      title="Mark done"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                  {isWaiting && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onStatusChange(appt.id, 'cancelled')}
                      className="h-7 w-7 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50"
                      title="Cancel"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                    </Button>
                  )}
                  {isDone && (
                    <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
