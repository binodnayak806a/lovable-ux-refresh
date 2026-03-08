import { useMemo } from 'react';
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
  no_show:     { bg: 'bg-gray-50',    border: 'border-l-gray-400',    text: 'text-gray-600' },
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

  const today = isToday(date);
  const nowHour = new Date().getHours();
  const nowMin = new Date().getMinutes();

  return (
    <div className="glass-card overflow-hidden">
      {/* Day header */}
      <div className={cn(
        'px-6 py-4 border-b border-border/50 flex items-center gap-3',
        today && 'bg-primary/5'
      )}>
        <div className={cn(
          'w-12 h-12 rounded-xl flex flex-col items-center justify-center',
          today ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
        )}>
          <span className="text-[10px] font-bold uppercase leading-none">{format(date, 'EEE')}</span>
          <span className="text-lg font-bold leading-none mt-0.5">{format(date, 'd')}</span>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">{format(date, 'EEEE, MMMM d, yyyy')}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {appointments.filter(a => a.appointment_date === dateStr).length} appointments
          </p>
        </div>
      </div>

      {/* Time grid */}
      <div className="max-h-[calc(100vh-280px)] overflow-y-auto scrollbar-thin">
        {timeSlots.map((slot, idx) => {
          const cellAppts = appointmentsBySlot[slot] ?? [];
          const [slotH, slotM] = slot.split(':').map(Number);
          const isCurrentSlot = today && slotH === nowHour && nowMin >= slotM && nowMin < slotM + slotInterval;

          return (
            <div
              key={slot}
              className={cn(
                'grid grid-cols-[80px_1fr] min-h-[52px] border-b border-border/30 last:border-b-0 group',
                isCurrentSlot && 'bg-primary/5',
                idx % 2 === 0 && 'bg-muted/20'
              )}
            >
              <div className="px-3 py-2 text-xs font-medium text-muted-foreground flex items-start justify-end pr-4 pt-2 border-r border-border/30 select-none">
                {formatTime12(slot)}
              </div>
              <div
                className="p-1.5 cursor-pointer hover:bg-accent/30 transition-colors relative"
                onClick={() => {
                  if (cellAppts.length === 0) onSlotClick(date, slot);
                }}
              >
                {cellAppts.map(appt => {
                  const colors = STATUS_COLORS[appt.status] ?? STATUS_COLORS.scheduled;
                  return (
                    <button
                      key={appt.id}
                      onClick={(e) => { e.stopPropagation(); onAppointmentClick(appt); }}
                      className={cn(
                        'w-full text-left px-3 py-2 rounded-lg border-l-[3px] mb-1 transition-all hover:shadow-md',
                        colors.bg, colors.border
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className={cn('text-xs font-semibold truncate', colors.text)}>
                          {appt.patient_name}
                        </span>
                        {appt.token_number && (
                          <span className="text-[10px] font-mono text-muted-foreground bg-background/80 px-1.5 py-0.5 rounded">
                            #{appt.token_number}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-muted-foreground truncate mt-0.5 flex items-center gap-1.5">
                        <span>{appt.appointment_time?.slice(0, 5)}</span>
                        <span className="text-border">•</span>
                        <span className="truncate">{appt.doctor_name}</span>
                      </div>
                    </button>
                  );
                })}

                {cellAppts.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <span className="text-xs text-muted-foreground/60 font-medium">+ Add</span>
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
