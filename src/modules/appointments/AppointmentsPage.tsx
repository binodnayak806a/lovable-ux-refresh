import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ChevronLeft, ChevronRight, Plus, Filter, RefreshCw,
  CalendarDays, LayoutGrid,
  Calendar as CalendarIcon, Columns3, Grid3X3,
} from 'lucide-react';
import {
  format, startOfWeek, addDays, addWeeks, subWeeks,
  addMonths, subMonths, startOfMonth, endOfMonth,
  subDays,
} from 'date-fns';
import { Button } from '../../components/ui/button';

import { Skeleton } from '../../components/ui/skeleton';
import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/popover';
import { Checkbox } from '../../components/ui/checkbox';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../../components/ui/select';
import { useHospitalId } from '../../hooks/useHospitalId';
import { usePageTitle } from '../../hooks/usePageTitle';
import { useAppSelector } from '../../store';
import { useRealtime } from '../../hooks/useRealtime';
import appointmentsService, {
  type WeekAppointment,
  type DoctorOption,
} from '../../services/appointments.service';

import DayViewCalendar from './components/DayViewCalendar';
import WeekViewCalendar from './components/WeekViewCalendar';
import MonthViewCalendar from './components/MonthViewCalendar';
import PatientQueueSidebar from './components/PatientQueueSidebar';
import QueueKanban from './components/QueueKanban';
import CreateAppointmentDialog from './components/CreateAppointmentDialog';
import CasePaperPrint from './components/CasePaperPrint';
import { cn } from '../../lib/utils';

type CalendarView = 'day' | 'week' | 'month';
type ViewMode = 'calendar' | 'kanban';

const SLOT_INTERVALS = [
  { value: '10', label: '10 Min' },
  { value: '15', label: '15 Min' },
  { value: '20', label: '20 Min' },
  { value: '30', label: '30 Min' },
  { value: '60', label: '1 Hour' },
];

export default function AppointmentsPage() {
  usePageTitle('Appointments');
  const hospitalId = useHospitalId();
  const user = useAppSelector(s => s.auth.user);
  const userId = user?.id ?? '';
  const userRole = user?.role ?? '';

  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [calendarView, setCalendarView] = useState<CalendarView>('day');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [slotInterval, setSlotInterval] = useState(10);
  const [appointments, setAppointments] = useState<WeekAppointment[]>([]);
  const [doctors, setDoctors] = useState<DoctorOption[]>([]);
  const [selectedDoctors, setSelectedDoctors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [prefillDate, setPrefillDate] = useState<Date | undefined>();
  const [prefillTime, setPrefillTime] = useState<string | undefined>();
  const [casePaperAppt, setCasePaperAppt] = useState<WeekAppointment | null>(null);

  const dateRange = useMemo(() => {
    if (calendarView === 'day') {
      return { start: format(currentDate, 'yyyy-MM-dd'), end: format(currentDate, 'yyyy-MM-dd') };
    }
    if (calendarView === 'week') {
      const ws = startOfWeek(currentDate, { weekStartsOn: 0 });
      return { start: format(ws, 'yyyy-MM-dd'), end: format(addDays(ws, 6), 'yyyy-MM-dd') };
    }
    const ms = startOfMonth(currentDate);
    const me = endOfMonth(currentDate);
    const calStart = startOfWeek(ms, { weekStartsOn: 0 });
    const calEnd = addDays(startOfWeek(me, { weekStartsOn: 0 }), 6);
    return { start: format(calStart, 'yyyy-MM-dd'), end: format(calEnd, 'yyyy-MM-dd') };
  }, [currentDate, calendarView]);

  const weekStart = useMemo(() => startOfWeek(currentDate, { weekStartsOn: 0 }), [currentDate]);
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

  const fetchAppointments = useCallback(async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true);
    try {
      const data = await appointmentsService.getWeekAppointments(
        hospitalId, dateRange.start, dateRange.end,
        selectedDoctors.length > 0 ? selectedDoctors : undefined
      );
      setAppointments(data);
    } catch { /* */ } finally { setLoading(false); setRefreshing(false); }
  }, [hospitalId, dateRange.start, dateRange.end, selectedDoctors]);

  const fetchDoctors = useCallback(async () => {
    try { const data = await appointmentsService.getDoctors(hospitalId); setDoctors(data); } catch { /* */ }
  }, [hospitalId]);

  useEffect(() => { fetchDoctors(); }, [fetchDoctors]);
  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);
  useRealtime({ table: 'appointments', filter: `hospital_id=eq.${hospitalId}` }, () => fetchAppointments(true));

  const nav = (dir: 'prev' | 'next') => {
    setCurrentDate(d => {
      if (calendarView === 'day') return dir === 'prev' ? subDays(d, 1) : addDays(d, 1);
      if (calendarView === 'week') return dir === 'prev' ? subWeeks(d, 1) : addWeeks(d, 1);
      return dir === 'prev' ? subMonths(d, 1) : addMonths(d, 1);
    });
  };

  const handleSlotClick = (date: Date, time: string) => { setPrefillDate(date); setPrefillTime(time); setDialogOpen(true); };
  const handleNewAppointment = () => { setPrefillDate(undefined); setPrefillTime(undefined); setDialogOpen(true); };

  // Keyboard shortcut: N to create new appointment (when no input is focused)
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'n' && !dialogOpen && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement)) {
        e.preventDefault();
        handleNewAppointment();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [dialogOpen]);

  const handleStatusChange = async (id: string, status: string) => {
    try { await appointmentsService.updateStatus(id, status); setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a)); } catch { /* */ }
  };

  const toggleDoctor = (id: string) => {
    setSelectedDoctors(prev => prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]);
  };

  const dateLabel = useMemo(() => {
    if (calendarView === 'day') return format(currentDate, 'EEEE, MMMM d, yyyy');
    if (calendarView === 'week') {
      const ws = startOfWeek(currentDate, { weekStartsOn: 0 });
      return `${format(ws, 'MMM d')} – ${format(addDays(ws, 6), 'MMM d, yyyy')}`;
    }
    return format(currentDate, 'MMMM yyyy');
  }, [currentDate, calendarView]);

  const VIEW_OPTIONS = [
    { key: 'day' as const, icon: CalendarIcon, label: 'Day' },
    { key: 'month' as const, icon: Grid3X3, label: 'Month' },
    { key: 'week' as const, icon: Columns3, label: 'Week' },
    { key: 'kanban' as const, icon: LayoutGrid, label: 'Board' },
  ];

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Single clean toolbar */}
      <div className="shrink-0 bg-card border-b border-border/40 px-4 py-2.5 flex items-center justify-between gap-3">
        {/* Left: Navigation */}
        <div className="flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-primary shrink-0" />

          <button onClick={() => nav('prev')} className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="text-sm font-semibold text-foreground min-w-[160px] text-center select-none">
            {dateLabel}
          </span>

          <button onClick={() => nav('next')} className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => setCurrentDate(new Date())}
            className="h-7 px-2.5 rounded-md text-[11px] font-semibold text-primary bg-primary/8 hover:bg-primary/15 transition-colors"
          >
            Today
          </button>

          <div className="w-px h-5 bg-border/50 mx-1" />

          <button onClick={() => fetchAppointments(true)} className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors" disabled={refreshing}>
            <RefreshCw className={cn('w-3.5 h-3.5', refreshing && 'animate-spin')} />
          </button>
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-2">
          {/* Slot interval (only for day/week) */}
          {calendarView !== 'month' && viewMode === 'calendar' && (
            <Select value={String(slotInterval)} onValueChange={v => setSlotInterval(Number(v))}>
              <SelectTrigger className="h-7 w-[88px] text-[11px] border-border/40 bg-muted/30 rounded-md">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SLOT_INTERVALS.map(s => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Doctor filter */}
          <Popover open={filterOpen} onOpenChange={setFilterOpen}>
            <PopoverTrigger asChild>
              <button className={cn(
                'h-7 px-2.5 rounded-md flex items-center gap-1.5 text-[11px] font-medium transition-colors',
                selectedDoctors.length > 0 ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}>
                <Filter className="w-3 h-3" />
                <span className="hidden sm:inline">Filter</span>
                {selectedDoctors.length > 0 && (
                  <span className="bg-primary text-primary-foreground text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {selectedDoctors.length}
                  </span>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-0" align="end">
              <div className="px-3 py-2 border-b border-border/40 flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground">Doctors</span>
                {selectedDoctors.length > 0 && (
                  <button onClick={() => setSelectedDoctors([])} className="text-[10px] text-primary hover:underline">Clear</button>
                )}
              </div>
              <div className="max-h-56 overflow-y-auto p-1 scrollbar-thin">
                {doctors.map(doc => (
                  <label key={doc.id} className={cn(
                    'flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs cursor-pointer transition-colors',
                    selectedDoctors.includes(doc.id) ? 'bg-primary/5 text-primary' : 'text-foreground hover:bg-muted/50'
                  )}>
                    <Checkbox checked={selectedDoctors.includes(doc.id)} onCheckedChange={() => toggleDoctor(doc.id)} className="h-3.5 w-3.5" />
                    <span className="truncate">{doc.full_name}</span>
                  </label>
                ))}
                {doctors.length === 0 && <p className="text-xs text-muted-foreground text-center py-3">No doctors</p>}
              </div>
            </PopoverContent>
          </Popover>

          <div className="w-px h-5 bg-border/50" />

          {/* View toggle */}
          <div className="flex items-center bg-muted/40 rounded-lg p-0.5 gap-0.5">
            {VIEW_OPTIONS.map(v => {
              const isActive = v.key === 'kanban' ? viewMode === 'kanban' : (viewMode === 'calendar' && calendarView === v.key);
              return (
                <button
                  key={v.key}
                  onClick={() => {
                    if (v.key === 'kanban') { setViewMode('kanban'); } else { setViewMode('calendar'); setCalendarView(v.key); }
                  }}
                  className={cn(
                    'h-7 px-2 rounded-md flex items-center gap-1.5 text-[11px] font-medium transition-all',
                    isActive ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                  )}
                  title={v.label}
                >
                  <v.icon className="w-3.5 h-3.5" />
                  <span className="hidden xl:inline">{v.label}</span>
                </button>
              );
            })}
          </div>

          <div className="w-px h-5 bg-border/50" />

          <Button size="sm" onClick={handleNewAppointment} className="h-7 gap-1.5 text-[11px] px-3 rounded-lg" title="New Appointment (N)">
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New</span>
            <kbd className="hidden lg:inline ml-1 text-[9px] opacity-60 font-mono">N</kbd>
          </Button>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'calendar' ? (
        <div className="flex-1 flex min-h-0 overflow-hidden">
          <div className="hidden lg:flex w-[300px] shrink-0 border-r border-border/30 overflow-hidden">
            {loading ? <QueueSkeleton /> : (
              <PatientQueueSidebar appointments={appointments} onStatusChange={handleStatusChange} />
            )}
          </div>
          <div className="flex-1 overflow-auto p-3">
            {loading ? <CalendarSkeleton view={calendarView} /> : (
              <>
                {calendarView === 'day' && (
                  <DayViewCalendar appointments={appointments} date={currentDate} slotInterval={slotInterval} onSlotClick={handleSlotClick} onAppointmentClick={() => {}} />
                )}
                {calendarView === 'week' && (
                  <WeekViewCalendar appointments={appointments} weekDays={weekDays} slotInterval={slotInterval} onSlotClick={handleSlotClick} onAppointmentClick={() => {}} />
                )}
                {calendarView === 'month' && (
                  <MonthViewCalendar appointments={appointments} currentDate={currentDate} onDayClick={(day) => { setCurrentDate(day); setCalendarView('day'); }} />
                )}
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-auto p-3">
          {loading ? <KanbanSkeleton /> : (
            <QueueKanban appointments={appointments} onStatusChange={handleStatusChange} onPrintCasePaper={setCasePaperAppt} />
          )}
        </div>
      )}

      <CreateAppointmentDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onSuccess={() => fetchAppointments(true)}
        hospitalId={hospitalId} userId={userId} userRole={userRole} doctors={doctors} prefillDate={prefillDate} prefillTime={prefillTime} />

      {casePaperAppt && (
        <CasePaperPrint appointment={casePaperAppt} hospitalName="Hospital" onClose={() => setCasePaperAppt(null)} />
      )}
    </div>
  );
}

function CalendarSkeleton({ view }: { view?: CalendarView }) {
  return (
    <div className="glass-card overflow-hidden animate-pulse">
      {view === 'month' ? (
        <div className="grid grid-cols-7 gap-px">{Array.from({ length: 35 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
      ) : (
        Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex border-b border-border/10 min-h-[48px]">
            <Skeleton className="w-[72px]" /><Skeleton className="flex-1 m-0.5" />
          </div>
        ))
      )}
    </div>
  );
}

function QueueSkeleton() {
  return (
    <div className="flex-1 p-4 space-y-3">
      <Skeleton className="h-5 w-28" />
      <div className="grid grid-cols-4 gap-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-9 rounded-lg" />)}</div>
      <Skeleton className="h-8 w-full rounded-lg" />
      <div className="space-y-2 mt-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2.5"><Skeleton className="w-8 h-8 rounded-lg" /><div className="flex-1"><Skeleton className="h-3 w-20 mb-1" /><Skeleton className="h-2.5 w-28" /></div></div>
        ))}
      </div>
    </div>
  );
}

function KanbanSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 h-full">
      {Array.from({ length: 3 }).map((_, col) => (
        <div key={col} className="glass-card flex flex-col">
          <div className="px-3 py-2.5 border-b border-border/30"><Skeleton className="h-4 w-16" /></div>
          <div className="p-2 space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-card rounded-lg border border-border/20 p-2.5">
                <div className="flex items-center gap-2"><Skeleton className="w-8 h-8 rounded-lg" /><div className="flex-1"><Skeleton className="h-3 w-20 mb-1" /><Skeleton className="h-2.5 w-28" /></div></div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
