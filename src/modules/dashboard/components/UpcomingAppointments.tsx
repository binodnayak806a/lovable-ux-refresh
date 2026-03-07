import { useState, useEffect } from 'react';
import { Calendar, Clock, ChevronRight, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { useHospitalId } from '../../../hooks/useHospitalId';
import { Skeleton } from '../../../components/ui/skeleton';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import PatientNameLink from '../../../components/shared/PatientNameLink';
import { format } from 'date-fns';

interface Appointment {
  id: string;
  patient_id: string;
  patient_name: string;
  doctor_name: string;
  appointment_time: string;
  status: string;
  type: string;
}

const STATUS_DOT: Record<string, string> = {
  scheduled: 'bg-blue-400',
  confirmed: 'bg-emerald-400',
  qr_booked: 'bg-teal-400',
  in_progress: 'bg-amber-400',
};

export default function UpcomingAppointments({ showQuickAdd = false }: { showQuickAdd?: boolean }) {
  const hospitalId = useHospitalId();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const today = format(new Date(), 'yyyy-MM-dd');
        const { data } = await supabase
          .from('appointments')
          .select('id, patient_id, appointment_time, status, type, patient:patients(full_name), doctor:profiles(full_name)')
          .eq('hospital_id', hospitalId)
          .eq('appointment_date', today)
          .in('status', ['scheduled', 'confirmed', 'qr_booked', 'in_progress'])
          .order('appointment_time', { ascending: true })
          .limit(10);

        const mapped = (data ?? []).map((row: Record<string, unknown>) => ({
          id: row.id as string,
          patient_id: row.patient_id as string,
          patient_name: ((row.patient as Record<string, unknown>)?.full_name as string) ?? 'Unknown',
          doctor_name: ((row.doctor as Record<string, unknown>)?.full_name as string) ?? '',
          appointment_time: row.appointment_time as string,
          status: row.status as string,
          type: row.type as string,
        }));
        setAppointments(mapped);
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    })();
  }, [hospitalId]);

  function formatTime(time: string): string {
    if (!time) return '-';
    const [h, m] = time.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`;
  }

  return (
    <section className="bg-white border border-gray-200 rounded-xl overflow-hidden h-full">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Calendar className="w-4 h-4 text-blue-500" />
          <h2 className="text-sm font-semibold text-gray-900">Today's Appointments</h2>
          {!loading && (
            <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
              {appointments.length}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {showQuickAdd && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs gap-1"
              onClick={() => navigate('/appointments')}
            >
              <UserPlus className="w-3 h-3" />
              Add
            </Button>
          )}
          <button
            onClick={() => navigate('/appointments')}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-0.5"
          >
            All <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="px-5 py-3">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="w-1.5 h-8 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-3.5 w-28 mb-1" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-5 w-16 rounded" />
              </div>
            ))}
          </div>
        ) : appointments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <Calendar className="w-8 h-8 text-gray-300 mb-2" />
            <p className="text-sm text-gray-500">No upcoming appointments</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {appointments.map((appt, i) => (
              <div
                key={appt.id}
                className={`flex items-center gap-3 px-2 py-2 rounded-lg transition-colors ${i === 0 ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
              >
                <div className={`w-1.5 h-8 rounded-full ${STATUS_DOT[appt.status] ?? 'bg-gray-300'}`} />
                <div className="flex-1 min-w-0">
                  <PatientNameLink
                    patientId={appt.patient_id}
                    name={appt.patient_name}
                    className="text-sm font-medium text-gray-900 truncate hover:text-blue-600 hover:underline transition-colors cursor-pointer text-left"
                  />
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    {formatTime(appt.appointment_time)}
                    {appt.doctor_name && (
                      <span className="truncate ml-1">- {appt.doctor_name}</span>
                    )}
                  </div>
                </div>
                {appt.status === 'qr_booked' && (
                  <Badge variant="secondary" className="text-[10px] bg-teal-100 text-teal-700">QR</Badge>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
