import { useState, useEffect, useCallback } from 'react';
import {
  Stethoscope, Clock, UserCheck, CheckCircle2, RefreshCw,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Skeleton } from '../../components/ui/skeleton';
import { useHospitalId } from '../../hooks/useHospitalId';
import { useAppSelector } from '../../store';
import { useRealtime } from '../../hooks/useRealtime';
import { usePageTitle } from '../../hooks/usePageTitle';
import PageHeader from '../../components/shared/PageHeader';
import doctorQueueService, { type QueueAppointment } from '../../services/doctor-queue.service';
import QueueList from './components/QueueList';
import ConsultationDrawer from './components/ConsultationDrawer';
import { cn } from '../../lib/utils';

type QueueTab = 'waiting' | 'engaged' | 'completed';

export default function DoctorQueuePage() {
  usePageTitle('Doctor Queue');
  const hospitalId = useHospitalId();
  const user = useAppSelector(s => s.auth.user);
  const doctorId = user?.id ?? '';

  const [appointments, setAppointments] = useState<QueueAppointment[]>([]);
  const [activeTab, setActiveTab] = useState<QueueTab>('waiting');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState<QueueAppointment | null>(null);
  const [hospitalSettings, setHospitalSettings] = useState<Record<string, string>>({});

  const fetchQueue = useCallback(async (silent = false) => {
    if (!doctorId) return;
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const data = await doctorQueueService.getTodayQueue(doctorId, hospitalId);
      setAppointments(data);
    } catch {
      //
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [doctorId, hospitalId]);

  const fetchSettings = useCallback(async () => {
    try {
      const s = await doctorQueueService.getHospitalSettings(hospitalId);
      setHospitalSettings(s);
    } catch {
      //
    }
  }, [hospitalId]);

  useEffect(() => { fetchQueue(); }, [fetchQueue]);
  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  useRealtime(
    { table: 'appointments', filter: `doctor_id=eq.${doctorId}` },
    () => fetchQueue(true)
  );

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await doctorQueueService.updateAppointmentStatus(id, status);
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    } catch {
      //
    }
  };

  const handleStartConsultation = (appt: QueueAppointment) => {
    if (appt.status === 'scheduled' || appt.status === 'confirmed') {
      handleStatusChange(appt.id, 'in_progress');
      setAppointments(prev => prev.map(a => a.id === appt.id ? { ...a, status: 'in_progress' } : a));
    }
    setSelectedAppt(appt);
  };

  const handleConsultationSaved = () => {
    setSelectedAppt(null);
    fetchQueue(true);
  };

  const waiting = appointments.filter(a => a.status === 'scheduled' || a.status === 'confirmed');
  const engaged = appointments.filter(a => a.status === 'in_progress');
  const completed = appointments.filter(a => a.status === 'completed');

  const tabConfig: Array<{ key: QueueTab; label: string; icon: React.ElementType; count: number; badgeClass: string }> = [
    { key: 'waiting', label: 'Waiting', icon: Clock, count: waiting.length, badgeClass: 'bg-amber-100 text-amber-700' },
    { key: 'engaged', label: 'Engaged', icon: UserCheck, count: engaged.length, badgeClass: 'bg-primary/10 text-primary' },
    { key: 'completed', label: 'Completed', icon: CheckCircle2, count: completed.length, badgeClass: 'bg-emerald-100 text-emerald-700' },
  ];

  const filtered = activeTab === 'waiting' ? waiting : activeTab === 'engaged' ? engaged : completed;

  const emergencyCount = appointments.filter(a => a.emergency).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Doctor Queue"
        subtitle={`${appointments.length} patient${appointments.length !== 1 ? 's' : ''} today${emergencyCount > 0 ? ` · ${emergencyCount} emergency` : ''}`}
        icon={Stethoscope}
        actions={
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fetchQueue(true)}
            disabled={refreshing}
            className="h-9 w-9 p-0"
          >
            <RefreshCw className={cn('w-4 h-4', refreshing && 'animate-spin')} />
          </Button>
        }
      />

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as QueueTab)}>
        <TabsList className="h-11 p-1 bg-muted/50 rounded-xl">
          {tabConfig.map(tab => (
            <TabsTrigger
              key={tab.key}
              value={tab.key}
              className="gap-2 rounded-lg data-[state=active]:shadow-sm transition-all"
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              <Badge className={cn('h-5 min-w-[20px] text-xs font-bold border-0', tab.badgeClass)}>
                {tab.count}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div>
        {loading ? (
          <QueueSkeleton />
        ) : (
          <QueueList
            appointments={filtered}
            tab={activeTab}
            onStart={handleStartConsultation}
            onStatusChange={handleStatusChange}
          />
        )}
      </div>

      {selectedAppt && (
        <ConsultationDrawer
          appointment={selectedAppt}
          hospitalId={hospitalId}
          doctorId={doctorId}
          doctorName={user?.full_name ?? 'Doctor'}
          hospitalSettings={hospitalSettings}
          onClose={() => setSelectedAppt(null)}
          onSaved={handleConsultationSaved}
        />
      )}
    </div>
  );
}

function QueueSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="bg-card rounded-2xl border border-border/50 p-4">
          <div className="flex items-center gap-4">
            <Skeleton className="w-12 h-12 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-56" />
            </div>
            <Skeleton className="h-9 w-28 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}
