import { useMemo } from 'react';
import { format, isSameDay, isToday } from 'date-fns';
import type { WeekAppointment } from '../../../services/appointments.service';
import { cn } from '../../../lib/utils';

interface Props {
  appointments: WeekAppointment[];
  weekDays: Date[];
  onSlotClick: (date: Date, time: string) => void;
  onAppointmentClick: (appointment: WeekAppointment) => void;
}

const HOURS = Array.from({ length: 14 }, (_, i) => i + 7);

const STATUS_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  scheduled:   { bg: 'bg-blue-50',    border: 'border-l-blue-500',    text: 'text-blue-700' },
  confirmed:   { bg: 'bg-cyan-50',    border: 'border-l-cyan-500',    text: 'text-cyan-700' },
  in_progress: { bg: 'bg-amber-50',   border: 'border-l-amber-500',   text: 'text-amber-700' },
  completed:   { bg: 'bg-emerald-50', border: 'border-l-emerald-500', text: 'text-emerald-700' },
  cancelled:   { bg: 'bg-red-50',     border: 'border-l-red-400',     text: 'text-red-600' },
  no_show:     { bg: 'bg-gray-50',    border: 'border-l-gray-400',    text: 'text-gray-600' },
  qr_booked:  { bg: 'bg-teal-50',    border: 'border-l-teal-500',    text: 'text-teal-700' },
};

function formatHour(h: number): string {
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12} ${ampm}`;
}

export default function WeekViewCalendar({ appointments, weekDays, onSlotClick, onAppointmentClick }: Props) {
  const appointmentsByDayHour = useMemo(() => {
    const map: Record<string, WeekAppointment[]> = {};
    for (const appt of appointments) {
      if (!appt.appointment_time) continue;
      const hour = parseInt(appt.appointment_time.split(':')[0], 10);
      const key = `${appt.appointment_date}-${hour}`;
      if (!map[key]) map[key] = [];
      map[key].push(appt);
    }
    return map;
  }, [appointments]);

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="grid grid-cols-[64px_repeat(7,1fr)] border-b border-gray-200">
        <div className="bg-gray-50 border-r border-gray-200" />
        {weekDays.map(day => (
          <div
            key={day.toISOString()}
            className={cn(
              'px-2 py-3 text-center border-r border-gray-100 last:border-r-0',
              isToday(day) ? 'bg-blue-50' : 'bg-gray-50'
            )}
          >
            <div className="text-xs font-medium text-gray-500 uppercase">
              {format(day, 'EEE')}
            </div>
            <div className={cn(
              'text-lg font-bold mt-0.5',
              isToday(day) ? 'text-blue-600' : 'text-gray-900'
            )}>
              {format(day, 'd')}
            </div>
            {isToday(day) && (
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mx-auto mt-1" />
            )}
          </div>
        ))}
      </div>

      <div className="max-h-[600px] overflow-y-auto">
        {HOURS.map(hour => (
          <div key={hour} className="grid grid-cols-[64px_repeat(7,1fr)] border-b border-gray-100 last:border-b-0 min-h-[72px]">
            <div className="px-2 py-2 text-xs text-gray-400 font-medium border-r border-gray-200 bg-gray-50/50 flex items-start justify-end pr-3 pt-1">
              {formatHour(hour)}
            </div>
            {weekDays.map(day => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const key = `${dateStr}-${hour}`;
              const cellAppts = appointmentsByDayHour[key] ?? [];

              return (
                <div
                  key={day.toISOString() + hour}
                  className={cn(
                    'border-r border-gray-100 last:border-r-0 p-1 cursor-pointer hover:bg-gray-50/50 transition-colors relative group min-h-[72px]',
                    isToday(day) && 'bg-blue-50/30',
                    isSameDay(day, new Date()) && hour === new Date().getHours() && 'bg-blue-50/50'
                  )}
                  onClick={() => {
                    if (cellAppts.length === 0) {
                      onSlotClick(day, `${String(hour).padStart(2, '0')}:00`);
                    }
                  }}
                >
                  {cellAppts.map(appt => {
                    const colors = STATUS_COLORS[appt.status] ?? STATUS_COLORS.scheduled;
                    return (
                      <button
                        key={appt.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onAppointmentClick(appt);
                        }}
                        className={cn(
                          'w-full text-left px-2 py-1.5 rounded-md border-l-[3px] mb-1 transition-all hover:shadow-sm',
                          colors.bg, colors.border
                        )}
                      >
                        <div className={cn('text-xs font-semibold truncate', colors.text)}>
                          {appt.patient_name}
                        </div>
                        <div className="text-[10px] text-gray-500 truncate flex items-center gap-1">
                          {appt.appointment_time?.slice(0, 5)} {appt.type === 'follow_up' ? 'FU' : ''}
                          {appt.status === 'qr_booked' && (
                            <span className="inline-flex items-center px-1 py-0.5 rounded text-[8px] font-bold bg-teal-100 text-teal-700 leading-none">QR</span>
                          )}
                        </div>
                      </button>
                    );
                  })}

                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    {cellAppts.length === 0 && (
                      <span className="text-xs text-gray-400 font-medium">+</span>
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
