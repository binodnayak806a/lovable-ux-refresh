import { useMemo } from 'react';
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, format, isSameMonth, isToday, isSameDay,
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
  for (let i = 0; i < calDays.length; i += 7) {
    weeks.push(calDays.slice(i, i + 7));
  }

  return (
    <div className="glass-card overflow-hidden">
      {/* Header row */}
      <div className="grid grid-cols-7 border-b border-border/50">
        {DAY_NAMES.map(day => (
          <div key={day} className="px-3 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-muted/30">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div>
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 border-b border-border/20 last:border-b-0">
            {week.map(day => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const dayAppts = appointmentsByDate[dateStr] ?? [];
              const inMonth = isSameMonth(day, currentDate);
              const today = isToday(day);

              return (
                <div
                  key={dateStr}
                  onClick={() => onDayClick(day)}
                  className={cn(
                    'min-h-[100px] p-2 border-r border-border/20 last:border-r-0 cursor-pointer transition-colors hover:bg-accent/30',
                    !inMonth && 'opacity-40 bg-muted/10',
                    today && 'bg-primary/5'
                  )}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={cn(
                      'text-sm font-medium leading-none',
                      today ? 'w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold' :
                      inMonth ? 'text-foreground' : 'text-muted-foreground'
                    )}>
                      {format(day, 'd')}
                    </span>
                    {dayAppts.length > 0 && (
                      <span className="text-[10px] font-medium text-muted-foreground bg-muted rounded-full px-1.5 py-0.5">
                        {dayAppts.length}
                      </span>
                    )}
                  </div>

                  <div className="space-y-0.5">
                    {dayAppts.slice(0, 3).map(appt => (
                      <div
                        key={appt.id}
                        className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] truncate bg-card/80 border border-border/30"
                      >
                        <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', STATUS_DOT[appt.status] ?? 'bg-gray-300')} />
                        <span className="truncate font-medium text-foreground/80">{appt.patient_name}</span>
                      </div>
                    ))}
                    {dayAppts.length > 3 && (
                      <div className="text-[10px] text-muted-foreground font-medium px-1.5">
                        +{dayAppts.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
