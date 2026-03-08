import { useState, useEffect, useCallback } from 'react';
import {
  Stethoscope, Clock, UserCheck, CheckCircle2, AlertTriangle, RefreshCw,
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

  const tabConfig: Array<{ key: QueueTab; label: string; icon: React.ElementType; count: number; color: string }> = [
    { key: 'waiting', label: 'Waiting', icon: Clock, count: waiting.length, color: 'text-amber-600 bg-amber-50 border-amber-200' },
    { key: 'engaged', label: 'Engaged', icon: UserCheck, count: engaged.length, color: 'text-blue-600 bg-blue-50 border-blue-200' },
    { key: 'completed', label: 'Completed', icon: CheckCircle2, count: completed.length, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  ];

  const filtered = activeTab === 'waiting' ? waiting : activeTab === 'engaged' ? engaged : completed;

  const emergencyCount = appointments.filter(a => a.emergency).length;

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="px-6 py-4 border-b border-gray-100 bg-white shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2.5">
              <Stethoscope className="w-5 h-5 text-teal-600" />
              Doctor Queue
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {appointments.length} patient{appointments.length !== 1 ? 's' : ''} today
              {emergencyCount > 0 && (
                <span className="inline-flex items-center gap-1 ml-2 text-red-600 font-medium">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {emergencyCount} emergency
                </span>
              )}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fetchQueue(true)}
            disabled={refreshing}
            className="h-9 w-9 p-0"
          >
            <RefreshCw className={cn('w-4 h-4', refreshing && 'animate-spin')} />
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as QueueTab)} className="mt-4">
          <TabsList>
            {tabConfig.map(tab => (
              <TabsTrigger key={tab.key} value={tab.key} className="gap-2">
                <tab.icon className="w-4 h-4" />
                {tab.label}
                <Badge variant="secondary" className="h-5 min-w-[20px] text-xs font-bold">
                  {tab.count}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <div className="flex-1 overflow-auto p-4">
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
        <div key={i} className="bg-white rounded-xl border border-gray-100 p-4">
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
