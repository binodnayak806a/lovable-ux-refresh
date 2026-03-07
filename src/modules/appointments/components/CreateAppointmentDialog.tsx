import { useState, useEffect } from 'react';
import {
  X, Search, UserPlus, Calendar, Clock, MessageCircle,
  AlertTriangle, Zap,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Badge } from '../../../components/ui/badge';
import { Switch } from '../../../components/ui/switch';
import { useDebounce } from '../../../hooks/useDebounce';
import appointmentsService, {
  type DoctorOption,
  type CreateAppointmentData,
  type DoctorFeeInfo,
} from '../../../services/appointments.service';
import OPDBillModal from './OPDBillModal';
import { cn } from '../../../lib/utils';

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  hospitalId: string;
  userId: string;
  userRole?: string;
  doctors: DoctorOption[];
  prefillDate?: Date;
  prefillTime?: string;
}

interface PatientResult {
  id: string;
  full_name: string;
  uhid: string;
  phone: string;
  gender: string | null;
}

interface CustomField {
  id: string;
  field_label: string;
  field_type: 'text' | 'date' | 'dropdown' | 'toggle';
  is_mandatory: boolean;
  options: string[];
}

const APPOINTMENT_TYPES = [
  { value: 'new', label: 'New Consultation' },
  { value: 'follow_up', label: 'Follow-up' },
  { value: 'investigation', label: 'Investigation' },
  { value: 'walk_in', label: 'Walk-In' },
];

const REFERRAL_TYPES = [
  { value: 'none', label: 'None' },
  { value: 'self', label: 'Self' },
  { value: 'referred', label: 'Referred' },
];

const TIME_SLOTS = Array.from({ length: 28 }, (_, i) => {
  const hour = Math.floor(i / 2) + 7;
  const min = i % 2 === 0 ? '00' : '30';
  return `${String(hour).padStart(2, '0')}:${min}`;
});

export default function CreateAppointmentDialog({
  open, onClose, onSuccess, hospitalId, userId, userRole, doctors,
  prefillDate, prefillTime,
}: Props) {
  const [patientSearch, setPatientSearch] = useState('');
  const [patients, setPatients] = useState<PatientResult[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientResult | null>(null);
  const [doctorId, setDoctorId] = useState('');
  const [appointmentDate, setAppointmentDate] = useState(
    prefillDate ? format(prefillDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')
  );
  const [appointmentTime, setAppointmentTime] = useState(prefillTime ?? '09:00');
  const [appointmentType, setAppointmentType] = useState('new');
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  const [visitType, setVisitType] = useState('First Visit');
  const [daysSinceLastVisit, setDaysSinceLastVisit] = useState<number | null>(null);
  const [doctorFees, setDoctorFees] = useState<DoctorFeeInfo>({ consultation: 0, follow_up: 0 });

  const [referralType, setReferralType] = useState('none');
  const [referralDoctor, setReferralDoctor] = useState('');

  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, unknown>>({});

  const [showBillModal, setShowBillModal] = useState(false);
  const [pendingAppointment, setPendingAppointment] = useState<{
    id: string;
    patient_name: string;
    patient_uhid: string;
    doctor_name: string;
    token_number: number | null;
    appointment_date: string;
    appointment_time: string;
  } | null>(null);
  const [showWhatsAppButton, setShowWhatsAppButton] = useState(false);

  const debouncedSearch = useDebounce(patientSearch, 280);

  useEffect(() => {
    if (prefillDate) setAppointmentDate(format(prefillDate, 'yyyy-MM-dd'));
    if (prefillTime) setAppointmentTime(prefillTime);
  }, [prefillDate, prefillTime]);

  useEffect(() => {
    if (!debouncedSearch || debouncedSearch.length < 2) {
      setPatients([]);
      return;
    }
    setSearchLoading(true);
    appointmentsService.searchPatients(hospitalId, debouncedSearch)
      .then((data) => setPatients(data as PatientResult[]))
      .catch(() => setPatients([]))
      .finally(() => setSearchLoading(false));
  }, [debouncedSearch, hospitalId]);

  useEffect(() => {
    if (selectedPatient && doctorId) {
      appointmentsService.detectVisitType(hospitalId, selectedPatient.id, doctorId)
        .then(({ visitType: vt, daysSinceLastVisit: days }) => {
          setVisitType(vt);
          setDaysSinceLastVisit(days);
        })
        .catch(() => {});
    }
  }, [selectedPatient, doctorId, hospitalId]);

  useEffect(() => {
    if (doctorId) {
      appointmentsService.getDoctorFees(doctorId)
        .then(setDoctorFees)
        .catch(() => {});
    }
  }, [doctorId]);

  useEffect(() => {
    appointmentsService.getCustomFieldsConfig(hospitalId, 'appointment')
      .then(setCustomFields)
      .catch(() => {});
  }, [hospitalId]);

  const getBillAmount = () => {
    const isFollowUp = visitType.toLowerCase().includes('follow');
    return isFollowUp ? doctorFees.follow_up : doctorFees.consultation;
  };

  const handleSubmit = async () => {
    if (!selectedPatient || !doctorId) return;

    for (const cf of customFields) {
      if (cf.is_mandatory && !customFieldValues[cf.id]) {
        toast.error(`"${cf.field_label}" is required`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const data: CreateAppointmentData = {
        hospital_id: hospitalId,
        patient_id: selectedPatient.id,
        doctor_id: doctorId,
        appointment_date: appointmentDate,
        appointment_time: appointmentTime,
        type: appointmentType,
        status: 'scheduled',
        chief_complaint: chiefComplaint || undefined,
        visit_type: visitType,
        referral_type: referralType,
        referral_doctor: referralType === 'referred' ? referralDoctor : undefined,
        custom_field_values: Object.keys(customFieldValues).length > 0 ? customFieldValues : undefined,
        created_by: userId,
      };
      const appt = await appointmentsService.createAppointment(data);

      const selectedDoc = doctors.find(d => d.id === doctorId);
      setPendingAppointment({
        id: appt.id,
        patient_name: selectedPatient.full_name,
        patient_uhid: selectedPatient.uhid,
        doctor_name: selectedDoc?.full_name ?? '',
        token_number: appt.token_number,
        appointment_date: appointmentDate,
        appointment_time: appointmentTime,
      });

      const amount = getBillAmount();
      if (amount > 0) {
        setShowBillModal(true);
      } else {
        setShowWhatsAppButton(true);
        onSuccess();
        toast.success('Appointment created successfully');
      }
    } catch {
      toast.error('Failed to create appointment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBillComplete = () => {
    setShowBillModal(false);
    setShowWhatsAppButton(true);
    onSuccess();
    toast.success('Appointment created and bill generated');
  };

  const handleBillSkip = () => {
    setShowBillModal(false);
    setShowWhatsAppButton(true);
    onSuccess();
    toast.success('Appointment created');
  };

  const getWhatsAppUrl = () => {
    if (!selectedPatient || !pendingAppointment) return '';
    const phone = selectedPatient.phone.replace(/\D/g, '');
    const phoneNumber = phone.startsWith('91') ? phone : `91${phone}`;
    const dateFormatted = format(new Date(pendingAppointment.appointment_date), 'dd-MMM-yyyy');
    const text = encodeURIComponent(
      `Your appointment is confirmed with Dr. ${pendingAppointment.doctor_name} on ${dateFormatted} at ${pendingAppointment.appointment_time}. Token No: ${pendingAppointment.token_number ?? '-'}`
    );
    return `https://wa.me/${phoneNumber}?text=${text}`;
  };

  const handleClose = () => {
    setPatientSearch('');
    setSelectedPatient(null);
    setDoctorId('');
    setChiefComplaint('');
    setAppointmentType('new');
    setVisitType('First Visit');
    setDaysSinceLastVisit(null);
    setReferralType('none');
    setReferralDoctor('');
    setCustomFieldValues({});
    setPendingAppointment(null);
    setShowWhatsAppButton(false);
    setShowBillModal(false);
    onClose();
  };

  if (!open) return null;

  if (showWhatsAppButton && pendingAppointment) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
          <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <Zap className="w-7 h-7 text-green-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">Appointment Created</h3>
          <p className="text-sm text-gray-500 mb-1">
            Token #{pendingAppointment.token_number} for {pendingAppointment.patient_name}
          </p>
          <p className="text-xs text-gray-400 mb-5">
            Dr. {pendingAppointment.doctor_name} | {format(new Date(pendingAppointment.appointment_date), 'dd MMM yyyy')} at {pendingAppointment.appointment_time}
          </p>
          <div className="space-y-2">
            <a
              href={getWhatsAppUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              Send WhatsApp Confirmation
            </a>
            <Button variant="outline" className="w-full" onClick={handleClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
            <div>
              <h2 className="text-lg font-bold text-gray-900">New Appointment</h2>
              <p className="text-sm text-gray-500">Schedule a patient visit</p>
            </div>
            <button
              onClick={handleClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-5">
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">Patient *</Label>
              {selectedPatient ? (
                <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700">
                    {selectedPatient.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{selectedPatient.full_name}</p>
                    <p className="text-xs text-gray-500">{selectedPatient.uhid} | {selectedPatient.phone}</p>
                  </div>
                  <button
                    onClick={() => { setSelectedPatient(null); setPatientSearch(''); }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    value={patientSearch}
                    onChange={e => setPatientSearch(e.target.value)}
                    placeholder="Search by name, UHID, or phone..."
                    className="pl-10"
                  />
                  {patients.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                      {patients.map(p => (
                        <button
                          key={p.id}
                          onClick={() => { setSelectedPatient(p); setPatients([]); setPatientSearch(''); }}
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 border-b border-gray-50 last:border-b-0"
                        >
                          <UserPlus className="w-4 h-4 text-gray-400 shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{p.full_name}</p>
                            <p className="text-xs text-gray-500">{p.uhid} | {p.phone}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {searchLoading && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg p-4 text-center">
                      <p className="text-sm text-gray-500">Searching...</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">Doctor *</Label>
              <select
                value={doctorId}
                onChange={e => setDoctorId(e.target.value)}
                className="w-full h-11 rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none"
              >
                <option value="">Select doctor...</option>
                {doctors.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.full_name}{d.designation ? ` (${d.designation})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {selectedPatient && doctorId && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-amber-800">
                    Auto-detected: <span className="font-bold">{visitType}</span>
                    {daysSinceLastVisit !== null && (
                      <span className="text-amber-600 ml-1">
                        ({daysSinceLastVisit} day{daysSinceLastVisit !== 1 ? 's' : ''} since last visit)
                      </span>
                    )}
                  </p>
                </div>
                <select
                  value={visitType}
                  onChange={e => setVisitType(e.target.value)}
                  className="text-xs border border-amber-300 rounded-lg px-2 py-1 bg-white text-amber-900"
                >
                  <option value="First Visit">First Visit</option>
                  <option value="Follow-up">Follow-up</option>
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Date
                </Label>
                <Input
                  type="date"
                  value={appointmentDate}
                  onChange={e => setAppointmentDate(e.target.value)}
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Time
                </Label>
                <select
                  value={appointmentTime}
                  onChange={e => setAppointmentTime(e.target.value)}
                  className="w-full h-11 rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none"
                >
                  {TIME_SLOTS.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">Appointment Type</Label>
              <div className="flex flex-wrap gap-2">
                {APPOINTMENT_TYPES.map(t => (
                  <button
                    key={t.value}
                    onClick={() => setAppointmentType(t.value)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                      appointmentType === t.value
                        ? 'bg-blue-50 border-blue-200 text-blue-700'
                        : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">Referral</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {REFERRAL_TYPES.map(r => (
                  <button
                    key={r.value}
                    onClick={() => setReferralType(r.value)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                      referralType === r.value
                        ? 'bg-blue-50 border-blue-200 text-blue-700'
                        : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                    )}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
              {referralType === 'referred' && (
                <Input
                  value={referralDoctor}
                  onChange={e => setReferralDoctor(e.target.value)}
                  placeholder="Referring doctor name..."
                  className="mt-2"
                />
              )}
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">Chief Complaint</Label>
              <Input
                value={chiefComplaint}
                onChange={e => setChiefComplaint(e.target.value)}
                placeholder="Reason for visit..."
              />
            </div>

            {customFields.length > 0 && (
              <div className="space-y-3 border-t border-gray-100 pt-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Additional Fields</p>
                {customFields.map(cf => (
                  <div key={cf.id}>
                    <Label className="text-sm font-medium text-gray-700 mb-1.5 block">
                      {cf.field_label} {cf.is_mandatory && <span className="text-red-500">*</span>}
                    </Label>
                    {cf.field_type === 'text' && (
                      <Input
                        value={(customFieldValues[cf.id] as string) ?? ''}
                        onChange={e => setCustomFieldValues(prev => ({ ...prev, [cf.id]: e.target.value }))}
                        placeholder={cf.field_label}
                      />
                    )}
                    {cf.field_type === 'date' && (
                      <Input
                        type="date"
                        value={(customFieldValues[cf.id] as string) ?? ''}
                        onChange={e => setCustomFieldValues(prev => ({ ...prev, [cf.id]: e.target.value }))}
                      />
                    )}
                    {cf.field_type === 'dropdown' && (
                      <select
                        value={(customFieldValues[cf.id] as string) ?? ''}
                        onChange={e => setCustomFieldValues(prev => ({ ...prev, [cf.id]: e.target.value }))}
                        className="w-full h-11 rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none"
                      >
                        <option value="">Select...</option>
                        {(cf.options ?? []).map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    )}
                    {cf.field_type === 'toggle' && (
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={!!customFieldValues[cf.id]}
                          onCheckedChange={val => setCustomFieldValues(prev => ({ ...prev, [cf.id]: val }))}
                        />
                        <span className="text-xs text-gray-500">
                          {customFieldValues[cf.id] ? 'Yes' : 'No'}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {doctorId && getBillAmount() > 0 && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                <p className="text-xs text-emerald-700">
                  <span className="font-medium">Estimated Fee:</span>{' '}
                  <span className="font-bold text-lg">
                    {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(getBillAmount())}
                  </span>
                  <span className="text-emerald-600 ml-1">
                    ({visitType.toLowerCase().includes('follow') ? 'Follow-up' : 'Consultation'} fee)
                  </span>
                </p>
              </div>
            )}

            {appointmentType === 'walk_in' && (
              <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700 text-xs">
                Walk-in appointments are auto-set to Waiting status
              </Badge>
            )}
          </div>

          <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex items-center justify-end gap-3 rounded-b-2xl">
            <Button variant="outline" onClick={handleClose} disabled={submitting}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!selectedPatient || !doctorId || submitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {submitting ? 'Creating...' : 'Create Appointment'}
            </Button>
          </div>
        </div>
      </div>

      {showBillModal && pendingAppointment && selectedPatient && (
        <OPDBillModal
          hospitalId={hospitalId}
          appointmentId={pendingAppointment.id}
          patientId={selectedPatient.id}
          patientName={selectedPatient.full_name}
          patientUhid={selectedPatient.uhid}
          doctorId={doctorId}
          doctorName={pendingAppointment.doctor_name}
          visitType={visitType}
          amount={getBillAmount()}
          canEditAmount={userRole === 'admin' || userRole === 'superadmin' || userRole === 'receptionist'}
          userId={userId}
          onComplete={handleBillComplete}
          onSkip={handleBillSkip}
        />
      )}
    </>
  );
}
