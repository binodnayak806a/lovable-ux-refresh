import { useState, useMemo } from 'react';
import { format, addWeeks, subWeeks, startOfWeek, addDays } from 'date-fns';
import { Plus, ChevronLeft, ChevronRight, Scissors, Wrench, CheckCircle2, Clock } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePageTitle } from '@/hooks/usePageTitle';
import OTCalendar from './components/OTCalendar';
import BookSurgeryDialog from './components/BookSurgeryDialog';
import SurgeryDetailSheet from './components/SurgeryDetailSheet';
import type { SurgeryBooking } from './types';
import { MOCK_OTS } from './types';
import { toast } from 'sonner';

// seed some demo bookings
const today = new Date();
const ws = startOfWeek(today, { weekStartsOn: 1 });
const SEED_BOOKINGS: SurgeryBooking[] = [
  {
    id: '1', hospital_id: '', patient_id: 'p1', patient_name: 'Ramesh Kumar',
    ot_id: 'ot-1', ot_name: 'OT-1 (General)', surgery_name: 'Laparoscopic Appendectomy',
    surgery_date: format(addDays(ws, 1), 'yyyy-MM-dd'), start_time: '09:00', end_time: '11:00',
    status: 'scheduled', priority: 'elective', diagnosis: 'Acute appendicitis',
    notes: null, pre_op_checklist: [], team: [
      { id: 't1', name: 'Dr. Sharma', role: 'lead_surgeon' },
      { id: 't2', name: 'Dr. Patel', role: 'anesthesiologist' },
    ],
    created_at: new Date().toISOString(),
  },
  {
    id: '2', hospital_id: '', patient_id: 'p2', patient_name: 'Sunita Devi',
    ot_id: 'ot-2', ot_name: 'OT-2 (Cardiac)', surgery_name: 'CABG (Triple Vessel)',
    surgery_date: format(addDays(ws, 3), 'yyyy-MM-dd'), start_time: '08:00', end_time: '13:00',
    status: 'pre_op', priority: 'urgent', diagnosis: 'Triple vessel CAD',
    notes: 'Diabetic – insulin drip required', pre_op_checklist: [], team: [
      { id: 't3', name: 'Dr. Mehta', role: 'lead_surgeon' },
      { id: 't4', name: 'Dr. Singh', role: 'assistant_surgeon' },
      { id: 't5', name: 'Dr. Gupta', role: 'anesthesiologist' },
      { id: 't6', name: 'Sr. Nurse Rekha', role: 'scrub_nurse' },
    ],
    created_at: new Date().toISOString(),
  },
  {
    id: '3', hospital_id: '', patient_id: 'p3', patient_name: 'Anil Joshi',
    ot_id: 'ot-4', ot_name: 'OT-4 (Minor)', surgery_name: 'Excision of Lipoma',
    surgery_date: format(addDays(ws, 0), 'yyyy-MM-dd'), start_time: '14:00', end_time: '15:00',
    status: 'completed', priority: 'elective', diagnosis: 'Subcutaneous lipoma – right arm',
    notes: null, pre_op_checklist: [], team: [
      { id: 't7', name: 'Dr. Reddy', role: 'lead_surgeon' },
    ],
    created_at: new Date().toISOString(),
  },
];

const OT_STATUS_ICON: Record<string, React.ReactNode> = {
  available: <CheckCircle2 className="h-4 w-4 text-green-500" />,
  in_use: <Clock className="h-4 w-4 text-amber-500" />,
  maintenance: <Wrench className="h-4 w-4 text-red-500" />,
  cleaning: <Clock className="h-4 w-4 text-blue-500" />,
};

export default function OperationTheatrePage() {
  usePageTitle('Operation Theatre');

  const [bookings, setBookings] = useState<SurgeryBooking[]>(SEED_BOOKINGS);
  const [selectedDate, setSelectedDate] = useState(today);
  const [bookDialogOpen, setBookDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<SurgeryBooking | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const stats = useMemo(() => {
    const scheduled = bookings.filter((b) => b.status === 'scheduled').length;
    const inProgress = bookings.filter((b) => b.status === 'in_progress').length;
    const completed = bookings.filter((b) => b.status === 'completed').length;
    const todayCount = bookings.filter((b) => b.surgery_date === format(today, 'yyyy-MM-dd')).length;
    return { scheduled, inProgress, completed, todayCount };
  }, [bookings]);

  const handleAddBooking = (booking: SurgeryBooking) => {
    setBookings((prev) => [...prev, booking]);
    toast.success('Surgery scheduled successfully');
  };

  const handleSelectBooking = (b: SurgeryBooking) => {
    setSelectedBooking(b);
    setDetailOpen(true);
  };

  const handleUpdateBooking = (updated: SurgeryBooking) => {
    setBookings((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
    setSelectedBooking(updated);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Scissors className="h-6 w-6 text-primary" />
            Operation Theatre
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Schedule surgeries, manage OT bookings, and track pre-op readiness
          </p>
        </div>
        <Button onClick={() => setBookDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Book Surgery
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Today's Surgeries", value: stats.todayCount, color: 'text-primary' },
          { label: 'Scheduled', value: stats.scheduled, color: 'text-blue-600 dark:text-blue-400' },
          { label: 'In Progress', value: stats.inProgress, color: 'text-amber-600 dark:text-amber-400' },
          { label: 'Completed', value: stats.completed, color: 'text-green-600 dark:text-green-400' },
        ].map((s) => (
          <Card key={s.label} className="border-border">
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground">{s.label}</div>
              <div className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="calendar">
        <TabsList>
          <TabsTrigger value="calendar">OT Calendar</TabsTrigger>
          <TabsTrigger value="theatres">Theatres Status</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="mt-4">
          {/* Week nav */}
          <div className="flex items-center justify-between mb-4">
            <Button variant="outline" size="icon" onClick={() => setSelectedDate((d) => subWeeks(d, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium text-foreground">
              Week of {format(startOfWeek(selectedDate, { weekStartsOn: 1 }), 'd MMM yyyy')}
            </span>
            <Button variant="outline" size="icon" onClick={() => setSelectedDate((d) => addWeeks(d, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <OTCalendar bookings={bookings} selectedDate={selectedDate} onSelectBooking={handleSelectBooking} />
        </TabsContent>

        <TabsContent value="theatres" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {MOCK_OTS.map((ot) => (
              <Card key={ot.id} className="border-border">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-foreground">{ot.name}</h3>
                    {OT_STATUS_ICON[ot.status]}
                  </div>
                  <Badge variant="outline" className="capitalize">{ot.status.replace('_', ' ')}</Badge>
                  <div className="text-xs text-muted-foreground">Floor {ot.floor}</div>
                  <div className="flex flex-wrap gap-1">
                    {ot.equipment.map((eq) => (
                      <Badge key={eq} variant="secondary" className="text-[10px]">{eq}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <BookSurgeryDialog open={bookDialogOpen} onOpenChange={setBookDialogOpen} onSubmit={handleAddBooking} />
      <SurgeryDetailSheet
        booking={selectedBooking}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onUpdate={handleUpdateBooking}
      />
    </div>
  );
}
