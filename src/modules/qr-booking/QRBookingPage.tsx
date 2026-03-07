import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Calendar, Clock, User, Phone, Stethoscope, CheckCircle2,
  Loader2, CalendarPlus, Building2,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../../components/ui/select';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';

interface Doctor {
  id: string;
  full_name: string;
  designation: string | null;
  department: string | null;
}

interface Hospital {
  id: string;
  name: string;
  logo_url: string | null;
  phone: string | null;
  address: string | null;
}

interface CustomField {
  id: string;
  field_label: string;
  field_type: 'text' | 'date' | 'dropdown' | 'toggle';
  is_mandatory: boolean;
  options: string[];
  sort_order: number;
}

interface BookingResult {
  token: number;
  doctor_name: string;
  date: string;
}

export default function QRBookingPage() {
  const { hospitalId } = useParams<{ hospitalId: string }>();

  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BookingResult | null>(null);

  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [preferredDate, setPreferredDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [customValues, setCustomValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!hospitalId) return;
    loadData();
  }, [hospitalId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [hospitalRes, doctorsRes, fieldsRes] = await Promise.all([
        supabase.from('hospitals').select('id, name, logo_url, phone, address').eq('id', hospitalId!).maybeSingle(),
        supabase.from('profiles').select('id, full_name, designation, department').eq('hospital_id', hospitalId!).eq('role', 'doctor').eq('is_active', true).order('full_name'),
        supabase.from('custom_fields_config').select('id, field_label, field_type, is_mandatory, options, sort_order').eq('hospital_id', hospitalId!).eq('form_name', 'appointment').eq('is_public', true).eq('is_active', true).order('sort_order'),
      ]);

      if (!hospitalRes.data) {
        setError('Hospital not found');
        setLoading(false);
        return;
      }

      setHospital(hospitalRes.data as Hospital);
      setDoctors((doctorsRes.data ?? []) as Doctor[]);
      setCustomFields((fieldsRes.data ?? []) as CustomField[]);
    } catch {
      setError('Failed to load booking form');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !mobile || !age || !gender || !doctorId || !preferredDate) {
      setError('Please fill all required fields');
      return;
    }

    for (const field of customFields) {
      if (field.is_mandatory && !customValues[field.id]) {
        setError(`Please fill: ${field.field_label}`);
        return;
      }
    }

    const parsedAge = parseInt(age);
    if (isNaN(parsedAge) || parsedAge < 0 || parsedAge > 150) {
      setError('Please enter a valid age');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const dob = new Date();
      dob.setFullYear(dob.getFullYear() - parsedAge);
      dob.setMonth(0, 1);

      const { data: existingPatient } = await supabase
        .from('patients')
        .select('id, uhid')
        .eq('hospital_id', hospitalId!)
        .eq('phone', mobile)
        .maybeSingle();

      let patientId: string;

      if (existingPatient) {
        patientId = (existingPatient as { id: string }).id;
      } else {
        const uhid = `QR${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
        const { data: newPatient, error: patientErr } = await supabase
          .from('patients')
          .insert({
            hospital_id: hospitalId,
            full_name: name,
            phone: mobile,
            age: parseInt(age),
            gender,
            date_of_birth: format(dob, 'yyyy-MM-dd'),
            uhid,
            registration_type: 'qr_booking',
            address: '',
            city: '',
            state: '',
          } as never)
          .select('id')
          .single();

        if (patientErr) throw patientErr;
        patientId = (newPatient as { id: string }).id;
      }

      const { data: tokenData } = await supabase.rpc('generate_doctor_token' as never, {
        p_hospital_id: hospitalId,
        p_doctor_id: doctorId,
        p_date: preferredDate,
      } as never);
      const token = (tokenData as unknown as number) ?? 1;

      const { error: apptErr } = await supabase
        .from('appointments')
        .insert({
          hospital_id: hospitalId,
          patient_id: patientId,
          doctor_id: doctorId,
          appointment_date: preferredDate,
          appointment_time: '09:00',
          type: 'opd',
          status: 'qr_booked',
          token_number: token,
          custom_field_values: Object.keys(customValues).length > 0 ? customValues : undefined,
        } as never);

      if (apptErr) throw apptErr;

      const doctor = doctors.find(d => d.id === doctorId);
      setResult({
        token,
        doctor_name: doctor?.full_name ?? '',
        date: preferredDate,
      });
    } catch (err) {
      setError((err as Error).message || 'Failed to book appointment');
    } finally {
      setSubmitting(false);
    }
  };

  const addToCalendar = () => {
    if (!result) return;
    const startDate = new Date(`${result.date}T09:00:00`);
    const endDate = new Date(`${result.date}T09:30:00`);
    const title = `Doctor Appointment - Dr. ${result.doctor_name}`;
    const details = `Token: #${result.token}\nHospital: ${hospital?.name}`;
    const url = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${format(startDate, "yyyyMMdd'T'HHmmss")}/${format(endDate, "yyyyMMdd'T'HHmmss")}&details=${encodeURIComponent(details)}`;
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error && !hospital) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  if (result) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Appointment Booked!</h2>
            <div className="mt-6 p-4 bg-gray-50 rounded-xl space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Token Number</span>
                <span className="text-2xl font-bold text-blue-600">#{result.token}</span>
              </div>
              <div className="border-t pt-3 flex items-center justify-between text-sm">
                <span className="text-gray-500">Doctor</span>
                <span className="font-medium text-gray-800">Dr. {result.doctor_name}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Date</span>
                <span className="font-medium text-gray-800">
                  {format(new Date(result.date + 'T00:00:00'), 'dd MMM yyyy')}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Patient</span>
                <span className="font-medium text-gray-800">{name}</span>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-4">
              Please arrive 15 minutes before your appointment time.
            </p>
            <div className="mt-6 space-y-2">
              <Button
                onClick={addToCalendar}
                className="w-full gap-2 bg-blue-600 hover:bg-blue-700"
              >
                <CalendarPlus className="w-4 h-4" />
                Add to Google Calendar
              </Button>
              <Button
                variant="outline"
                onClick={() => { setResult(null); setName(''); setMobile(''); setAge(''); setGender(''); setDoctorId(''); setCustomValues({}); }}
                className="w-full"
              >
                Book Another Appointment
              </Button>
            </div>
          </div>
          {hospital && (
            <p className="text-center text-xs text-gray-400 mt-4">
              {hospital.name} {hospital.phone && `| ${hospital.phone}`}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="w-full max-w-md mx-auto px-4 py-6">
        <div className="text-center mb-6">
          {hospital?.logo_url ? (
            <img src={hospital.logo_url} alt={hospital.name} className="w-16 h-16 object-contain mx-auto mb-3 rounded-xl" />
          ) : (
            <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Building2 className="w-8 h-8 text-blue-600" />
            </div>
          )}
          <h1 className="text-xl font-bold text-gray-800">{hospital?.name}</h1>
          <p className="text-sm text-gray-500 mt-1">Book Your Appointment</p>
          {hospital?.address && (
            <p className="text-xs text-gray-400 mt-1">{hospital.address}</p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-gray-600 uppercase tracking-wide block mb-1.5">
              <User className="w-3 h-3 inline mr-1" />
              Patient Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              required
              className="w-full h-11 px-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 uppercase tracking-wide block mb-1.5">
              <Phone className="w-3 h-3 inline mr-1" />
              Mobile Number *
            </label>
            <input
              type="tel"
              value={mobile}
              onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="10-digit mobile number"
              required
              pattern="[0-9]{10}"
              className="w-full h-11 px-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 uppercase tracking-wide block mb-1.5">
                Age *
              </label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="Age"
                min={0}
                max={150}
                required
                className="w-full h-11 px-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 uppercase tracking-wide block mb-1.5">
                Gender *
              </label>
              <Select value={gender} onValueChange={setGender}>
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 uppercase tracking-wide block mb-1.5">
              <Stethoscope className="w-3 h-3 inline mr-1" />
              Select Doctor *
            </label>
            {doctors.length === 0 ? (
              <p className="text-sm text-gray-500 bg-gray-50 rounded-xl px-3 py-3">No doctors available for booking at this time.</p>
            ) : (
              <Select value={doctorId} onValueChange={setDoctorId}>
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue placeholder="Choose a doctor" />
                </SelectTrigger>
                <SelectContent>
                  {doctors.map((doc) => (
                    <SelectItem key={doc.id} value={doc.id}>
                      <div className="flex flex-col">
                        <span>Dr. {doc.full_name}</span>
                        {doc.department && (
                          <span className="text-xs text-gray-500">{doc.department}</span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 uppercase tracking-wide block mb-1.5">
              <Calendar className="w-3 h-3 inline mr-1" />
              Preferred Date *
            </label>
            <input
              type="date"
              value={preferredDate}
              onChange={(e) => setPreferredDate(e.target.value)}
              min={format(new Date(), 'yyyy-MM-dd')}
              required
              className="w-full h-11 px-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {customFields.map((field) => (
            <div key={field.id}>
              <label className="text-xs font-medium text-gray-600 uppercase tracking-wide block mb-1.5">
                {field.field_label} {field.is_mandatory && '*'}
              </label>
              {field.field_type === 'dropdown' ? (
                <Select
                  value={customValues[field.id] || ''}
                  onValueChange={(v) => setCustomValues(prev => ({ ...prev, [field.id]: v }))}
                >
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue placeholder={`Select ${field.field_label}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {field.options.map((opt) => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : field.field_type === 'toggle' ? (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={customValues[field.id] === 'true'}
                    onChange={(e) => setCustomValues(prev => ({ ...prev, [field.id]: String(e.target.checked) }))}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-600">Yes</span>
                </label>
              ) : (
                <input
                  type={field.field_type === 'date' ? 'date' : 'text'}
                  value={customValues[field.id] || ''}
                  onChange={(e) => setCustomValues(prev => ({ ...prev, [field.id]: e.target.value }))}
                  placeholder={field.field_label}
                  required={field.is_mandatory}
                  className="w-full h-11 px-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              )}
            </div>
          ))}

          <Button
            type="submit"
            disabled={submitting}
            className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-base gap-2 rounded-xl mt-2"
          >
            {submitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Clock className="w-4 h-4" />
                Book Appointment
              </>
            )}
          </Button>
        </form>

        {hospital?.phone && (
          <p className="text-center text-xs text-gray-400 mt-4">
            Need help? Call {hospital.phone}
          </p>
        )}
      </div>
    </div>
  );
}
