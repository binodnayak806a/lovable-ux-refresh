import { useMemo } from 'react';
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, format, isSameMonth, isToday,
} from 'date-fns';
import type { WeekAppointment } from '../../../services/appointments.service';
import { cn } from '../../../lib/utils';

interface Props {
  appointments: WeekAppointment[];
  currentDate: Date;
  onDayClick: (date: Date) => void;
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const STATUS_DOT: Record<string, string> = {
  scheduled: 'bg-blue-400',
  confirmed: 'bg-cyan-400',
  in_progress: 'bg-amber-400',
  completed: 'bg-emerald-400',
  cancelled: 'bg-red-300',
  no_show: 'bg-gray-300',
  qr_booked: 'bg-teal-400',
};

export default function MonthViewCalendar({ appointments, currentDate, onDayClick }: Props) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const calDays = eachDayOfInterval({ start: calStart, end: calEnd });

  const appointmentsByDate = useMemo(() => {
    const map: Record<string, WeekAppointment[]> = {};
    for (const appt of appointments) {
      if (!map[appt.appointment_date]) map[appt.appointment_date] = [];
      map[appt.appointment_date].push(appt);
    }
    return map;
  }, [appointments]);

  const weeks: Date[][] = [];
  for (let i = 0; i < calDays.length; i += 7) weeks.push(calDays.slice(i, i + 7));

  return (
    <div className="bg-card border border-border/40 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-7 border-b border-border/30">
        {DAY_NAMES.map(day => (
          <div key={day} className="px-2 py-2.5 text-center text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
            {day}
          </div>
        ))}
      </div>

      {/* Grid */}
      {weeks.map((week, wi) => (
        <div key={wi} className="grid grid-cols-7 border-b border-border/10 last:border-b-0">
          {week.map(day => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const dayAppts = appointmentsByDate[dateStr] ?? [];
            const inMonth = isSameMonth(day, currentDate);
            const td = isToday(day);

            return (
              <div
                key={dateStr}
                onClick={() => onDayClick(day)}
                className={cn(
                  'min-h-[88px] p-1.5 border-r border-border/10 last:border-r-0 cursor-pointer transition-colors hover:bg-muted/20',
                  !inMonth && 'opacity-30',
                  td && 'bg-primary/[0.04]'
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={cn(
                    'text-xs leading-none',
                    td ? 'w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold' :
                    inMonth ? 'text-foreground font-medium' : 'text-muted-foreground'
                  )}>
                    {format(day, 'd')}
                  </span>
                  {dayAppts.length > 0 && (
                    <span className="text-[9px] text-muted-foreground/60 font-medium">{dayAppts.length}</span>
                  )}
                </div>

                <div className="space-y-px">
                  {dayAppts.slice(0, 3).map(appt => (
                    <div key={appt.id} className="flex items-center gap-1 px-1 py-0.5 rounded text-[9px] truncate">
                      <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', STATUS_DOT[appt.status] ?? 'bg-gray-300')} />
                      <span className="truncate text-foreground/70">{appt.patient_name}</span>
                    </div>
                  ))}
                  {dayAppts.length > 3 && (
                    <div className="text-[9px] text-muted-foreground/50 px-1">+{dayAppts.length - 3} more</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
