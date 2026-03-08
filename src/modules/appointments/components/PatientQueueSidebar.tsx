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
  in_progress: 0,
  qr_booked: 1,
  scheduled: 2,
  confirmed: 3,
  completed: 4,
  cancelled: 5,
  no_show: 6,
};

export default function PatientQueueSidebar({ appointments, onStatusChange }: Props) {
  const [search, setSearch] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];
  const todayAppts = appointments
    .filter(a => a.appointment_date === todayStr)
    .sort((a, b) => {
      const orderDiff = (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9);
      if (orderDiff !== 0) return orderDiff;
      return (a.appointment_time ?? '').localeCompare(b.appointment_time ?? '');
    });

  const filtered = search.trim()
    ? todayAppts.filter(a =>
        a.patient_name?.toLowerCase().includes(search.toLowerCase()) ||
        a.doctor_name?.toLowerCase().includes(search.toLowerCase()) ||
        String(a.token_number).includes(search)
      )
    : todayAppts;

  const today = todayAppts.length;
  const waiting = todayAppts.filter(a => a.status === 'scheduled' || a.status === 'confirmed' || a.status === 'qr_booked').length;
  const engaged = todayAppts.filter(a => a.status === 'in_progress').length;
  const done = todayAppts.filter(a => a.status === 'completed').length;

  return (
    <div className="glass-card h-full flex flex-col">
      {/* Tabs header */}
      <div className="px-4 pt-4 pb-2 border-b border-border/40">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm font-semibold text-foreground">Appointment</span>
          <span className="text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors">Follow up</span>
        </div>

        {/* Status counters */}
        <div className="grid grid-cols-4 gap-2 mb-3">
          {[
            { label: 'Today', count: today, color: 'bg-primary text-primary-foreground' },
            { label: 'Waiting', count: waiting, color: 'bg-warning text-warning-foreground' },
            { label: 'Engaged', count: engaged, color: 'bg-info text-info-foreground' },
            { label: 'Done', count: done, color: 'bg-success text-success-foreground' },
          ].map(item => (
            <div key={item.label} className="text-center">
              <div className="text-[10px] font-medium text-muted-foreground mb-1">{item.label}</div>
              <div className={cn('text-xs font-bold rounded-full px-3 py-1 inline-block min-w-[32px]', item.color)}>
                {item.count}
              </div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search Appointment"
            className="pl-9 pr-8 h-9 text-xs bg-muted/30 border-border/50"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Appointment list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-3">
              <Clock className="w-8 h-8 text-muted-foreground/40" />
            </div>
            <p className="text-sm text-muted-foreground">No appointment available.</p>
          </div>
        ) : (
          filtered.map(appt => {
            const initials = appt.patient_name
              ?.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase() || '?';

            const isWaiting = appt.status === 'scheduled' || appt.status === 'confirmed' || appt.status === 'qr_booked';
            const isEngaged = appt.status === 'in_progress';
            const isDone = appt.status === 'completed';
            const isCancelled = appt.status === 'cancelled' || appt.status === 'no_show';

            return (
              <div
                key={appt.id}
                className={cn(
                  'flex items-center gap-2.5 p-2.5 rounded-xl transition-all',
                  isEngaged && 'bg-info/10 border border-info/20',
                  isDone && 'opacity-50',
                  isCancelled && 'opacity-30',
                  !isEngaged && !isDone && !isCancelled && 'hover:bg-muted/50'
                )}
              >
                <div className={cn(
                  'w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0',
                  isEngaged ? 'bg-primary text-primary-foreground shadow-sm' :
                  isDone ? 'bg-success/10 text-success' :
                  'bg-muted text-muted-foreground'
                )}>
                  {initials}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-foreground truncate">
                      {appt.patient_name}
                    </span>
                    {appt.token_number && (
                      <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 border-border/50 text-muted-foreground font-mono">
                        #{appt.token_number}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <span>{appt.appointment_time?.slice(0, 5)}</span>
                    <span className="text-border">•</span>
                    <span className="truncate">{appt.doctor_name}</span>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-0.5">
                  {isWaiting && (
                    <Button size="sm" variant="ghost"
                      onClick={() => onStatusChange(appt.id, 'in_progress')}
                      className="h-7 w-7 p-0 text-info hover:text-info hover:bg-info/10"
                      title="Start consultation"
                    >
                      <Play className="w-3.5 h-3.5" />
                    </Button>
                  )}
                  {isEngaged && (
                    <Button size="sm" variant="ghost"
                      onClick={() => onStatusChange(appt.id, 'completed')}
                      className="h-7 w-7 p-0 text-success hover:text-success hover:bg-success/10"
                      title="Mark done"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                  {isWaiting && (
                    <Button size="sm" variant="ghost"
                      onClick={() => onStatusChange(appt.id, 'cancelled')}
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      title="Cancel"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                    </Button>
                  )}
                  {isDone && (
                    <UserCheck className="w-3.5 h-3.5 text-success" />
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
