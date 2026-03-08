import { formatDistanceToNow } from 'date-fns';
import {
  Play, CheckCircle2, XCircle, AlertTriangle, Clock, Stethoscope,
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import type { QueueAppointment } from '../../../services/doctor-queue.service';
import { cn } from '../../../lib/utils';

interface Props {
  appointments: QueueAppointment[];
  tab: 'waiting' | 'engaged' | 'completed';
  onStart: (appt: QueueAppointment) => void;
  onStatusChange: (id: string, status: string) => void;
}

function getWaitTime(createdAt: string): string {
  try {
    return formatDistanceToNow(new Date(createdAt), { addSuffix: false });
  } catch {
    return '';
  }
}

function getAge(dob: string | null, age: number | null): string {
  if (age) return `${age}y`;
  if (!dob) return '';
  const years = Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  return `${years}y`;
}

export default function QueueList({ appointments, tab, onStart, onStatusChange }: Props) {
  if (appointments.length === 0) {
    const msgs = {
      waiting: { icon: Clock, text: 'No patients waiting', sub: 'New patients will appear here in real-time' },
      engaged: { icon: Stethoscope, text: 'No active consultations', sub: 'Start a consultation from the Waiting tab' },
      completed: { icon: CheckCircle2, text: 'No completed consultations yet', sub: 'Completed consultations will appear here' },
    };
    const m = msgs[tab];
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
          <m.icon className="w-8 h-8 text-muted-foreground/40" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">{m.text}</p>
        <p className="text-xs text-muted-foreground/70 mt-1">{m.sub}</p>
      </div>
    );
  }

  const TAB_ACCENT: Record<string, string> = {
    waiting: 'border-l-amber-500',
    engaged: 'border-l-primary',
    completed: 'border-l-emerald-500',
  };

  return (
    <div className="space-y-2.5 stagger-children">
      {appointments.map(appt => {
        const initials = appt.patient_name
          ?.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase() || '?';
        const ageStr = getAge(appt.patient_dob, appt.patient_age);
        const genderStr = appt.patient_gender
          ? appt.patient_gender.charAt(0).toUpperCase()
          : '';
        const demographics = [ageStr, genderStr].filter(Boolean).join('/');
        const isWaiting = appt.status === 'scheduled' || appt.status === 'confirmed';
        const isEngaged = appt.status === 'in_progress';

        return (
          <div
            key={appt.id}
            className={cn(
              'bg-card rounded-2xl border border-border/50 border-l-[3px] p-4 transition-all duration-300 hover:shadow-hover group',
              TAB_ACCENT[tab] || 'border-l-border',
              appt.emergency && 'border-l-destructive animate-pulse-red bg-destructive/5',
              isEngaged && !appt.emergency && 'bg-primary/5',
            )}
          >
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className={cn(
                  'w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-all duration-300',
                  appt.emergency
                    ? 'bg-gradient-to-br from-red-100 to-red-200 text-red-700'
                    : isEngaged
                      ? 'bg-gradient-to-br from-primary/20 to-primary/30 text-primary'
                      : 'bg-muted text-muted-foreground',
                )}>
                  {initials}
                </div>
                {appt.token_number && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-foreground text-background text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm">
                    {appt.token_number}
                  </span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-foreground">{appt.patient_name}</span>
                  {appt.emergency && (
                    <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-[10px] gap-0.5 h-5">
                      <AlertTriangle className="w-3 h-3" />
                      Emergency
                    </Badge>
                  )}
                  {appt.visit_type && (
                    <Badge variant="outline" className="text-[10px] h-5 border-border">
                      {appt.visit_type}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground flex-wrap">
                  <span className="font-mono opacity-70">{appt.patient_uhid}</span>
                  {demographics && (
                    <>
                      <span className="text-border">|</span>
                      <span>{demographics}</span>
                    </>
                  )}
                  <span className="text-border">|</span>
                  <span>{appt.appointment_time?.slice(0, 5)}</span>
                  {isWaiting && (
                    <>
                      <span className="text-border">|</span>
                      <span className="text-amber-600 flex items-center gap-0.5">
                        <Clock className="w-3 h-3" />
                        {getWaitTime(appt.created_at)}
                      </span>
                    </>
                  )}
                </div>
                {appt.chief_complaint && (
                  <p className="text-xs text-muted-foreground/70 mt-1 truncate max-w-md">
                    CC: {appt.chief_complaint}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {isWaiting && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => onStart(appt)}
                      className="h-9 gap-1.5 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-primary-foreground shadow-sm transition-all hover:scale-[1.02]"
                    >
                      <Play className="w-3.5 h-3.5" />
                      Start
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onStatusChange(appt.id, 'cancelled')}
                      className="h-9 w-9 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    >
                      <XCircle className="w-4 h-4" />
                    </Button>
                  </>
                )}
                {isEngaged && (
                  <Button
                    size="sm"
                    onClick={() => onStart(appt)}
                    className="h-9 gap-1.5 bg-gradient-to-r from-primary to-primary-dark text-primary-foreground shadow-sm transition-all hover:scale-[1.02]"
                  >
                    <Stethoscope className="w-3.5 h-3.5" />
                    Continue
                  </Button>
                )}
                {tab === 'completed' && (
                  <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
