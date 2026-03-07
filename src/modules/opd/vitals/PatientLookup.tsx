import { useState, useCallback, useRef } from 'react';
import { Search, User, Loader2, X } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAppSelector } from '../../../store';
import { toast } from 'sonner';

const SAMPLE_HOSPITAL_ID = '11111111-1111-1111-1111-111111111111';

interface PatientResult {
  id: string;
  uhid: string;
  full_name: string;
  phone: string;
  gender: string;
  date_of_birth: string | null;
}

interface Props {
  selectedPatient: PatientResult | null;
  onSelect: (p: PatientResult | null) => void;
  selectedAppointmentId: string | null;
  onSelectAppointment: (id: string | null) => void;
}

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  type: string;
  chief_complaint: string | null;
}

export default function PatientLookup({ selectedPatient, onSelect, selectedAppointmentId, onSelectAppointment }: Props) {
  const { user } = useAppSelector((s) => s.auth);
  const hospitalId = user?.hospital_id ?? SAMPLE_HOSPITAL_ID;

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PatientResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loadingAppts, setLoadingAppts] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(async (q: string) => {
    if (!q.trim() || q.length < 2) { setResults([]); return; }
    setLoading(true);
    try {
      const { data } = await supabase
        .from('patients')
        .select('id, uhid, full_name, phone, gender, date_of_birth')
        .eq('hospital_id', hospitalId)
        .or(`full_name.ilike.%${q}%,uhid.ilike.%${q}%,phone.ilike.%${q}%`)
        .limit(8);
      setResults((data ?? []) as PatientResult[]);
    } catch {
      setResults([]);
      toast.error('Failed to search patients');
    } finally {
      setLoading(false);
    }
  }, [hospitalId]);

  const handleChange = (val: string) => {
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 300);
  };

  const loadAppointments = async (patientId: string) => {
    setLoadingAppts(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('appointments')
        .select('id, appointment_date, appointment_time, type, chief_complaint')
        .eq('patient_id', patientId)
        .gte('appointment_date', today)
        .neq('status', 'cancelled')
        .order('appointment_date', { ascending: true })
        .limit(5);
      setAppointments((data ?? []) as Appointment[]);
    } catch {
      setAppointments([]);
      toast.error('Failed to load appointments');
    } finally {
      setLoadingAppts(false);
    }
  };

  const handleSelect = (p: PatientResult) => {
    onSelect(p);
    onSelectAppointment(null);
    setResults([]);
    setQuery('');
    loadAppointments(p.id);
  };

  const handleClear = () => {
    onSelect(null);
    onSelectAppointment(null);
    setQuery('');
    setResults([]);
    setAppointments([]);
  };

  function formatAge(dob: string | null): string {
    if (!dob) return '';
    const years = Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 3600 * 1000));
    return `${years}y`;
  }

  function fmtApptTime(t: string) {
    const [h, m] = t.split(':');
    const hr = parseInt(h);
    return `${hr % 12 || 12}:${m} ${hr >= 12 ? 'PM' : 'AM'}`;
  }

  if (selectedPatient) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-100 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
              {selectedPatient.full_name.split(' ').slice(0, 2).map((n) => n[0]).join('')}
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">{selectedPatient.full_name}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                UHID: <span className="font-medium text-blue-700">{selectedPatient.uhid}</span>
                {selectedPatient.date_of_birth && <span className="ml-2">{formatAge(selectedPatient.date_of_birth)}</span>}
                <span className="ml-2 capitalize">{selectedPatient.gender}</span>
                {selectedPatient.phone && <span className="ml-2">{selectedPatient.phone}</span>}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="p-1.5 rounded-lg hover:bg-blue-100 text-blue-400 hover:text-blue-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {loadingAppts ? (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Loading appointments…
          </div>
        ) : appointments.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Select Appointment (Optional)</p>
            <div className="space-y-1.5">
              <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${selectedAppointmentId === null ? 'border-blue-300 bg-blue-50' : 'border-gray-100 hover:border-gray-200 bg-white'}`}>
                <input
                  type="radio"
                  name="appt"
                  checked={selectedAppointmentId === null}
                  onChange={() => onSelectAppointment(null)}
                  className="accent-blue-600"
                />
                <span className="text-sm text-gray-600">No appointment — standalone vitals</span>
              </label>
              {appointments.map((a) => (
                <label key={a.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${selectedAppointmentId === a.id ? 'border-blue-300 bg-blue-50' : 'border-gray-100 hover:border-gray-200 bg-white'}`}>
                  <input
                    type="radio"
                    name="appt"
                    checked={selectedAppointmentId === a.id}
                    onChange={() => onSelectAppointment(a.id)}
                    className="accent-blue-600"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800">
                      {new Date(a.appointment_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      {' · '}
                      {fmtApptTime(a.appointment_time)}
                    </p>
                    {a.chief_complaint && (
                      <p className="text-xs text-gray-400 truncate">{a.chief_complaint}</p>
                    )}
                  </div>
                  <span className="text-xs text-gray-400 capitalize shrink-0">{a.type.replace('_', '-')}</span>
                </label>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Search by patient name, UHID or phone number…"
          className="w-full h-10 pl-9 pr-4 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 text-sm outline-none transition-all"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400 animate-spin" />
        )}
      </div>

      {results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
          {results.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => handleSelect(p)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-colors text-left border-b border-gray-50 last:border-0"
            >
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-xs shrink-0">
                {p.full_name.split(' ').slice(0, 2).map((n) => n[0]).join('')}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">{p.full_name}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {p.uhid} · {p.phone}
                  {p.date_of_birth && ` · ${formatAge(p.date_of_birth)}`}
                  {' · '}<span className="capitalize">{p.gender}</span>
                </p>
              </div>
              <User className="w-4 h-4 text-gray-300 shrink-0" />
            </button>
          ))}
        </div>
      )}

      {query.length >= 2 && !loading && results.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 px-4 py-6 text-center text-gray-400">
          <User className="w-6 h-6 mx-auto mb-1.5 opacity-30" />
          <p className="text-sm">No patients found for "{query}"</p>
        </div>
      )}
    </div>
  );
}
