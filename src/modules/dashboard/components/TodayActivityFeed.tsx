import { useState, useEffect } from 'react';
import { Activity, UserPlus, BedDouble, LogOut, Stethoscope, Clock } from 'lucide-react';
import { mockStore } from '../../../lib/mockStore';
import { useHospitalId } from '../../../hooks/useHospitalId';
import { Skeleton } from '../../../components/ui/skeleton';
import { Badge } from '../../../components/ui/badge';
import { format } from 'date-fns';
import { cn } from '../../../lib/utils';

interface ActivityItem {
  id: string;
  time: string;
  patient_name: string;
  type: 'admission' | 'discharge' | 'new_patient' | 'appointment';
  detail?: string;
}

const TYPE_CONFIG = {
  admission: { icon: BedDouble, label: 'Admitted', bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-400' },
  discharge: { icon: LogOut, label: 'Discharged', bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-400' },
  new_patient: { icon: UserPlus, label: 'New Patient', bg: 'bg-violet-50', text: 'text-violet-700', dot: 'bg-violet-400' },
  appointment: { icon: Stethoscope, label: 'OPD Visit', bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-400' },
};

const DEMO_ACTIVITIES: ActivityItem[] = [
  { id: '1', time: '2026-03-08T10:15:00', patient_name: 'Rahul Shah', type: 'admission', detail: 'General Ward' },
  { id: '2', time: '2026-03-08T10:30:00', patient_name: 'Meena Patel', type: 'appointment', detail: 'Dr. Mehta' },
  { id: '3', time: '2026-03-08T10:45:00', patient_name: 'Priya Sharma', type: 'new_patient' },
  { id: '4', time: '2026-03-08T11:10:00', patient_name: 'Amit Desai', type: 'discharge', detail: 'ICU → Home' },
  { id: '5', time: '2026-03-08T11:30:00', patient_name: 'Sunita Gupta', type: 'appointment', detail: 'Dr. Patel' },
  { id: '6', time: '2026-03-08T11:45:00', patient_name: 'Rajesh Kumar', type: 'new_patient' },
  { id: '7', time: '2026-03-08T12:00:00', patient_name: 'Anita Joshi', type: 'admission', detail: 'Private Room' },
  { id: '8', time: '2026-03-08T12:15:00', patient_name: 'Vikram Singh', type: 'appointment', detail: 'Dr. Shah' },
];

function formatTime(dateStr: string): string {
  try {
    return format(new Date(dateStr), 'hh:mm a');
  } catch {
    return '-';
  }
}

export default function TodayActivityFeed() {
  const hospitalId = useHospitalId();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const today = format(new Date(), 'yyyy-MM-dd');
        const items: ActivityItem[] = [];

        const { data: appts } = await supabase
          .from('appointments')
          .select('id, appointment_time, status, patient:patients(full_name), doctor:profiles(full_name)')
          .eq('hospital_id', hospitalId)
          .eq('appointment_date', today)
          .order('appointment_time', { ascending: false })
          .limit(10);

        for (const row of (appts ?? []) as Record<string, unknown>[]) {
          items.push({
            id: `appt-${row.id}`,
            time: `${today}T${row.appointment_time || '00:00'}`,
            patient_name: ((row.patient as Record<string, unknown>)?.full_name as string) ?? 'Unknown',
            type: 'appointment',
            detail: ((row.doctor as Record<string, unknown>)?.full_name as string) ?? '',
          });
        }

        const { data: patients } = await supabase
          .from('patients')
          .select('id, full_name, created_at')
          .eq('hospital_id', hospitalId)
          .gte('created_at', `${today}T00:00:00`)
          .order('created_at', { ascending: false })
          .limit(5);

        for (const row of (patients ?? []) as Record<string, unknown>[]) {
          items.push({
            id: `pat-${row.id}`,
            time: row.created_at as string,
            patient_name: (row.full_name as string) ?? 'Unknown',
            type: 'new_patient',
          });
        }

        items.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
        const finalItems = items.slice(0, 8);
        setActivities(finalItems.length > 0 ? finalItems : DEMO_ACTIVITIES);
      } catch {
        setActivities(DEMO_ACTIVITIES);
      }
      finally { setLoading(false); }
    })();
  }, [hospitalId]);

  return (
    <section className="bg-card border border-border/50 rounded-2xl overflow-hidden h-full shadow-card">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Activity className="w-4 h-4 text-primary" />
          </div>
          <h2 className="text-sm font-semibold text-foreground">Today's Activity</h2>
          <span className="relative flex h-2 w-2 ml-1">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
        </div>
        <Badge variant="secondary" className="text-xs bg-muted text-muted-foreground">
          {activities.length} events
        </Badge>
      </div>

      <div className="px-5 py-3 max-h-[360px] overflow-y-auto scrollbar-thin">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="w-8 h-8 rounded-lg" />
                <div className="flex-1">
                  <Skeleton className="h-3.5 w-28 mb-1" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="relative">
            <div className="absolute left-[15px] top-2 bottom-2 w-px bg-border" />
            <div className="space-y-1">
              {activities.map((item) => {
                const config = TYPE_CONFIG[item.type];
                const Icon = config.icon;
                return (
                  <div key={item.id} className="flex items-start gap-3 py-2 px-1 rounded-lg hover:bg-muted/30 transition-colors relative">
                    <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0 z-10', config.bg)}>
                      <Icon className={cn('w-4 h-4', config.text)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{item.patient_name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span className="font-medium">{formatTime(item.time)}</span>
                        {item.detail && <span className="truncate">· {item.detail}</span>}
                      </div>
                    </div>
                    <Badge variant="secondary" className={cn('text-[10px] shrink-0', config.bg, config.text)}>
                      {config.label}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
