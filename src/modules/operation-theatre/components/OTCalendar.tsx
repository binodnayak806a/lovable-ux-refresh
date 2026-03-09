import { useMemo } from 'react';
import { format, isSameDay, parseISO, startOfWeek, addDays } from 'date-fns';
import { Clock, User, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { SurgeryBooking, SurgeryPriority } from '../types';

const HOURS = Array.from({ length: 12 }, (_, i) => i + 7); // 7 AM – 6 PM

const PRIORITY_STYLES: Record<SurgeryPriority, string> = {
  elective: 'bg-blue-100 border-blue-300 text-blue-800 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-300',
  urgent: 'bg-amber-100 border-amber-300 text-amber-800 dark:bg-amber-900/30 dark:border-amber-700 dark:text-amber-300',
  emergency: 'bg-red-100 border-red-300 text-red-800 dark:bg-red-900/30 dark:border-red-700 dark:text-red-300',
};

interface Props {
  bookings: SurgeryBooking[];
  selectedDate: Date;
  onSelectBooking: (b: SurgeryBooking) => void;
}

export default function OTCalendar({ bookings, selectedDate, onSelectBooking }: Props) {
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

  const getBookingsForDay = (day: Date) =>
    bookings.filter((b) => isSameDay(parseISO(b.surgery_date), day));

  return (
    <div className="overflow-auto border border-border rounded-xl bg-card">
      {/* Header */}
      <div className="grid grid-cols-[80px_repeat(7,1fr)] border-b border-border sticky top-0 bg-card z-10">
        <div className="p-2 text-xs font-medium text-muted-foreground border-r border-border" />
        {weekDays.map((day) => (
          <div
            key={day.toISOString()}
            className={cn(
              'p-2 text-center border-r border-border last:border-r-0',
              isSameDay(day, new Date()) && 'bg-primary/5'
            )}
          >
            <div className="text-xs font-medium text-muted-foreground">{format(day, 'EEE')}</div>
            <div className={cn(
              'text-sm font-semibold',
              isSameDay(day, new Date()) ? 'text-primary' : 'text-foreground'
            )}>
              {format(day, 'd MMM')}
            </div>
          </div>
        ))}
      </div>

      {/* Time grid */}
      {HOURS.map((hour) => (
        <div key={hour} className="grid grid-cols-[80px_repeat(7,1fr)] border-b border-border last:border-b-0">
          <div className="p-2 text-xs text-muted-foreground border-r border-border text-right pr-3">
            {format(new Date(2000, 0, 1, hour), 'h a')}
          </div>
          {weekDays.map((day) => {
            const dayBookings = getBookingsForDay(day).filter((b) => {
              const startHour = parseInt(b.start_time.split(':')[0], 10);
              return startHour === hour;
            });
            return (
              <div
                key={day.toISOString()}
                className="p-1 border-r border-border last:border-r-0 min-h-[56px]"
              >
                {dayBookings.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => onSelectBooking(b)}
                    className={cn(
                      'w-full text-left rounded-md border px-2 py-1 mb-1 text-xs cursor-pointer transition-shadow hover:shadow-md',
                      PRIORITY_STYLES[b.priority]
                    )}
                  >
                    <div className="font-semibold truncate">{b.surgery_name}</div>
                    <div className="flex items-center gap-1 opacity-80">
                      <User className="h-3 w-3" />
                      <span className="truncate">{b.patient_name}</span>
                    </div>
                    <div className="flex items-center gap-1 opacity-70">
                      <Clock className="h-3 w-3" />
                      {b.start_time}–{b.end_time}
                    </div>
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
