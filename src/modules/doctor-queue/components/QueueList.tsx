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
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <m.icon className="w-12 h-12 text-gray-200 mb-3" />
        <p className="text-sm font-medium text-gray-500">{m.text}</p>
        <p className="text-xs text-gray-400 mt-1">{m.sub}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
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
              'bg-white rounded-xl border p-4 transition-all hover:shadow-sm',
              appt.emergency ? 'border-red-200 bg-red-50/30' : 'border-gray-100',
              isEngaged && !appt.emergency && 'border-blue-200 bg-blue-50/30'
            )}
          >
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className={cn(
                  'w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold shrink-0',
                  appt.emergency
                    ? 'bg-red-100 text-red-700'
                    : isEngaged
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-700'
                )}>
                  {initials}
                </div>
                {appt.token_number && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-gray-900 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {appt.token_number}
                  </span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-gray-900">{appt.patient_name}</span>
                  {appt.emergency && (
                    <Badge className="bg-red-100 text-red-700 border-red-200 text-[10px] gap-0.5 h-5">
                      <AlertTriangle className="w-3 h-3" />
                      Emergency
                    </Badge>
                  )}
                  {appt.visit_type && (
                    <Badge variant="outline" className="text-[10px] h-5 border-gray-200">
                      {appt.visit_type}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500 flex-wrap">
                  <span className="font-mono text-gray-400">{appt.patient_uhid}</span>
                  {demographics && (
                    <>
                      <span className="text-gray-300">|</span>
                      <span>{demographics}</span>
                    </>
                  )}
                  <span className="text-gray-300">|</span>
                  <span>{appt.appointment_time?.slice(0, 5)}</span>
                  {isWaiting && (
                    <>
                      <span className="text-gray-300">|</span>
                      <span className="text-amber-600 flex items-center gap-0.5">
                        <Clock className="w-3 h-3" />
                        {getWaitTime(appt.created_at)}
                      </span>
                    </>
                  )}
                </div>
                {appt.chief_complaint && (
                  <p className="text-xs text-gray-400 mt-1 truncate max-w-md">
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
                      className="h-9 gap-1.5 bg-teal-600 hover:bg-teal-700 text-white"
                    >
                      <Play className="w-3.5 h-3.5" />
                      Start
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onStatusChange(appt.id, 'cancelled')}
                      className="h-9 w-9 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50"
                    >
                      <XCircle className="w-4 h-4" />
                    </Button>
                  </>
                )}
                {isEngaged && (
                  <Button
                    size="sm"
                    onClick={() => onStart(appt)}
                    className="h-9 gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Stethoscope className="w-3.5 h-3.5" />
                    Continue
                  </Button>
                )}
                {tab === 'completed' && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
