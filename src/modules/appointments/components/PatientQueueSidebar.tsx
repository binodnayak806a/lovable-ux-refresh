import { useState } from 'react';
import { Clock, UserCheck, CheckCircle2, Play, XCircle, Search, X } from 'lucide-react';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import type { WeekAppointment } from '../../../services/appointments.service';
import { cn } from '../../../lib/utils';

interface Props {
  appointments: WeekAppointment[];
  onStatusChange: (id: string, status: string) => void;
}

const STATUS_ORDER: Record<string, number> = {
  in_progress: 0, qr_booked: 1, scheduled: 2, confirmed: 3, completed: 4, cancelled: 5, no_show: 6,
};

export default function PatientQueueSidebar({ appointments, onStatusChange }: Props) {
  const [search, setSearch] = useState('');
  const todayStr = new Date().toISOString().split('T')[0];

  const todayAppts = appointments
    .filter(a => a.appointment_date === todayStr)
    .sort((a, b) => {
      const d = (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9);
      return d !== 0 ? d : (a.appointment_time ?? '').localeCompare(b.appointment_time ?? '');
    });

  const filtered = search.trim()
    ? todayAppts.filter(a =>
        a.patient_name?.toLowerCase().includes(search.toLowerCase()) ||
        a.doctor_name?.toLowerCase().includes(search.toLowerCase()) ||
        String(a.token_number).includes(search)
      )
    : todayAppts;

  const waiting = todayAppts.filter(a => ['scheduled', 'confirmed', 'qr_booked'].includes(a.status)).length;
  const engaged = todayAppts.filter(a => a.status === 'in_progress').length;
  const done = todayAppts.filter(a => a.status === 'completed').length;

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Status counters */}
      <div className="px-3 pt-3 pb-2 border-b border-border/30">
        <div className="grid grid-cols-4 gap-1.5 mb-2.5">
          {[
            { label: 'Today', count: todayAppts.length, cls: 'bg-primary text-primary-foreground' },
            { label: 'Waiting', count: waiting, cls: 'bg-warning text-warning-foreground' },
            { label: 'Engaged', count: engaged, cls: 'bg-info text-info-foreground' },
            { label: 'Done', count: done, cls: 'bg-success text-success-foreground' },
          ].map(item => (
            <div key={item.label} className="text-center">
              <div className="text-[9px] font-medium text-muted-foreground/70 mb-0.5">{item.label}</div>
              <div className={cn('text-[11px] font-bold rounded-full py-0.5 mx-auto w-8', item.cls)}>{item.count}</div>
            </div>
          ))}
        </div>

        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground/50" />
          <Input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search..."
            className="pl-7 pr-7 h-7 text-[11px] bg-muted/30 border-border/30 rounded-lg"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5 scrollbar-thin">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Clock className="w-7 h-7 text-muted-foreground/25 mb-2" />
            <p className="text-xs text-muted-foreground/60">No appointments</p>
          </div>
        ) : (
          filtered.map(appt => {
            const initials = appt.patient_name?.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase() || '?';
            const isWaiting = ['scheduled', 'confirmed', 'qr_booked'].includes(appt.status);
            const isEngaged = appt.status === 'in_progress';
            const isDone = appt.status === 'completed';
            const isCancelled = appt.status === 'cancelled' || appt.status === 'no_show';

            return (
              <div key={appt.id} className={cn(
                'flex items-center gap-2 px-2 py-2 rounded-lg transition-all',
                isEngaged && 'bg-info/8 border border-info/15',
                isDone && 'opacity-45',
                isCancelled && 'opacity-25',
                !isEngaged && !isDone && !isCancelled && 'hover:bg-muted/40'
              )}>
                <div className={cn(
                  'w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0',
                  isEngaged ? 'bg-primary text-primary-foreground' :
                  isDone ? 'bg-success/10 text-success' :
                  'bg-muted/60 text-muted-foreground'
                )}>
                  {initials}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] font-semibold text-foreground truncate">{appt.patient_name}</span>
                    {appt.token_number && (
                      <span className="text-[8px] font-mono text-muted-foreground/50 bg-muted/40 px-1 rounded">#{appt.token_number}</span>
                    )}
                  </div>
                  <div className="text-[9px] text-muted-foreground/60 truncate">
                    {appt.appointment_time?.slice(0, 5)} · {appt.doctor_name}
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-px">
                  {isWaiting && (
                    <>
                      <Button size="sm" variant="ghost" onClick={() => onStatusChange(appt.id, 'in_progress')}
                        className="h-6 w-6 p-0 text-info hover:text-info hover:bg-info/10 rounded-md" title="Start">
                        <Play className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => onStatusChange(appt.id, 'cancelled')}
                        className="h-6 w-6 p-0 text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 rounded-md" title="Cancel">
                        <XCircle className="w-3 h-3" />
                      </Button>
                    </>
                  )}
                  {isEngaged && (
                    <Button size="sm" variant="ghost" onClick={() => onStatusChange(appt.id, 'completed')}
                      className="h-6 w-6 p-0 text-success hover:text-success hover:bg-success/10 rounded-md" title="Done">
                      <CheckCircle2 className="w-3 h-3" />
                    </Button>
                  )}
                  {isDone && <UserCheck className="w-3 h-3 text-success/60" />}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
