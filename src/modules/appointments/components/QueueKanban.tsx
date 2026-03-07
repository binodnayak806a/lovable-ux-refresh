import { useMemo } from 'react';
import { Clock, Play, CheckCircle2, XCircle, FileText } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import type { WeekAppointment } from '../../../services/appointments.service';
import { cn } from '../../../lib/utils';

interface Props {
  appointments: WeekAppointment[];
  onStatusChange: (id: string, status: string) => void;
  onPrintCasePaper: (appt: WeekAppointment) => void;
}

function getWaitTime(apptTime: string): string {
  if (!apptTime) return '';
  const now = new Date();
  const [h, m] = apptTime.split(':').map(Number);
  const scheduled = new Date();
  scheduled.setHours(h, m, 0, 0);
  const diffMs = now.getTime() - scheduled.getTime();
  if (diffMs < 0) return 'Upcoming';
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${mins}m wait`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m wait`;
}

const COLUMNS = [
  { key: 'waiting', label: 'Waiting', color: 'amber', statuses: ['scheduled', 'confirmed', 'qr_booked'] },
  { key: 'engaged', label: 'Engaged', color: 'blue', statuses: ['in_progress'] },
  { key: 'done', label: 'Done', color: 'emerald', statuses: ['completed'] },
] as const;

const COLUMN_STYLES: Record<string, { bg: string; border: string; badge: string; header: string }> = {
  amber: { bg: 'bg-amber-50/50', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-700', header: 'text-amber-800' },
  blue: { bg: 'bg-blue-50/50', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-700', header: 'text-blue-800' },
  emerald: { bg: 'bg-emerald-50/50', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-700', header: 'text-emerald-800' },
};

export default function QueueKanban({ appointments, onStatusChange, onPrintCasePaper }: Props) {
  const todayStr = new Date().toISOString().split('T')[0];

  const todayAppts = useMemo(() => {
    return appointments
      .filter(a => a.appointment_date === todayStr && a.status !== 'cancelled' && a.status !== 'no_show')
      .sort((a, b) => (a.token_number ?? 0) - (b.token_number ?? 0));
  }, [appointments, todayStr]);

  const grouped = useMemo(() => {
    const map: Record<string, WeekAppointment[]> = { waiting: [], engaged: [], done: [] };
    for (const a of todayAppts) {
      if (a.status === 'completed') map.done.push(a);
      else if (a.status === 'in_progress') map.engaged.push(a);
      else map.waiting.push(a);
    }
    return map;
  }, [todayAppts]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
      {COLUMNS.map(col => {
        const items = grouped[col.key] ?? [];
        const styles = COLUMN_STYLES[col.color];
        return (
          <div key={col.key} className={cn('rounded-xl border flex flex-col', styles.bg, styles.border)}>
            <div className="px-4 py-3 border-b border-inherit flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className={cn('text-sm font-semibold', styles.header)}>{col.label}</h3>
                <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', styles.badge)}>
                  {items.length}
                </span>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                  <Clock className="w-6 h-6 mb-1 opacity-30" />
                  <p className="text-xs">No patients</p>
                </div>
              ) : (
                items.map(appt => (
                  <KanbanCard
                    key={appt.id}
                    appt={appt}
                    column={col.key}
                    onStatusChange={onStatusChange}
                    onPrintCasePaper={onPrintCasePaper}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function KanbanCard({ appt, column, onStatusChange, onPrintCasePaper }: {
  appt: WeekAppointment;
  column: string;
  onStatusChange: (id: string, status: string) => void;
  onPrintCasePaper: (appt: WeekAppointment) => void;
}) {
  const initials = appt.patient_name
    ?.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase() || '?';

  return (
    <div className="bg-white rounded-lg border border-gray-100 p-3 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start gap-2.5">
        <div className={cn(
          'w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
          column === 'engaged' ? 'bg-blue-600 text-white' :
          column === 'done' ? 'bg-emerald-100 text-emerald-700' :
          'bg-gray-100 text-gray-700'
        )}>
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-gray-900 truncate">{appt.patient_name}</span>
            {appt.token_number && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-gray-200 text-gray-500 shrink-0">
                #{appt.token_number}
              </Badge>
            )}
            {appt.status === 'qr_booked' && (
              <Badge className="text-[9px] px-1 py-0 bg-teal-100 text-teal-700 shrink-0">
                QR
              </Badge>
            )}
          </div>
          <p className="text-[10px] text-gray-400 mt-0.5">{appt.patient_uhid}</p>
          <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-500">
            <span>{appt.appointment_time?.slice(0, 5)}</span>
            <span className="text-gray-300">|</span>
            <span className="truncate">{appt.doctor_name}</span>
          </div>
          {appt.visit_type && (
            <Badge variant="outline" className="text-[9px] px-1 py-0 mt-1 border-gray-200 text-gray-500">
              {appt.visit_type}
            </Badge>
          )}
          {column === 'waiting' && (
            <p className="text-[10px] text-amber-600 font-medium mt-1">
              {getWaitTime(appt.appointment_time)}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 mt-2 pt-2 border-t border-gray-50">
        {column === 'waiting' && (
          <>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onStatusChange(appt.id, 'in_progress')}
              className="h-7 flex-1 text-xs text-blue-600 hover:bg-blue-50 gap-1"
            >
              <Play className="w-3 h-3" /> Start
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onPrintCasePaper(appt)}
              className="h-7 w-7 p-0 text-gray-400 hover:text-gray-600"
            >
              <FileText className="w-3.5 h-3.5" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onStatusChange(appt.id, 'cancelled')}
              className="h-7 w-7 p-0 text-gray-400 hover:text-red-600"
            >
              <XCircle className="w-3.5 h-3.5" />
            </Button>
          </>
        )}
        {column === 'engaged' && (
          <>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onStatusChange(appt.id, 'completed')}
              className="h-7 flex-1 text-xs text-emerald-600 hover:bg-emerald-50 gap-1"
            >
              <CheckCircle2 className="w-3 h-3" /> Complete
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onPrintCasePaper(appt)}
              className="h-7 w-7 p-0 text-gray-400 hover:text-gray-600"
            >
              <FileText className="w-3.5 h-3.5" />
            </Button>
          </>
        )}
        {column === 'done' && (
          <div className="flex items-center gap-1 text-emerald-500 text-xs w-full justify-center">
            <CheckCircle2 className="w-3 h-3" />
            <span className="font-medium">Completed</span>
          </div>
        )}
      </div>
    </div>
  );
}
