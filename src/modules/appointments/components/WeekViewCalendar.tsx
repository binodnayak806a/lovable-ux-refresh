import { useMemo } from 'react';
import { format, isToday } from 'date-fns';
import type { WeekAppointment } from '../../../services/appointments.service';
import { cn } from '../../../lib/utils';

interface Props {
  appointments: WeekAppointment[];
  weekDays: Date[];
  slotInterval: number;
  onSlotClick: (date: Date, time: string) => void;
  onAppointmentClick: (appointment: WeekAppointment) => void;
}

const STATUS_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  scheduled:   { bg: 'bg-blue-50',    border: 'border-l-blue-500',    text: 'text-blue-700' },
  confirmed:   { bg: 'bg-cyan-50',    border: 'border-l-cyan-500',    text: 'text-cyan-700' },
  in_progress: { bg: 'bg-amber-50',   border: 'border-l-amber-500',   text: 'text-amber-700' },
  completed:   { bg: 'bg-emerald-50', border: 'border-l-emerald-500', text: 'text-emerald-700' },
  cancelled:   { bg: 'bg-red-50',     border: 'border-l-red-400',     text: 'text-red-600' },
  no_show:     { bg: 'bg-gray-100',   border: 'border-l-gray-400',    text: 'text-gray-500' },
  qr_booked:   { bg: 'bg-teal-50',    border: 'border-l-teal-500',    text: 'text-teal-700' },
};

function generateTimeSlots(interval: number): string[] {
  const slots: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += interval) {
      slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }
  }
  return slots;
}

function formatTime12(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;
}

export default function WeekViewCalendar({ appointments, weekDays, slotInterval, onSlotClick, onAppointmentClick }: Props) {
  const timeSlots = useMemo(() => generateTimeSlots(slotInterval), [slotInterval]);
  const nowH = new Date().getHours();
  const nowM = new Date().getMinutes();

  const appointmentsByDaySlot = useMemo(() => {
    const map: Record<string, WeekAppointment[]> = {};
    for (const appt of appointments) {
      if (!appt.appointment_time) continue;
      const [h, m] = appt.appointment_time.split(':').map(Number);
      const slotM = Math.floor(m / slotInterval) * slotInterval;
      const key = `${appt.appointment_date}-${String(h).padStart(2, '0')}:${String(slotM).padStart(2, '0')}`;
      if (!map[key]) map[key] = [];
      map[key].push(appt);
    }
    return map;
  }, [appointments, slotInterval]);

  return (
    <div className="bg-card border border-border/40 rounded-xl overflow-hidden">
      {/* Day headers */}
      <div className="grid grid-cols-[64px_repeat(7,1fr)] border-b border-border/40 sticky top-0 z-10 bg-card">
        <div className="border-r border-border/20" />
        {weekDays.map(day => {
          const td = isToday(day);
          return (
            <div key={day.toISOString()} className={cn('py-2.5 text-center border-r border-border/10 last:border-r-0', td && 'bg-primary/[0.04]')}>
              <div className="text-[10px] font-medium text-muted-foreground/70 uppercase tracking-wider">{format(day, 'EEE')}</div>
              <div className={cn(
                'text-sm font-bold mt-0.5 leading-none',
                td ? 'w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto text-xs' : 'text-foreground'
              )}>
                {format(day, 'd')}
              </div>
              <div className="text-[9px] text-muted-foreground/50 mt-0.5">{format(day, 'MMM')}</div>
            </div>
          );
        })}
      </div>

      {/* Time grid */}
      <div className="max-h-[calc(100vh-140px)] overflow-y-auto scrollbar-thin">
        {timeSlots.map((slot) => {
          const [slotH, slotM] = slot.split(':').map(Number);
          return (
            <div key={slot} className="grid grid-cols-[64px_repeat(7,1fr)] border-b border-border/10 last:border-b-0 min-h-[44px]">
              <div className="px-1 py-1 text-[10px] text-muted-foreground/60 font-medium border-r border-border/15 flex items-start justify-end pr-2 pt-1 select-none">
                {formatTime12(slot)}
              </div>
              {weekDays.map(day => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const key = `${dateStr}-${slot}`;
                const cellAppts = appointmentsByDaySlot[key] ?? [];
                const td = isToday(day);
                const isCurrent = td && slotH === nowH && nowM >= slotM && nowM < slotM + slotInterval;

                return (
                  <div
                    key={day.toISOString() + slot}
                    className={cn(
                      'border-r border-border/10 last:border-r-0 p-0.5 cursor-pointer hover:bg-muted/20 transition-colors relative group min-h-[44px]',
                      td && 'bg-primary/[0.015]',
                      isCurrent && 'bg-primary/[0.05]'
                    )}
                    onClick={() => { if (cellAppts.length === 0) onSlotClick(day, slot); }}
                  >
                    {cellAppts.map(appt => {
                      const c = STATUS_COLORS[appt.status] ?? STATUS_COLORS.scheduled;
                      return (
                        <button
                          key={appt.id}
                          onClick={(e) => { e.stopPropagation(); onAppointmentClick(appt); }}
                          className={cn('w-full text-left px-1.5 py-1 rounded border-l-[2px] mb-0.5 transition-all hover:shadow-sm', c.bg, c.border)}
                        >
                          <div className={cn('text-[10px] font-semibold truncate leading-tight', c.text)}>{appt.patient_name}</div>
                          <div className="text-[9px] text-muted-foreground/50 truncate leading-tight">{appt.appointment_time?.slice(0, 5)}</div>
                        </button>
                      );
                    })}
                    {cellAppts.length === 0 && (
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        <span className="text-[9px] text-muted-foreground/30">+</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
