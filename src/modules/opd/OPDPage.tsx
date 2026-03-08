import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  UserPlus, List, Search, RefreshCw, Clock, CheckCircle2,
  XCircle, User, CalendarClock, Stethoscope, Activity,
  ChevronLeft, ChevronRight, AlertTriangle, Play,
  Ban, FileText, Printer,
  CalendarDays, Ticket,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/popover';
import { Calendar } from '../../components/ui/calendar';
import { usePageTitle } from '../../hooks/usePageTitle';
import { Skeleton } from '../../components/ui/skeleton';
import { useAppSelector } from '../../store';
import { useToast } from '../../hooks/useToast';
import { mockStore } from '../../lib/mockStore';
import PatientRegistrationForm from './components/PatientRegistrationForm';
import VitalsPage from './vitals/VitalsPage';
import ConsultationPage from './consultation/ConsultationPage';
import PatientStickerPrint from '../patients/components/PatientStickerPrint';
import { useDebounce } from '../../hooks/useDebounce';
import { format } from 'date-fns';
import { cn } from '../../lib/utils';

const SAMPLE_HOSPITAL_ID = '11111111-1111-1111-1111-111111111111';

type Tab = 'queue' | 'register' | 'vitals' | 'consultation';

const TAB_CONFIG: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'queue', label: "Today's Queue", icon: List },
  { id: 'register', label: 'Register Patient', icon: UserPlus },
  { id: 'vitals', label: 'Record Vitals', icon: Activity },
  { id: 'consultation', label: 'Consultation', icon: Stethoscope },
];

const STATUS_STYLES: Record<string, { label: string; bg: string; text: string; icon: React.ElementType }> = {
  scheduled: { label: 'Scheduled', bg: 'bg-blue-50', text: 'text-blue-700', icon: Clock },
  confirmed: { label: 'Confirmed', bg: 'bg-emerald-50', text: 'text-emerald-700', icon: CheckCircle2 },
  in_progress: { label: 'In Progress', bg: 'bg-amber-50', text: 'text-amber-700', icon: Stethoscope },
  completed: { label: 'Completed', bg: 'bg-muted', text: 'text-muted-foreground', icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', bg: 'bg-red-50', text: 'text-red-600', icon: XCircle },
  no_show: { label: 'No Show', bg: 'bg-orange-50', text: 'text-orange-600', icon: AlertTriangle },
};

interface AppointmentRow {
  id: string;
  patient_id: string;
  patient_name: string;
  patient_uhid: string;
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

function OpdStat({ label, value, icon: Icon, iconBg, iconColor }: {
  label: string; value: number; icon: React.ElementType; iconBg: string; iconColor: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border/60 bg-card px-4 py-3.5 shadow-sm hover:shadow-md transition-shadow">
      <div>
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">{label}</p>
        <p className="text-2xl font-bold text-foreground mt-0.5 tabular-nums">{value}</p>
      </div>
      <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', iconBg)}>
        <Icon className={cn('w-4.5 h-4.5', iconColor)} />
      </div>
    </div>
  );
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
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ scheduled: 0, inProgress: 0, completed: 0, total: 0 });
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [stickerPatient, setStickerPatient] = useState<{ full_name: string; uhid: string; age?: number; gender?: string; phone: string; blood_group?: string | null } | null>(null);
  const [stickerSize, setStickerSize] = useState<'thermal' | 'a4'>('thermal');

  const search = useDebounce(searchInput, 350);
  const dateStr = format(selectedDate, 'yyyy-MM-dd');

  const loadMockAppointments = useCallback(() => {
    setLoading(true);
    setTimeout(() => {
      const allAppts = mockStore.getAppointments(hospitalId, dateStr, statusFilter === 'all' ? undefined : statusFilter);
      
      let rows: AppointmentRow[] = allAppts.map(a => ({
        id: a.id,
        patient_id: a.patient_id,
        patient_name: mockStore.getPatientName(a.patient_id),
        patient_uhid: mockStore.getPatientById(a.patient_id)?.uhid ?? '',
        doctor_name: mockStore.getDoctorName(a.doctor_id),
        appointment_date: a.appointment_date,
        appointment_time: a.appointment_time,
        type: a.type,
        status: a.status,
        chief_complaint: a.chief_complaint,
      }));

      if (typeFilter && typeFilter !== 'all') {
        rows = rows.filter(r => r.type === typeFilter);
      }

      if (search) {
        const q = search.toLowerCase();
        rows = rows.filter(r =>
          r.patient_name.toLowerCase().includes(q) ||
          r.doctor_name.toLowerCase().includes(q) ||
          r.patient_uhid.toLowerCase().includes(q)
        );
      }

      setAppointments(rows);

      const allForStats = mockStore.getAppointments(hospitalId, dateStr);
      setStats({
        total: allForStats.length,
        scheduled: allForStats.filter(a => a.status === 'scheduled').length,
        inProgress: allForStats.filter(a => a.status === 'in_progress').length,
        completed: allForStats.filter(a => a.status === 'completed').length,
      });

      setLoading(false);
    }, 200);
  }, [hospitalId, dateStr, statusFilter, typeFilter, search]);

  useEffect(() => { if (tab === 'queue') loadMockAppointments(); }, [tab, loadMockAppointments]);

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

  const pending = Math.max(0, stats.total - stats.completed - stats.inProgress);

  const handleStartConsultation = (appt: AppointmentRow) => {
    mockStore.updateAppointmentStatus(appt.id, 'in_progress');
    setSelectedPatientId(appt.patient_id);
    setSelectedAppointmentId(appt.id);
    setTab('consultation');
  };

  const handleRecordVitals = (_appt: AppointmentRow) => {
    setTab('vitals');
  };

  const handlePrintSticker = (appt: AppointmentRow) => {
    const patient = mockStore.getPatientById(appt.patient_id);
    if (patient) {
      setStickerPatient({
        full_name: patient.full_name,
        uhid: patient.uhid,
        age: patient.age ?? undefined,
        gender: patient.gender,
        phone: patient.phone,
        blood_group: patient.blood_group,
      });
    }
  };

  const handleCancelAppointment = (appt: AppointmentRow) => {
    mockStore.updateAppointmentStatus(appt.id, 'cancelled');
    loadMockAppointments();
    toast('Appointment cancelled', { type: 'success' });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-56px)] bg-background">
      {/* ═══════ HEADER ═══════ */}
      <div className="bg-card border-b border-border">
        <div className="px-6 pt-5 pb-4">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center shadow-sm">
                <Stethoscope className="w-5.5 h-5.5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground tracking-tight">OPD Management</h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Outpatient Department — {format(selectedDate, 'EEEE, d MMMM yyyy')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                className="h-8 gap-1.5 text-xs shadow-sm"
                style={{ backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
                onClick={() => setTab('register')}
              >
                <UserPlus className="w-3.5 h-3.5" />
                Add Patient
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8 gap-1.5 text-xs border-primary/30 text-primary hover:bg-primary/5"
                onClick={() => navigate('/appointments')}
              >
                <CalendarClock className="w-3.5 h-3.5" />
                Add Appointment
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-1 border-b border-border -mx-6 px-6">
            {TAB_CONFIG.map(t => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={cn(
                    'flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
                    active
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {tab === 'queue' && (
          <div className="px-6 pb-4 pt-1">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <OpdStat label="Today's Total" value={stats.total} icon={CalendarClock} iconBg="bg-primary/10" iconColor="text-primary" />
              <OpdStat label="In Progress" value={stats.inProgress} icon={Stethoscope} iconBg="bg-amber-50" iconColor="text-amber-600" />
              <OpdStat label="Completed" value={stats.completed} icon={CheckCircle2} iconBg="bg-emerald-50" iconColor="text-emerald-600" />
              <OpdStat label="Pending" value={pending} icon={Clock} iconBg="bg-muted" iconColor="text-muted-foreground" />
            </div>
          </div>
        )}
      </div>

      {/* ═══════ CONTENT ═══════ */}
      {tab === 'queue' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 py-2.5 border-b border-border bg-card/80 backdrop-blur-sm flex items-center gap-3 flex-wrap">
            <h2 className="text-sm font-semibold text-foreground whitespace-nowrap">Today's Appointments</h2>

            <div className="flex items-center gap-0.5 bg-muted/50 rounded-lg p-0.5">
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-md" onClick={() => navigateDate(-1)}>
                <ChevronLeft className="w-3.5 h-3.5" />
              </Button>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5 px-2.5 rounded-md font-medium">
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
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-md" onClick={() => navigateDate(1)}>
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs px-2.5 font-medium text-primary hover:bg-primary/5"
              onClick={() => setSelectedDate(new Date())}
            >
              Today
            </Button>

            <div className="h-5 w-px bg-border" />

            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search patient, doctor"
                className="h-7 pl-8 text-xs w-52 bg-muted/30 border-border/60 focus:bg-card"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-7 w-[110px] text-xs bg-muted/30 border-border/60">
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
              <SelectTrigger className="h-7 w-[110px] text-xs bg-muted/30 border-border/60">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="opd">OPD</SelectItem>
                <SelectItem value="follow_up">Follow-Up</SelectItem>
                <SelectItem value="emergency">Emergency</SelectItem>
              </SelectContent>
            </Select>

            <div className="ml-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={loadMockAppointments}
                disabled={loading}
                className="h-7 w-7 p-0 border-border/60"
              >
                <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            {loading ? (
              <div className="p-6 space-y-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 animate-pulse">
                    <Skeleton className="w-9 h-9 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-3.5 w-44 rounded" />
                      <Skeleton className="h-3 w-28 rounded" />
                    </div>
                    <Skeleton className="h-6 w-24 rounded-full" />
                  </div>
                ))}
              </div>
            ) : appointments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
                <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                  <CalendarClock className="w-8 h-8 opacity-30" />
                </div>
                <p className="text-sm font-semibold text-foreground">No appointments found</p>
                <p className="text-xs mt-1 text-muted-foreground">Register a patient or create an appointment to get started</p>
                <div className="flex gap-2 mt-5">
                  <Button size="sm" className="gap-1.5 text-xs" onClick={() => setTab('register')}>
                    <UserPlus className="w-3.5 h-3.5" /> Register Patient
                  </Button>
                </div>
              </div>
            ) : (
              <table className="w-full text-xs">
                <thead className="bg-muted/40 sticky top-0 z-10">
                  <tr className="border-b border-border">
                    {['#', 'Patient', 'UHID', 'Doctor', 'Time', 'Type', 'Chief Complaint', 'Status', 'Actions'].map(col => (
                      <th key={col} className={cn(
                        'py-2.5 px-4 font-semibold text-muted-foreground uppercase tracking-wider text-[10px]',
                        col === 'Actions' ? 'text-center' : 'text-left'
                      )}>
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((appt, idx) => {
                    const initials = appt.patient_name.split(' ').slice(0, 2).map(n => n[0]).join('');
                    const cfg = STATUS_STYLES[appt.status] ?? STATUS_STYLES.scheduled;
                    const StatusIcon = cfg.icon;
                    return (
                      <tr
                        key={appt.id}
                        className="border-b border-border/40 hover:bg-primary/[0.02] transition-colors group"
                      >
                        <td className="py-3 px-4 text-muted-foreground font-mono text-[11px]">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-primary/8 flex items-center justify-center text-primary font-bold text-[10px] shrink-0 ring-1 ring-primary/10">
                              {initials}
                            </div>
                            <span className="font-semibold text-foreground">{appt.patient_name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-mono text-[10px] bg-muted/60 px-1.5 py-0.5 rounded text-muted-foreground">{appt.patient_uhid}</span>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <User className="w-3 h-3 opacity-50" />
                            {appt.doctor_name}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-medium text-foreground tabular-nums">
                          {formatTime(appt.appointment_time)}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-border/60 capitalize font-normal">
                            {appt.type?.replace('_', ' ') || '---'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 max-w-[180px] truncate text-muted-foreground">
                          {appt.chief_complaint || <span className="opacity-40">---</span>}
                        </td>
                        <td className="py-3 px-4">
                          <span className={cn('inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full', cfg.bg, cfg.text)}>
                            <StatusIcon className="w-3 h-3" />
                            {cfg.label}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <TooltipProvider delayDuration={150}>
                            <div className="flex items-center justify-center gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button onClick={() => handleStartConsultation(appt)} className="w-6 h-6 rounded-md flex items-center justify-center text-emerald-600 hover:bg-emerald-50 transition-colors">
                                    <Play className="w-3.5 h-3.5" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="text-[10px] px-2 py-1">Start Consultation</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button onClick={() => handleRecordVitals(appt)} className="w-6 h-6 rounded-md flex items-center justify-center text-amber-600 hover:bg-amber-50 transition-colors">
                                    <Activity className="w-3.5 h-3.5" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="text-[10px] px-2 py-1">Record Vitals</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button onClick={() => handlePrintSticker(appt)} className="w-6 h-6 rounded-md flex items-center justify-center text-primary hover:bg-primary/10 transition-colors">
                                    <Ticket className="w-3.5 h-3.5" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="text-[10px] px-2 py-1">Print Sticker</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button className="w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors">
                                    <FileText className="w-3.5 h-3.5" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="text-[10px] px-2 py-1">Prescription</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button className="w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors">
                                    <Printer className="w-3.5 h-3.5" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="text-[10px] px-2 py-1">Print</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button onClick={() => handleCancelAppointment(appt)} className="w-6 h-6 rounded-md flex items-center justify-center text-destructive/70 hover:bg-destructive/5 transition-colors">
                                    <Ban className="w-3.5 h-3.5" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="text-[10px] px-2 py-1">Cancel</TooltipContent>
                              </Tooltip>
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

          {appointments.length > 0 && (
            <div className="border-t border-border bg-card px-6 py-2 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Showing {appointments.length} appointments</span>
              <span className="text-muted-foreground tabular-nums">{format(selectedDate, 'dd MMM yyyy')}</span>
            </div>
          )}
        </div>
      )}

      {tab === 'register' && (
        <div className="flex-1 overflow-auto p-6">
          <PatientRegistrationForm
            onSuccess={() => { setTab('queue'); loadMockAppointments(); }}
            onCancel={() => setTab('queue')}
          />
        </div>
      )}

      {tab === 'vitals' && (
        <div className="flex-1 overflow-auto p-6">
          <VitalsPage />
        </div>
      )}

      {tab === 'consultation' && (
        <div className="flex-1 overflow-auto p-6">
          <ConsultationPage />
        </div>
      )}

      {stickerPatient && (
        <PatientStickerPrint
          patient={stickerPatient}
          onClose={() => setStickerPatient(null)}
          stickerSize={stickerSize}
          onSizeChange={setStickerSize}
        />
      )}
    </div>
  );
}
