import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ChevronLeft, ChevronRight, Plus, Filter, RefreshCw,
  CalendarDays, Users, Clock, LayoutGrid, CalendarRange,
  Calendar as CalendarIcon, Columns3, Grid3X3,
} from 'lucide-react';
import {
  format, startOfWeek, addDays, addWeeks, subWeeks,
  addMonths, subMonths, startOfMonth, endOfMonth, isToday,
  subDays,
} from 'date-fns';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
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
import PageHeader from '../../components/shared/PageHeader';
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

const HOUR_FORMATS = [
  { value: '12', label: '12 Hour' },
  { value: '24', label: '24 Hour' },
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

  // Compute date range based on view
  const dateRange = useMemo(() => {
    if (calendarView === 'day') {
      return { start: format(currentDate, 'yyyy-MM-dd'), end: format(currentDate, 'yyyy-MM-dd') };
    }
    if (calendarView === 'week') {
      const ws = startOfWeek(currentDate, { weekStartsOn: 0 });
      return { start: format(ws, 'yyyy-MM-dd'), end: format(addDays(ws, 6), 'yyyy-MM-dd') };
    }
    // month
    const ms = startOfMonth(currentDate);
    const me = endOfMonth(currentDate);
    // Extend to full calendar weeks
    const calStart = startOfWeek(ms, { weekStartsOn: 0 });
    const calEnd = addDays(startOfWeek(me, { weekStartsOn: 0 }), 6);
    return { start: format(calStart, 'yyyy-MM-dd'), end: format(calEnd, 'yyyy-MM-dd') };
  }, [currentDate, calendarView]);

  const weekStart = useMemo(
    () => startOfWeek(currentDate, { weekStartsOn: 0 }),
    [currentDate]
  );
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  const fetchAppointments = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const data = await appointmentsService.getWeekAppointments(
        hospitalId, dateRange.start, dateRange.end,
        selectedDoctors.length > 0 ? selectedDoctors : undefined
      );
      setAppointments(data);
    } catch { /* */ } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [hospitalId, dateRange.start, dateRange.end, selectedDoctors]);

  const fetchDoctors = useCallback(async () => {
    try {
      const data = await appointmentsService.getDoctors(hospitalId);
      setDoctors(data);
    } catch { /* */ }
  }, [hospitalId]);

  useEffect(() => { fetchDoctors(); }, [fetchDoctors]);
  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

  useRealtime(
    { table: 'appointments', filter: `hospital_id=eq.${hospitalId}` },
    () => fetchAppointments(true)
  );

  // Navigation
  const navigate = (dir: 'prev' | 'next') => {
    setCurrentDate(d => {
      if (calendarView === 'day') return dir === 'prev' ? subDays(d, 1) : addDays(d, 1);
      if (calendarView === 'week') return dir === 'prev' ? subWeeks(d, 1) : addWeeks(d, 1);
      return dir === 'prev' ? subMonths(d, 1) : addMonths(d, 1);
    });
  };

  const goToday = () => setCurrentDate(new Date());

  const handleSlotClick = (date: Date, time: string) => {
    setPrefillDate(date);
    setPrefillTime(time);
    setDialogOpen(true);
  };

  const handleNewAppointment = () => {
    setPrefillDate(undefined);
    setPrefillTime(undefined);
    setDialogOpen(true);
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await appointmentsService.updateStatus(id, status);
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    } catch { /* */ }
  };

  const toggleDoctor = (id: string) => {
    setSelectedDoctors(prev =>
      prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
    );
  };

  // Date label
  const dateLabel = useMemo(() => {
    if (calendarView === 'day') return format(currentDate, 'EEEE, MMMM d, yyyy');
    if (calendarView === 'week') {
      const ws = startOfWeek(currentDate, { weekStartsOn: 0 });
      return `${format(ws, 'MMM d')} - ${format(addDays(ws, 6), 'MMM d, yyyy')}`;
    }
    return format(currentDate, 'MMMM yyyy');
  }, [currentDate, calendarView]);

  const todayCount = appointments.filter(
    a => a.appointment_date === format(new Date(), 'yyyy-MM-dd')
  ).length;

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Top bar */}
      <div className="shrink-0 border-b border-border/40 bg-card/50 backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-primary" />
              <h1 className="text-lg font-bold text-foreground">Calendar</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick action buttons */}
            <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5 border-border/50">
              Break & Block
            </Button>
            <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5 border-border/50">
              Doctor Availability
            </Button>

            {/* Doctor filter */}
            <Popover open={filterOpen} onOpenChange={setFilterOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className={cn(
                  'h-8 gap-1.5 text-xs',
                  selectedDoctors.length > 0 && 'border-primary/50 bg-primary/5 text-primary'
                )}>
                  <Filter className="w-3.5 h-3.5" />
                  Doctors
                  {selectedDoctors.length > 0 && (
                    <Badge className="ml-1 h-4 px-1 text-[9px] bg-primary">{selectedDoctors.length}</Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-0" align="end">
                <div className="px-3 py-2.5 border-b border-border/50 flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">Filter by Doctor</span>
                  {selectedDoctors.length > 0 && (
                    <Button variant="link" size="sm" onClick={() => setSelectedDoctors([])} className="h-auto p-0 text-xs">
                      Clear all
                    </Button>
                  )}
                </div>
                <div className="max-h-64 overflow-y-auto p-1.5">
                  {doctors.map(doc => (
                    <label key={doc.id} className={cn(
                      'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors',
                      selectedDoctors.includes(doc.id) ? 'bg-primary/5 text-primary' : 'text-foreground hover:bg-muted/50'
                    )}>
                      <Checkbox checked={selectedDoctors.includes(doc.id)} onCheckedChange={() => toggleDoctor(doc.id)} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate text-xs">{doc.full_name}</p>
                        {doc.designation && <p className="text-[10px] text-muted-foreground truncate">{doc.designation}</p>}
                      </div>
                    </label>
                  ))}
                  {doctors.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">No doctors found</p>
                  )}
                </div>
              </PopoverContent>
            </Popover>

            <Button size="sm" onClick={handleNewAppointment} className="h-8 gap-1.5 text-xs">
              <Plus className="w-3.5 h-3.5" />
              New Appointment
            </Button>
          </div>
        </div>

        {/* Secondary toolbar: date nav + view toggles */}
        <div className="flex items-center justify-between px-4 pb-3">
          <div className="flex items-center gap-2">
            {/* Date navigation */}
            <div className="flex items-center border border-border/50 rounded-lg overflow-hidden">
              <Button variant="ghost" size="sm" onClick={() => navigate('prev')} className="h-8 w-8 p-0 rounded-none">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div className="px-3 text-sm font-semibold text-foreground min-w-[180px] text-center border-x border-border/30">
                {dateLabel}
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('next')} className="h-8 w-8 p-0 rounded-none">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            <Button variant="ghost" size="sm" onClick={goToday} className="h-8 text-xs font-medium text-muted-foreground hover:text-foreground">
              Today
            </Button>

            <Button variant="ghost" size="sm" onClick={() => fetchAppointments(true)} className="h-8 w-8 p-0" disabled={refreshing}>
              <RefreshCw className={cn('w-3.5 h-3.5', refreshing && 'animate-spin')} />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            {/* Doctor selector dropdown */}
            <Select defaultValue="all">
              <SelectTrigger className="h-8 w-[100px] text-xs border-border/50">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {doctors.map(d => (
                  <SelectItem key={d.id} value={d.id}>{d.full_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Slot interval */}
            {calendarView !== 'month' && (
              <>
                <Select defaultValue="12">
                  <SelectTrigger className="h-8 w-[90px] text-xs border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {HOUR_FORMATS.map(f => (
                      <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={String(slotInterval)} onValueChange={v => setSlotInterval(Number(v))}>
                  <SelectTrigger className="h-8 w-[100px] text-xs border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SLOT_INTERVALS.map(s => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            )}

            {/* View toggle */}
            <div className="flex items-center border border-border/50 rounded-lg overflow-hidden">
              {([
                { key: 'day', icon: CalendarIcon, label: 'Day' },
                { key: 'month', icon: Grid3X3, label: 'Month' },
                { key: 'week', icon: Columns3, label: 'Week' },
                { key: 'kanban', icon: LayoutGrid, label: 'Board' },
              ] as const).map(v => {
                const isActive = v.key === 'kanban' ? viewMode === 'kanban' : (viewMode === 'calendar' && calendarView === v.key);
                return (
                  <button
                    key={v.key}
                    onClick={() => {
                      if (v.key === 'kanban') {
                        setViewMode('kanban');
                      } else {
                        setViewMode('calendar');
                        setCalendarView(v.key);
                      }
                    }}
                    className={cn(
                      'h-8 w-9 flex items-center justify-center transition-colors',
                      isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    )}
                    title={v.label}
                  >
                    <v.icon className="w-4 h-4" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      {viewMode === 'calendar' ? (
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* Sidebar */}
          <div className="hidden lg:block w-[320px] shrink-0 border-r border-border/30 overflow-hidden">
            {loading ? <QueueSkeleton /> : (
              <PatientQueueSidebar
                appointments={appointments}
                onStatusChange={handleStatusChange}
              />
            )}
          </div>

          {/* Calendar area */}
          <div className="flex-1 overflow-auto p-4">
            {loading ? <CalendarSkeleton view={calendarView} /> : (
              <>
                {calendarView === 'day' && (
                  <DayViewCalendar
                    appointments={appointments}
                    date={currentDate}
                    slotInterval={slotInterval}
                    onSlotClick={handleSlotClick}
                    onAppointmentClick={() => {}}
                  />
                )}
                {calendarView === 'week' && (
                  <WeekViewCalendar
                    appointments={appointments}
                    weekDays={weekDays}
                    slotInterval={slotInterval}
                    onSlotClick={handleSlotClick}
                    onAppointmentClick={() => {}}
                  />
                )}
                {calendarView === 'month' && (
                  <MonthViewCalendar
                    appointments={appointments}
                    currentDate={currentDate}
                    onDayClick={(day) => {
                      setCurrentDate(day);
                      setCalendarView('day');
                    }}
                  />
                )}
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-auto p-4">
          {loading ? <KanbanSkeleton /> : (
            <QueueKanban
              appointments={appointments}
              onStatusChange={handleStatusChange}
              onPrintCasePaper={setCasePaperAppt}
            />
          )}
        </div>
      )}

      <CreateAppointmentDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSuccess={() => fetchAppointments(true)}
        hospitalId={hospitalId}
        userId={userId}
        userRole={userRole}
        doctors={doctors}
        prefillDate={prefillDate}
        prefillTime={prefillTime}
      />

      {casePaperAppt && (
        <CasePaperPrint
          appointment={casePaperAppt}
          hospitalName="Hospital"
          onClose={() => setCasePaperAppt(null)}
        />
      )}
    </div>
  );
}

function CalendarSkeleton({ view }: { view?: CalendarView }) {
  if (view === 'month') {
    return (
      <div className="glass-card overflow-hidden">
        <div className="grid grid-cols-7 gap-px">
          {Array.from({ length: 35 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className="glass-card overflow-hidden">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex border-b border-border/20 min-h-[52px]">
          <Skeleton className="w-[72px] h-full" />
          <Skeleton className="flex-1 h-full m-0.5" />
        </div>
      ))}
    </div>
  );
}

function QueueSkeleton() {
  return (
    <div className="glass-card h-full p-4 space-y-3">
      <Skeleton className="h-5 w-32" />
      <div className="grid grid-cols-4 gap-2">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10" />)}
      </div>
      <Skeleton className="h-9 w-full" />
      <div className="space-y-2 mt-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="w-9 h-9 rounded-xl" />
            <div className="flex-1">
              <Skeleton className="h-3 w-24 mb-1" />
              <Skeleton className="h-2.5 w-32" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function KanbanSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
      {Array.from({ length: 3 }).map((_, col) => (
        <div key={col} className="glass-card flex flex-col">
          <div className="px-4 py-3 border-b border-border/30">
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="p-2 space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-card rounded-lg border border-border/30 p-3">
                <div className="flex items-center gap-2.5">
                  <Skeleton className="w-9 h-9 rounded-xl" />
                  <div className="flex-1">
                    <Skeleton className="h-3 w-24 mb-1.5" />
                    <Skeleton className="h-2.5 w-32" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
