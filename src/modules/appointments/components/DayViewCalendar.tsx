import { useMemo, useEffect, useRef } from 'react';
import { format, isToday } from 'date-fns';
import type { WeekAppointment } from '../../../services/appointments.service';
import { cn } from '../../../lib/utils';

interface Props {
  appointments: WeekAppointment[];
  date: Date;
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

export default function DayViewCalendar({ appointments, date, slotInterval, onSlotClick, onAppointmentClick }: Props) {
  const dateStr = format(date, 'yyyy-MM-dd');
  const timeSlots = useMemo(() => generateTimeSlots(slotInterval), [slotInterval]);
  const today = isToday(date);
  const nowH = new Date().getHours();
  const nowM = new Date().getMinutes();
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasScrolled = useRef(false);

  // Auto-scroll to 8 AM (or current hour if today) on mount
  useEffect(() => {
    if (hasScrolled.current || !scrollRef.current) return;
    const targetHour = today ? Math.max(nowH - 1, 0) : 8;
    const slotHeight = 44;
    const slotsPerHour = 60 / slotInterval;
    scrollRef.current.scrollTop = targetHour * slotsPerHour * slotHeight;
    hasScrolled.current = true;
  }, [today, nowH, slotInterval]);

  const appointmentsBySlot = useMemo(() => {
    const map: Record<string, WeekAppointment[]> = {};
    for (const appt of appointments) {
      if (appt.appointment_date !== dateStr || !appt.appointment_time) continue;
      const [h, m] = appt.appointment_time.split(':').map(Number);
      const slotM = Math.floor(m / slotInterval) * slotInterval;
      const key = `${String(h).padStart(2, '0')}:${String(slotM).padStart(2, '0')}`;
      if (!map[key]) map[key] = [];
      map[key].push(appt);
    }
    return map;
  }, [appointments, dateStr, slotInterval]);

  return (
    <div className="bg-card border border-border/40 rounded-xl overflow-hidden">
      <div className="max-h-[calc(100vh-140px)] overflow-y-auto scrollbar-thin">
        {timeSlots.map((slot) => {
          const cellAppts = appointmentsBySlot[slot] ?? [];
          const [slotH, slotM] = slot.split(':').map(Number);
          const isCurrent = today && slotH === nowH && nowM >= slotM && nowM < slotM + slotInterval;

          return (
            <div
              key={slot}
              className={cn(
                'grid grid-cols-[72px_1fr] min-h-[44px] border-b border-border/15 last:border-b-0 group',
                isCurrent && 'bg-primary/[0.04]'
              )}
            >
              <div className="px-2 py-1.5 text-[11px] text-muted-foreground/70 font-medium flex items-start justify-end pr-3 pt-2 border-r border-border/20 select-none">
                {formatTime12(slot)}
              </div>
              <div
                className="p-1 cursor-pointer hover:bg-muted/30 transition-colors relative"
                onClick={() => { if (cellAppts.length === 0) onSlotClick(date, slot); }}
              >
                {cellAppts.map(appt => {
                  const c = STATUS_COLORS[appt.status] ?? STATUS_COLORS.scheduled;
                  return (
                    <button
                      key={appt.id}
                      onClick={(e) => { e.stopPropagation(); onAppointmentClick(appt); }}
                      className={cn('w-full text-left px-2.5 py-1.5 rounded-md border-l-[3px] mb-0.5 transition-all hover:shadow-sm', c.bg, c.border)}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className={cn('text-[11px] font-semibold truncate', c.text)}>{appt.patient_name}</span>
                        {appt.token_number && (
                          <span className="text-[9px] font-mono text-muted-foreground/60 bg-muted/50 px-1 rounded">#{appt.token_number}</span>
                        )}
                      </div>
                      <div className="text-[10px] text-muted-foreground/60 truncate mt-0.5">
                        {appt.appointment_time?.slice(0, 5)} · {appt.doctor_name}
                      </div>
                    </button>
                  );
                })}
                {cellAppts.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <span className="text-[10px] text-muted-foreground/40">+</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
