import { format, parseISO } from 'date-fns';
import { CalendarDays, Clock, MapPin, AlertTriangle } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PreOpChecklist from './PreOpChecklist';
import SurgicalTeamPanel from './SurgicalTeamPanel';
import type { SurgeryBooking, SurgeryStatus } from '../types';

const STATUS_STYLES: Record<SurgeryStatus, string> = {
  scheduled: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  pre_op: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  in_progress: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  post_op: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  completed: 'bg-muted text-muted-foreground',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

const STATUS_LABELS: Record<SurgeryStatus, string> = {
  scheduled: 'Scheduled',
  pre_op: 'Pre-Op',
  in_progress: 'In Progress',
  post_op: 'Post-Op',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const PRIORITY_BADGE: Record<string, string> = {
  elective: 'default',
  urgent: 'secondary',
  emergency: 'destructive',
};

interface Props {
  booking: SurgeryBooking | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (updated: SurgeryBooking) => void;
}

export default function SurgeryDetailSheet({ booking, open, onOpenChange, onUpdate }: Props) {
  if (!booking) return null;

  const handleChecklistToggle = (itemId: string) => {
    const updated = {
      ...booking,
      pre_op_checklist: booking.pre_op_checklist.map((item) =>
        item.id === itemId
          ? { ...item, completed: !item.completed, completed_at: !item.completed ? new Date().toISOString() : undefined }
          : item
      ),
    };
    onUpdate(updated);
  };

  const handleStatusChange = (status: SurgeryStatus) => {
    onUpdate({ ...booking, status });
  };

  const handleTeamChange = (team: typeof booking.team) => {
    onUpdate({ ...booking, team });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-lg">{booking.surgery_name}</SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-5">
          {/* Status & Priority */}
          <div className="flex items-center gap-3 flex-wrap">
            <Badge className={STATUS_STYLES[booking.status]}>{STATUS_LABELS[booking.status]}</Badge>
            <Badge variant={PRIORITY_BADGE[booking.priority] as any} className="capitalize">{booking.priority}</Badge>
            <div className="ml-auto">
              <Select value={booking.status} onValueChange={(v) => handleStatusChange(v as SurgeryStatus)}>
                <SelectTrigger className="h-8 w-[140px] text-xs">
                  <SelectValue placeholder="Change status" />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(STATUS_LABELS) as [SurgeryStatus, string][]).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Patient & Schedule */}
          <div className="rounded-lg border border-border p-3 space-y-2 bg-muted/30">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Patient:</span>
              <span className="font-medium text-foreground">{booking.patient_name}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <span className="text-foreground">{format(parseISO(booking.surgery_date), 'EEEE, d MMM yyyy')}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-foreground">{booking.start_time} – {booking.end_time}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-foreground">{booking.ot_name}</span>
            </div>
            {booking.diagnosis && (
              <div className="flex items-center gap-2 text-sm">
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground">{booking.diagnosis}</span>
              </div>
            )}
          </div>

          <Separator />

          {/* Pre-Op Checklist */}
          <PreOpChecklist
            items={booking.pre_op_checklist}
            onToggle={handleChecklistToggle}
            readOnly={booking.status === 'completed' || booking.status === 'cancelled'}
          />

          <Separator />

          {/* Surgical Team */}
          <SurgicalTeamPanel
            team={booking.team}
            onChange={handleTeamChange}
            readOnly={booking.status === 'completed' || booking.status === 'cancelled'}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
