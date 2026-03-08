import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ChevronLeft, ChevronRight, Plus, Filter, RefreshCw,
  CalendarDays, Users, Clock, LayoutGrid, CalendarRange,
} from 'lucide-react';
import { format, startOfWeek, addDays, addWeeks, subWeeks, isToday } from 'date-fns';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Skeleton } from '../../components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/popover';
import { Checkbox } from '../../components/ui/checkbox';
import { useHospitalId } from '../../hooks/useHospitalId';
import { usePageTitle } from '../../hooks/usePageTitle';
import { useAppSelector } from '../../store';
import { useRealtime } from '../../hooks/useRealtime';
import appointmentsService, {
  type WeekAppointment,
  type DoctorOption,
} from '../../services/appointments.service';
import WeekViewCalendar from './components/WeekViewCalendar';
import PatientQueueSidebar from './components/PatientQueueSidebar';
import QueueKanban from './components/QueueKanban';
import CreateAppointmentDialog from './components/CreateAppointmentDialog';
import CasePaperPrint from './components/CasePaperPrint';
import { cn } from '../../lib/utils';

type ViewMode = 'calendar' | 'kanban';

export default function AppointmentsPage() {
  usePageTitle('Appointments');
  const hospitalId = useHospitalId();
  const user = useAppSelector(s => s.auth.user);
  const userId = user?.id ?? '';
  const userRole = user?.role ?? '';

  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [currentDate, setCurrentDate] = useState(new Date());
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

  const weekStart = useMemo(
    () => startOfWeek(currentDate, { weekStartsOn: 1 }),
    [currentDate]
  );

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  const weekStartStr = format(weekStart, 'yyyy-MM-dd');
  const weekEndStr = format(addDays(weekStart, 6), 'yyyy-MM-dd');

  const fetchAppointments = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const data = await appointmentsService.getWeekAppointments(
        hospitalId,
        weekStartStr,
        weekEndStr,
        selectedDoctors.length > 0 ? selectedDoctors : undefined
      );
      setAppointments(data);
    } catch {
      //
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [hospitalId, weekStartStr, weekEndStr, selectedDoctors]);

  const fetchDoctors = useCallback(async () => {
    try {
      const data = await appointmentsService.getDoctors(hospitalId);
      setDoctors(data);
    } catch {
      //
    }
  }, [hospitalId]);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  useRealtime(
    { table: 'appointments', filter: `hospital_id=eq.${hospitalId}` },
    () => fetchAppointments(true)
  );

  const handlePrevWeek = () => setCurrentDate(d => subWeeks(d, 1));
  const handleNextWeek = () => setCurrentDate(d => addWeeks(d, 1));
  const handleToday = () => setCurrentDate(new Date());

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
      setAppointments(prev =>
        prev.map(a => (a.id === id ? { ...a, status } : a))
      );
    } catch {
      //
    }
  };

  const toggleDoctor = (id: string) => {
    setSelectedDoctors(prev =>
      prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
    );
  };

  const todayHasAppointments = weekDays.some(d => isToday(d));
  const weekLabel = `${format(weekStart, 'MMM d')} - ${format(addDays(weekStart, 6), 'MMM d, yyyy')}`;

  const totalWeek = appointments.length;
  const todayCount = appointments.filter(
    a => a.appointment_date === format(new Date(), 'yyyy-MM-dd')
  ).length;

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center justify-between py-2 shrink-0">
        <PageHeader
          title="Appointments"
          subtitle={viewMode === 'calendar' ? weekLabel : `Today's Queue`}
          icon={CalendarDays}
          actions={<div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 mr-2">
            <Badge variant="outline" className="border-gray-200 text-gray-600 text-xs font-medium">
              <Users className="w-3 h-3 mr-1" />
              {totalWeek} this week
            </Badge>
            {todayHasAppointments && (
              <Badge variant="outline" className="border-blue-200 text-blue-600 text-xs font-medium bg-blue-50">
                <Clock className="w-3 h-3 mr-1" />
                {todayCount} today
              </Badge>
            )}
          </div>

          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
            <TabsList className="h-9">
              <TabsTrigger value="calendar" className="gap-1.5 text-xs h-7">
                <CalendarRange className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Calendar</span>
              </TabsTrigger>
              <TabsTrigger value="kanban" className="gap-1.5 text-xs h-7">
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Queue Board</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {viewMode === 'calendar' && (
            <div className="flex items-center border border-gray-200 rounded-lg">
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePrevWeek}
                className="h-9 w-9 p-0 rounded-r-none"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleToday}
                className="h-9 px-3 text-xs font-medium rounded-none border-x border-gray-200"
              >
                Today
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleNextWeek}
                className="h-9 w-9 p-0 rounded-l-none"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}

          <Popover open={filterOpen} onOpenChange={setFilterOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  'h-9 gap-1.5',
                  selectedDoctors.length > 0 && 'border-blue-300 bg-blue-50 text-blue-700'
                )}
              >
                <Filter className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Doctors</span>
                {selectedDoctors.length > 0 && (
                  <Badge className="ml-1 h-5 px-1.5 text-[10px] bg-blue-600">
                    {selectedDoctors.length}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-0" align="end">
              <div className="px-3 py-2.5 border-b border-gray-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-700">Filter by Doctor</span>
                {selectedDoctors.length > 0 && (
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => setSelectedDoctors([])}
                    className="h-auto p-0 text-xs"
                  >
                    Clear all
                  </Button>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto p-1.5">
                {doctors.map(doc => (
                  <label
                    key={doc.id}
                    className={cn(
                      'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors',
                      selectedDoctors.includes(doc.id)
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    )}
                  >
                    <Checkbox
                      checked={selectedDoctors.includes(doc.id)}
                      onCheckedChange={() => toggleDoctor(doc.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{doc.full_name}</p>
                      {doc.designation && (
                        <p className="text-xs text-gray-500 truncate">{doc.designation}</p>
                      )}
                    </div>
                  </label>
                ))}
                {doctors.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-4">No doctors found</p>
                )}
              </div>
            </PopoverContent>
          </Popover>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => fetchAppointments(true)}
            className="h-9 w-9 p-0"
            disabled={refreshing}
          >
            <RefreshCw className={cn('w-4 h-4', refreshing && 'animate-spin')} />
          </Button>

          <Button
            size="sm"
            onClick={handleNewAppointment}
            className="h-9 gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Appointment</span>
          </Button>
        </div>
      </div>

      {viewMode === 'calendar' ? (
        <div className="flex-1 flex min-h-0 overflow-hidden">
          <div className="flex-1 overflow-auto p-4">
            {loading ? (
              <CalendarSkeleton />
            ) : (
              <WeekViewCalendar
                appointments={appointments}
                weekDays={weekDays}
                onSlotClick={handleSlotClick}
                onAppointmentClick={() => {}}
              />
            )}
          </div>

          <div className="hidden lg:block w-80 border-l border-gray-100 p-4 overflow-hidden">
            {loading ? (
              <QueueSkeleton />
            ) : (
              <PatientQueueSidebar
                appointments={appointments}
                onStatusChange={handleStatusChange}
              />
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-auto p-4">
          {loading ? (
            <KanbanSkeleton />
          ) : (
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

function CalendarSkeleton() {
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="grid grid-cols-[64px_repeat(7,1fr)] border-b border-gray-200">
        <Skeleton className="h-16" />
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-16" />
        ))}
      </div>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="grid grid-cols-[64px_repeat(7,1fr)] border-b border-gray-100 min-h-[72px]">
          <Skeleton className="h-full" />
          {Array.from({ length: 7 }).map((_, j) => (
            <Skeleton key={j} className="h-full m-1 rounded-md" />
          ))}
        </div>
      ))}
    </div>
  );
}

function QueueSkeleton() {
  return (
    <div className="bg-white border border-gray-200 rounded-xl h-full p-4 space-y-3">
      <Skeleton className="h-5 w-32" />
      <Skeleton className="h-4 w-48" />
      <div className="space-y-2 mt-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="w-8 h-8 rounded-full" />
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
        <div key={col} className="rounded-xl border border-gray-200 bg-gray-50/50 flex flex-col">
          <div className="px-4 py-3 border-b border-gray-200">
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="p-2 space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-lg border border-gray-100 p-3">
                <div className="flex items-center gap-2.5">
                  <Skeleton className="w-9 h-9 rounded-full" />
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
