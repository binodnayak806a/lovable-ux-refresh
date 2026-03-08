import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  UserPlus, List, Search, RefreshCw, Clock, CheckCircle2,
  XCircle, User, CalendarClock, Stethoscope, Activity,
  ChevronLeft, ChevronRight, AlertTriangle, Play, Eye,
  MoreVertical, Ban, FileText, Printer,
  CalendarDays,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/popover';
import { Calendar } from '../../components/ui/calendar';
import { usePageTitle } from '../../hooks/usePageTitle';
import SharedStatCard from '../../components/shared/StatCard';
import { Skeleton } from '../../components/ui/skeleton';
import { useAppSelector } from '../../store';
import { useToast } from '../../hooks/useToast';
import dashboardService from '../../services/dashboard.service';
import PatientRegistrationForm from './components/PatientRegistrationForm';
import VitalsPage from './vitals/VitalsPage';
import ConsultationPage from './consultation/ConsultationPage';
import { useDebounce } from '../../hooks/useDebounce';
import { format } from 'date-fns';
import { cn } from '../../lib/utils';

const SAMPLE_HOSPITAL_ID = '11111111-1111-1111-1111-111111111111';

type Tab = 'queue' | 'register' | 'vitals' | 'consultation';

const STATUS_STYLES: Record<string, { label: string; cls: string; icon: React.ElementType }> = {
  scheduled: { label: 'Scheduled', cls: 'bg-blue-50 text-blue-700 border-blue-100', icon: Clock },
  confirmed: { label: 'Confirmed', cls: 'bg-emerald-50 text-emerald-700 border-emerald-100', icon: CheckCircle2 },
  in_progress: { label: 'In Progress', cls: 'bg-amber-50 text-amber-700 border-amber-100', icon: Stethoscope },
  completed: { label: 'Completed', cls: 'bg-muted text-muted-foreground border-border', icon: CheckCircle2 },
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
  const navigate = useNavigate();
  const { user } = useAppSelector((s) => s.auth);
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();

  const hospitalId = user?.hospital_id ?? SAMPLE_HOSPITAL_ID;
  const registeredUhid = searchParams.get('registered');

  const [tab, setTab] = useState<Tab>('queue');
  const [appointments, setAppointments] = useState<AppointmentRow[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [_doctorFilter, setDoctorFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ scheduled: 0, inProgress: 0, completed: 0, total: 0 });
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const search = useDebounce(searchInput, 350);
  const limit = 15;
  const dateStr = format(selectedDate, 'yyyy-MM-dd');

  const loadAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await dashboardService.getAppointments(hospitalId, {
        dateFrom: dateStr,
        dateTo: dateStr,
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
  }, [hospitalId, dateStr, statusFilter, search, page, limit]);

  const loadStats = useCallback(async () => {
    try {
      const [all, prog, done] = await Promise.all([
        dashboardService.getAppointments(hospitalId, { dateFrom: dateStr, dateTo: dateStr, limit: 1 }),
        dashboardService.getAppointments(hospitalId, { dateFrom: dateStr, dateTo: dateStr, status: 'in_progress', limit: 1 }),
        dashboardService.getAppointments(hospitalId, { dateFrom: dateStr, dateTo: dateStr, status: 'completed', limit: 1 }),
      ]);
      setStats({ scheduled: all.total, inProgress: prog.total, completed: done.total, total: all.total });
    } catch { /* noop */ }
  }, [hospitalId, dateStr]);

  useEffect(() => { if (tab === 'queue') { loadAppointments(); loadStats(); } }, [tab, loadAppointments, loadStats]);
  useEffect(() => { setPage(1); }, [search, statusFilter, doctorFilter, typeFilter]);

  useEffect(() => {
    if (registeredUhid) {
      toast('Registration successful', { description: `Patient UHID: ${registeredUhid}`, type: 'success' });
      setSearchParams({});
    }
  }, [registeredUhid, toast, setSearchParams]);

  const navigateDate = (delta: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + delta);
    setSelectedDate(d);
  };

  const pending = stats.total - stats.completed - stats.inProgress;

  return (
    <div className="flex flex-col h-[calc(100vh-56px)] bg-background">
      {/* ── Header Bar ── */}
      <div className="border-b border-border bg-card">
        {/* Title + Tabs row */}
        <div className="px-5 pt-4 pb-0 flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Stethoscope className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground leading-tight">OPD Management</h1>
              <p className="text-xs text-muted-foreground">
                Outpatient Department — {format(selectedDate, 'EEEE, d MMMM yyyy')}
              </p>
            </div>
          </div>

          <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)} className="sm:ml-4">
            <TabsList className="h-9 p-0.5 bg-muted/50 rounded-lg">
              <TabsTrigger value="queue" className="gap-1.5 text-xs h-8 rounded-md data-[state=active]:shadow-sm px-3">
                <List className="w-3.5 h-3.5" />
                Today's Queue
              </TabsTrigger>
              <TabsTrigger value="register" className="gap-1.5 text-xs h-8 rounded-md data-[state=active]:shadow-sm px-3">
                <UserPlus className="w-3.5 h-3.5" />
                Register Patient
              </TabsTrigger>
              <TabsTrigger value="vitals" className="gap-1.5 text-xs h-8 rounded-md data-[state=active]:shadow-sm px-3">
                <Activity className="w-3.5 h-3.5" />
                Record Vitals
              </TabsTrigger>
              <TabsTrigger value="consultation" className="gap-1.5 text-xs h-8 rounded-md data-[state=active]:shadow-sm px-3">
                <Stethoscope className="w-3.5 h-3.5" />
                Consultation
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="sm:ml-auto flex items-center gap-2">
            <Button size="sm" className="h-8 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-xs" onClick={() => setTab('register')}>
              <UserPlus className="w-3.5 h-3.5" />
              Add Patient
            </Button>
            <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs border-primary text-primary hover:bg-primary/5" onClick={() => navigate('/appointments')}>
              <CalendarClock className="w-3.5 h-3.5" />
              Add Appointment
            </Button>
          </div>
        </div>

        {/* Stats strip */}
        {tab === 'queue' && (
          <div className="px-5 py-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <SharedStatCard label="TODAY'S TOTAL" value={stats.total} icon={CalendarClock} iconClassName="bg-primary/10 text-primary" accentColor="blue" />
              <SharedStatCard label="IN PROGRESS" value={stats.inProgress} icon={Stethoscope} iconClassName="bg-amber-50 text-amber-600" accentColor="amber" />
              <SharedStatCard label="COMPLETED" value={stats.completed} icon={CheckCircle2} iconClassName="bg-emerald-50 text-emerald-600" accentColor="green" />
              <SharedStatCard label="PENDING" value={pending < 0 ? 0 : pending} icon={Clock} iconClassName="bg-muted text-muted-foreground" />
            </div>
          </div>
        )}
      </div>

      {/* ── Content ── */}
      {tab === 'queue' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Filter bar */}
          <div className="px-5 py-2.5 border-b border-border bg-card flex items-center gap-2 flex-wrap">
            <h2 className="text-sm font-semibold text-foreground mr-2">Today's Appointments</h2>

            {/* Date nav */}
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => navigateDate(-1)}>
                <ChevronLeft className="w-3.5 h-3.5" />
              </Button>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-7 text-xs gap-1 px-2">
                    <CalendarDays className="w-3.5 h-3.5" />
                    {format(selectedDate, 'dd MMM yyyy')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(d) => d && setSelectedDate(d)}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => navigateDate(1)}>
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
              <Button variant="ghost" size="sm" className="h-7 text-xs px-2" onClick={() => setSelectedDate(new Date())}>
                Today
              </Button>
            </div>

            <div className="h-5 w-px bg-border" />

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search patient, doctor…"
                className="h-7 pl-8 text-xs w-48"
              />
            </div>

            {/* Filters */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-7 w-[120px] text-xs">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {Object.entries(STATUS_STYLES).map(([key, cfg]) => (
                  <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="h-7 w-[120px] text-xs">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="walk_in">Walk-In</SelectItem>
                <SelectItem value="follow_up">Follow-Up</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="emergency">Emergency</SelectItem>
              </SelectContent>
            </Select>

            <div className="ml-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => { loadAppointments(); loadStats(); }}
                disabled={loading}
                className="h-7 w-7 p-0"
              >
                <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
              </Button>
            </div>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-auto">
            {loading ? (
              <div className="p-5 space-y-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="w-8 h-8 rounded-full" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3.5 w-40" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </div>
                ))}
              </div>
            ) : appointments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <CalendarClock className="w-12 h-12 mb-3 opacity-20" />
                <p className="text-sm font-medium">No appointments found</p>
                <p className="text-xs mt-1">Register a patient or create an appointment</p>
                <div className="flex gap-2 mt-4">
                  <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => setTab('register')}>
                    <UserPlus className="w-3.5 h-3.5" /> Register Patient
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => navigate('/appointments')}>
                    <CalendarClock className="w-3.5 h-3.5" /> New Appointment
                  </Button>
                </div>
              </div>
            ) : (
              <table className="w-full text-xs">
                <thead className="bg-muted/60 sticky top-0 z-10">
                  <tr className="border-b border-border">
                    <th className="py-2.5 px-4 text-left font-semibold text-muted-foreground uppercase tracking-wider">#</th>
                    <th className="py-2.5 px-4 text-left font-semibold text-muted-foreground uppercase tracking-wider">Patient</th>
                    <th className="py-2.5 px-4 text-left font-semibold text-muted-foreground uppercase tracking-wider">Doctor</th>
                    <th className="py-2.5 px-4 text-left font-semibold text-muted-foreground uppercase tracking-wider">Time</th>
                    <th className="py-2.5 px-4 text-left font-semibold text-muted-foreground uppercase tracking-wider">Type</th>
                    <th className="py-2.5 px-4 text-left font-semibold text-muted-foreground uppercase tracking-wider">Chief Complaint</th>
                    <th className="py-2.5 px-4 text-left font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="py-2.5 px-4 text-center font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((appt, idx) => {
                    const initials = appt.patient_name.split(' ').slice(0, 2).map((n) => n[0]).join('');
                    const cfg = STATUS_STYLES[appt.status] ?? STATUS_STYLES.scheduled;
                    const StatusIcon = cfg.icon;
                    return (
                      <tr key={appt.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="py-2.5 px-4 text-muted-foreground font-medium">
                          {(page - 1) * limit + idx + 1}
                        </td>
                        <td className="py-2.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-[10px] shrink-0">
                              {initials}
                            </div>
                            <div>
                              <div className="font-semibold text-foreground">{appt.patient_name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <User className="w-3 h-3 text-muted-foreground" />
                            <span>{appt.doctor_name || 'Unassigned'}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-4 font-medium">
                          {formatTime(appt.appointment_time)}
                        </td>
                        <td className="py-2.5 px-4">
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-border capitalize font-normal">
                            {appt.type?.replace('_', ' ') || '---'}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-4 max-w-[200px] truncate text-muted-foreground">
                          {appt.chief_complaint || '---'}
                        </td>
                        <td className="py-2.5 px-4">
                          <Badge className={cn('text-[10px] border gap-1 px-2 py-0.5 font-medium', cfg.cls)}>
                            <StatusIcon className="w-3 h-3" />
                            {cfg.label}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-4">
                          <TooltipProvider delayDuration={200}>
                            <div className="flex items-center justify-center gap-0.5">
                              {[
                                { icon: Play, tip: 'Start Consultation', color: 'text-emerald-600 hover:bg-emerald-50' },
                                { icon: Eye, tip: 'View Details', color: 'text-primary hover:bg-primary/10' },
                                { icon: Activity, tip: 'Record Vitals', color: 'text-amber-600 hover:bg-amber-50' },
                                { icon: FileText, tip: 'Prescription', color: 'text-muted-foreground hover:bg-muted' },
                                { icon: Printer, tip: 'Print', color: 'text-muted-foreground hover:bg-muted' },
                                { icon: Ban, tip: 'Cancel', color: 'text-red-500 hover:bg-red-50' },
                              ].map((act, i) => (
                                <Tooltip key={i}>
                                  <TooltipTrigger asChild>
                                    <button className={cn('w-6 h-6 rounded flex items-center justify-center transition-colors', act.color)}>
                                      <act.icon className="w-3.5 h-3.5" />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="text-[10px]">{act.tip}</TooltipContent>
                                </Tooltip>
                              ))}
                              <button className="w-6 h-6 rounded flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors">
                                <MoreVertical className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </TooltipProvider>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {totalPages >= 1 && appointments.length > 0 && (
            <div className="border-t border-border bg-card px-5 py-2 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">
                  Items per page: {limit}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground">
                  {total > 0 ? `${(page - 1) * limit + 1} – ${Math.min(page * limit, total)} of ${total}` : '0 results'}
                </span>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'register' && (
        <div className="flex-1 overflow-auto p-5">
          <PatientRegistrationForm
            onSuccess={() => { setTab('queue'); loadAppointments(); loadStats(); }}
            onCancel={() => setTab('queue')}
          />
        </div>
      )}

      {tab === 'vitals' && (
        <div className="flex-1 overflow-auto p-5">
          <VitalsPage />
        </div>
      )}

      {tab === 'consultation' && (
        <div className="flex-1 overflow-auto p-5">
          <ConsultationPage />
        </div>
      )}
    </div>
  );
}
