import { useState, useEffect } from 'react';
import { CalendarCheck, Clock, Loader2, X } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import appointmentsService, { type DoctorOption } from '../../../services/appointments.service';

const TIME_SLOTS = Array.from({ length: 28 }, (_, i) => {
  const hour = Math.floor(i / 2) + 7;
  const min = i % 2 === 0 ? '00' : '30';
  return `${String(hour).padStart(2, '0')}:${min}`;
});

interface QuickBookAppointmentProps {
  open: boolean;
  onClose: () => void;
  hospitalId: string;
  userId: string;
  patientId: string;
  patientName: string;
  patientUhid: string;
  onSuccess?: () => void;
}

export default function QuickBookAppointment({
  open, onClose, hospitalId, userId, patientId, patientName, patientUhid, onSuccess,
}: QuickBookAppointmentProps) {
  const [doctors, setDoctors] = useState<DoctorOption[]>([]);
  const [doctorId, setDoctorId] = useState('');
  const [appointmentDate, setAppointmentDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [appointmentTime, setAppointmentTime] = useState('09:00');
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      appointmentsService.getDoctors(hospitalId).then(setDoctors).catch(() => {});
    }
  }, [open, hospitalId]);

  const handleSubmit = async () => {
    if (!doctorId) { toast.error('Please select a doctor'); return; }
    setSubmitting(true);
    try {
      await appointmentsService.createAppointment({
        hospital_id: hospitalId,
        patient_id: patientId,
        doctor_id: doctorId,
        appointment_date: appointmentDate,
        appointment_time: appointmentTime,
        type: 'new',
        status: 'scheduled',
        chief_complaint: chiefComplaint || undefined,
        visit_type: 'First Visit',
        referral_type: 'none',
        created_by: userId,
      });
      toast.success('Appointment booked successfully');
      onSuccess?.();
      onClose();
    } catch {
      toast.error('Failed to book appointment');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <CalendarCheck className="w-5 h-5 text-blue-600" /> Quick Book Appointment
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">{patientName} ({patientUhid})</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-1.5 block">Doctor *</Label>
            <select
              value={doctorId}
              onChange={e => setDoctorId(e.target.value)}
              className="w-full h-10 rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none"
            >
              <option value="">Select doctor...</option>
              {doctors.map(d => (
                <option key={d.id} value={d.id}>
                  {d.full_name}{d.designation ? ` (${d.designation})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1">Date</Label>
              <Input type="date" value={appointmentDate} onChange={e => setAppointmentDate(e.target.value)} />
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Time
              </Label>
              <select
                value={appointmentTime}
                onChange={e => setAppointmentTime(e.target.value)}
                className="w-full h-10 rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none"
              >
                {TIME_SLOTS.map(t => (<option key={t} value={t}>{t}</option>))}
              </select>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-700 mb-1.5 block">Chief Complaint</Label>
            <Textarea
              value={chiefComplaint}
              onChange={e => setChiefComplaint(e.target.value)}
              placeholder="Reason for visit..."
              rows={2}
              className="text-sm resize-none"
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={submitting}>Skip</Button>
          <Button onClick={handleSubmit} disabled={!doctorId || submitting} className="bg-blue-600 hover:bg-blue-700 gap-1.5">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarCheck className="w-4 h-4" />}
            Book Appointment
          </Button>
        </div>
      </div>
    </div>
  );
}
