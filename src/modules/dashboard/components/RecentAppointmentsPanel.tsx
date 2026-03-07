import { Clock, MoreHorizontal, Check, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '../../../components/ui/skeleton';
import { useSmartNavigation } from '../../../hooks/useSmartNavigation';
import type { RecentAppointment } from '../../../services/dashboard.service';
import { cn } from '../../../lib/utils';

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  scheduled:   { bg: 'bg-blue-50',    text: 'text-blue-700' },
  confirmed:   { bg: 'bg-cyan-50',    text: 'text-cyan-700' },
  in_progress: { bg: 'bg-amber-50',   text: 'text-amber-700' },
  completed:   { bg: 'bg-emerald-50', text: 'text-emerald-700' },
  cancelled:   { bg: 'bg-red-50',     text: 'text-red-700' },
  no_show:     { bg: 'bg-gray-100',   text: 'text-gray-600' },
};

function formatTime(time: string): string {
  if (!time) return '-';
  const [h, m] = time.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

interface Props {
  appointments: RecentAppointment[];
  loading?: boolean;
}

export default function RecentAppointmentsPanel({ appointments, loading }: Props) {
  const navigate = useNavigate();
  const { goToPatient } = useSmartNavigation();

  return (
    <section
      aria-labelledby="recent-appointments-heading"
      className="bg-white border border-gray-200 rounded-xl overflow-hidden"
    >
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Clock aria-hidden="true" className="w-4 h-4 text-gray-400" />
          <h2 id="recent-appointments-heading" className="text-sm font-semibold text-gray-900">
            Recent Appointments
          </h2>
        </div>
        <button
          onClick={() => navigate('/appointments')}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded px-2 py-1"
          aria-label="View all appointments"
        >
          View all
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm" role="grid">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th scope="col" className="px-5 py-3 text-left font-medium text-gray-600">Patient</th>
              <th scope="col" className="px-5 py-3 text-left font-medium text-gray-600">Doctor</th>
              <th scope="col" className="px-5 py-3 text-left font-medium text-gray-600 hidden sm:table-cell">Type</th>
              <th scope="col" className="px-5 py-3 text-left font-medium text-gray-600">Date</th>
              <th scope="col" className="px-5 py-3 text-left font-medium text-gray-600 hidden md:table-cell">Time</th>
              <th scope="col" className="px-5 py-3 text-left font-medium text-gray-600">Status</th>
              <th scope="col" className="w-10 px-2">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-gray-50" role="row" aria-busy="true">
                  <td className="px-5 py-4"><Skeleton className="w-32 h-5" /></td>
                  <td className="px-5 py-4"><Skeleton className="w-28 h-5" /></td>
                  <td className="px-5 py-4 hidden sm:table-cell"><Skeleton className="w-20 h-5" /></td>
                  <td className="px-5 py-4"><Skeleton className="w-16 h-5" /></td>
                  <td className="px-5 py-4 hidden md:table-cell"><Skeleton className="w-16 h-5" /></td>
                  <td className="px-5 py-4"><Skeleton className="w-20 h-5" /></td>
                  <td></td>
                </tr>
              ))
            ) : appointments.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Calendar aria-hidden="true" className="w-10 h-10 text-gray-300" />
                    <p className="text-gray-500 font-medium">No recent appointments</p>
                    <p className="text-sm text-gray-400">Appointments will appear here once scheduled</p>
                  </div>
                </td>
              </tr>
            ) : (
              appointments.slice(0, 5).map((appt) => {
                const style = STATUS_STYLES[appt.status] ?? STATUS_STYLES.scheduled;
                const patientInitials = appt.patient_name
                  ?.split(' ')
                  .slice(0, 2)
                  .map((n: string) => n[0])
                  .join('')
                  .toUpperCase() || '?';

                return (
                  <tr
                    key={appt.id}
                    className="border-b border-gray-50 hover:bg-blue-50/50 active:bg-blue-100/50 transition-colors cursor-pointer group"
                    onClick={() => goToPatient(appt.patient_id)}
                    tabIndex={0}
                    role="row"
                    aria-label={`Appointment for ${appt.patient_name} on ${formatDate(appt.appointment_date)}`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        goToPatient(appt.patient_id);
                      }
                    }}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          aria-hidden="true"
                          className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-semibold text-blue-700 group-hover:bg-blue-200 transition-colors"
                        >
                          {patientInitials}
                        </div>
                        <span className="font-medium text-gray-900">{appt.patient_name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-gray-700">{appt.doctor_name || 'Unassigned'}</td>
                    <td className="px-5 py-4 text-gray-500 capitalize hidden sm:table-cell">{appt.type || '-'}</td>
                    <td className="px-5 py-4 text-gray-600">{formatDate(appt.appointment_date)}</td>
                    <td className="px-5 py-4 text-gray-500 hidden md:table-cell">{formatTime(appt.appointment_time)}</td>
                    <td className="px-5 py-4">
                      <span className={cn(
                        'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold capitalize',
                        style.bg, style.text
                      )}>
                        {appt.status === 'completed' && <Check aria-hidden="true" className="w-3 h-3" />}
                        {appt.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-2 py-4">
                      <button
                        aria-label={`More actions for ${appt.patient_name}'s appointment`}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 active:bg-gray-200 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal aria-hidden="true" className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
