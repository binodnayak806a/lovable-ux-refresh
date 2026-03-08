import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  UserPlus, List, Search, RefreshCw, Clock, CheckCircle2,
  XCircle, User, CalendarClock, Stethoscope,
  ChevronLeft, ChevronRight, AlertTriangle, Activity,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { usePageTitle } from '../../hooks/usePageTitle';
import PageHeader from '../../components/shared/PageHeader';
import SharedStatCard from '../../components/shared/StatCard';
import { Skeleton } from '../../components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { useAppSelector } from '../../store';
import { useToast } from '../../hooks/useToast';
import dashboardService from '../../services/dashboard.service';
import PatientRegistrationForm from './components/PatientRegistrationForm';
import VitalsPage from './vitals/VitalsPage';
import ConsultationPage from './consultation/ConsultationPage';
import { useDebounce } from '../../hooks/useDebounce';

const SAMPLE_HOSPITAL_ID = '11111111-1111-1111-1111-111111111111';

type Tab = 'queue' | 'register' | 'vitals' | 'consultation';

const STATUS_STYLES: Record<string, { label: string; cls: string; icon: React.ElementType }> = {
  scheduled: { label: 'Scheduled', cls: 'bg-blue-50 text-blue-700 border-blue-100', icon: Clock },
  confirmed: { label: 'Confirmed', cls: 'bg-emerald-50 text-emerald-700 border-emerald-100', icon: CheckCircle2 },
  in_progress: { label: 'In Progress', cls: 'bg-amber-50 text-amber-700 border-amber-100', icon: Stethoscope },
  completed: { label: 'Completed', cls: 'bg-gray-100 text-gray-600 border-gray-200', icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', cls: 'bg-red-50 text-red-600 border-red-100', icon: XCircle },
  no_show: { label: 'No Show', cls: 'bg-orange-50 text-orange-600 border-orange-100', icon: AlertTriangle },
};

interface AppointmentRow {
  id: string;
  patient_name: string;
  doctor_name: string;
  appointment_date: string;
  appointment_time: string;
  type: string;
  status: string;
  chief_complaint: string | null;
}

function formatTime(t: string) {
  if (!t) return '';
  const [h, m] = t.split(':');
  const hour = parseInt(h);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  return `${hour % 12 || 12}:${m} ${ampm}`;
}

export default function OPDPage() {
  usePageTitle('OPD');
  const { user } = useAppSelector((s) => s.auth);
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();

  const hospitalId = user?.hospital_id ?? SAMPLE_HOSPITAL_ID;
  const registeredUhid = searchParams.get('registered');

  const [tab, setTab] = useState<Tab>(registeredUhid ? 'queue' : 'queue');
  const [appointments, setAppointments] = useState<AppointmentRow[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ scheduled: 0, inProgress: 0, completed: 0, total: 0 });

  const search = useDebounce(searchInput, 350);
  const limit = 12;
  const today = new Date().toISOString().split('T')[0];

  const loadAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await dashboardService.getAppointments(hospitalId, {
        dateFrom: today,
        dateTo: today,
        status: statusFilter === 'all' ? undefined : statusFilter,
        search: search || undefined,
        page,
        limit,
      });
      setAppointments(res.data.map((r: Record<string, unknown>) => ({
        id: r.id as string,
        patient_name: ((r.patients as Record<string, unknown>)?.full_name as string) ?? '',
        doctor_name: ((r.profiles as Record<string, unknown>)?.full_name as string) ?? '',
        appointment_date: r.appointment_date as string,
        appointment_time: r.appointment_time as string,
        type: r.type as string,
        status: r.status as string,
        chief_complaint: r.chief_complaint as string | null,
      })));
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch {
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, [hospitalId, today, statusFilter, search, page, limit]);

  const loadStats = useCallback(async () => {
    try {
      const [all, prog, done] = await Promise.all([
        dashboardService.getAppointments(hospitalId, { dateFrom: today, dateTo: today, limit: 1 }),
        dashboardService.getAppointments(hospitalId, { dateFrom: today, dateTo: today, status: 'in_progress', limit: 1 }),
        dashboardService.getAppointments(hospitalId, { dateFrom: today, dateTo: today, status: 'completed', limit: 1 }),
      ]);
      setStats({ scheduled: all.total, inProgress: prog.total, completed: done.total, total: all.total });
    } catch { /* noop */ }
  }, [hospitalId, today]);

  useEffect(() => { if (tab === 'queue') { loadAppointments(); loadStats(); } }, [tab, loadAppointments, loadStats]);
  useEffect(() => { setPage(1); }, [search, statusFilter]);

  useEffect(() => {
    if (registeredUhid) {
      toast('Registration successful', { description: `Patient UHID: ${registeredUhid}`, type: 'success' });
      setSearchParams({});
    }
  }, [registeredUhid, toast, setSearchParams]);

  const StatusBadge = ({ status }: { status: string }) => {
    const cfg = STATUS_STYLES[status] ?? STATUS_STYLES.scheduled;
    const Icon = cfg.icon;
    return (
      <Badge className={`text-xs border gap-1 px-2 py-0.5 font-medium ${cfg.cls}`}>
        <Icon className="w-3 h-3" />
        {cfg.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <PageHeader
          title="OPD Management"
          subtitle={`Outpatient Department — ${new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`}
          icon={Stethoscope}
        />
        <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
          <TabsList>
            <TabsTrigger value="queue" className="gap-1.5">
              <List className="w-4 h-4" />
              Today's Queue
            </TabsTrigger>
            <TabsTrigger value="register" className="gap-1.5">
              <UserPlus className="w-4 h-4" />
              Register Patient
            </TabsTrigger>
            <TabsTrigger value="vitals" className="gap-1.5">
              <Activity className="w-4 h-4" />
              Record Vitals
            </TabsTrigger>
            <TabsTrigger value="consultation" className="gap-1.5">
              <Stethoscope className="w-4 h-4" />
              Consultation
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {tab === 'queue' && (
        <div className="space-y-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 stagger-children">
            <SharedStatCard label="Today's Total" value={stats.total} icon={CalendarClock} iconClassName="bg-primary/10 text-primary" accentColor="blue" />
            <SharedStatCard label="In Progress" value={stats.inProgress} icon={Stethoscope} iconClassName="bg-amber-50 text-amber-600" accentColor="amber" />
            <SharedStatCard label="Completed" value={stats.completed} icon={CheckCircle2} iconClassName="bg-emerald-50 text-emerald-600" accentColor="green" />
            <SharedStatCard label="Pending" value={stats.total - stats.completed - stats.inProgress} icon={Clock} iconClassName="bg-muted text-muted-foreground" />
          </div>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <CardTitle className="text-base font-semibold text-gray-900">Today's Appointments</CardTitle>
                <div className="flex items-center gap-2 sm:ml-auto flex-wrap">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                    <Input
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      placeholder="Search patient, doctor…"
                      className="h-8 pl-8 text-xs border-gray-200 w-48"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="h-8 w-[130px] text-xs">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      {Object.entries(STATUS_STYLES).map(([key, cfg]) => (
                        <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadAppointments}
                    disabled={loading}
                    className="h-8 w-8 p-0 border-gray-200"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-4 space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="w-8 h-8 rounded-full" />
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-3.5 w-36" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                      <Skeleton className="h-6 w-20 rounded-full" />
                    </div>
                  ))}
                </div>
              ) : appointments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <CalendarClock className="w-10 h-10 mb-3 opacity-30" />
                  <p className="text-sm font-medium">No appointments found</p>
                  <p className="text-xs mt-1">Register a patient to create an appointment</p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-4 gap-1.5 border-gray-200"
                    onClick={() => setTab('register')}
                  >
                    <UserPlus className="w-4 h-4" /> Register Patient
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {appointments.map((appt) => {
                    const initials = appt.patient_name.split(' ').slice(0, 2).map((n) => n[0]).join('');
                    return (
                      <div key={appt.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                        <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm shrink-0">
                          {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold text-gray-900">{appt.patient_name}</p>
                          </div>
                          <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400 flex-wrap">
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />{appt.doctor_name || 'Unassigned'}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />{formatTime(appt.appointment_time)}
                            </span>
                            {appt.chief_complaint && (
                              <span className="truncate max-w-[200px]">{appt.chief_complaint}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant="outline" className="text-xs px-2 py-0.5 border-gray-200 text-gray-500 capitalize hidden sm:flex">
                            {appt.type.replace('_', ' ')}
                          </Badge>
                          <StatusBadge status={appt.status} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                  <span className="text-xs text-gray-400">
                    Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="h-7 w-7 p-0 border-gray-200"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </Button>
                    <span className="text-xs text-gray-600 px-2 font-medium">{page}/{totalPages}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="h-7 w-7 p-0 border-gray-200"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {tab === 'register' && (
        <PatientRegistrationForm
          onSuccess={() => { setTab('queue'); loadAppointments(); loadStats(); }}
          onCancel={() => setTab('queue')}
        />
      )}

      {tab === 'vitals' && (
        <VitalsPage />
      )}

      {tab === 'consultation' && (
        <ConsultationPage />
      )}
    </div>
  );
}
