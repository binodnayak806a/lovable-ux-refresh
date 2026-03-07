import { useState, useEffect } from 'react';
import {
  X, Search, User, Stethoscope, FileText, CreditCard,
  Shield, Loader2, Users, CheckSquare, Phone, MapPin, IdCard,
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { useAppSelector } from '../../../store';
import { useToast } from '../../../hooks/useToast';
import { supabase } from '../../../lib/supabase';
import ipdService from '../../../services/ipd.service';
import type {
  Bed, AdmissionFormData, AdmissionType, BillingCategory,
  KinDetails, AdmissionChecklist,
} from '../types';
import {
  EMPTY_ADMISSION_FORM, RELATIONSHIP_OPTIONS, ID_PROOF_OPTIONS, CHECKLIST_LABELS,
} from '../types';
import { cn } from '../../../lib/utils';

interface PatientResult {
  id: string;
  uhid: string;
  full_name: string;
  phone: string;
  gender: string;
  date_of_birth: string | null;
  blood_group: string | null;
}

interface DoctorResult {
  id: string;
  full_name: string;
  department: string | null;
}

interface Props {
  bed: Bed;
  onClose: () => void;
  onSuccess: () => void;
}

function calculateAge(dob: string | null): string {
  if (!dob) return '-';
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return `${age} yrs`;
}

type FormSection = 'patient' | 'kin' | 'checklist';

export default function AdmissionDialog({ bed, onClose, onSuccess }: Props) {
  const { user } = useAppSelector((s) => s.auth);
  const { toast } = useToast();

  const [form, setForm] = useState<AdmissionFormData>({
    ...EMPTY_ADMISSION_FORM,
    bed_id: bed.id,
    ward_id: bed.ward_id,
  });
  const [submitting, setSubmitting] = useState(false);
  const [activeSection, setActiveSection] = useState<FormSection>('patient');
  const [depositAmount, setDepositAmount] = useState(0);
  const [depositMode, setDepositMode] = useState('Cash');

  const [patientSearch, setPatientSearch] = useState('');
  const [patients, setPatients] = useState<PatientResult[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientResult | null>(null);
  const [searchingPatients, setSearchingPatients] = useState(false);

  const [doctors, setDoctors] = useState<DoctorResult[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);

  useEffect(() => {
    const loadDoctors = async () => {
      try {
        const data = await ipdService.getDoctors();
        setDoctors(data);
      } catch {
        setDoctors([]);
        toast('Load Error', { description: 'Failed to load doctors', type: 'error' });
      } finally {
        setLoadingDoctors(false);
      }
    };
    loadDoctors();
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (patientSearch.length >= 2) {
        setSearchingPatients(true);
        try {
          const { data } = await supabase
            .from('patients')
            .select('id, uhid, full_name, phone, gender, date_of_birth, blood_group')
            .or(`full_name.ilike.%${patientSearch}%,uhid.ilike.%${patientSearch}%,phone.ilike.%${patientSearch}%`)
            .limit(10);
          setPatients((data ?? []) as PatientResult[]);
        } catch {
          setPatients([]);
          toast('Search Failed', { description: 'Unable to search patients', type: 'error' });
        } finally {
          setSearchingPatients(false);
        }
      } else {
        setPatients([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [patientSearch]);

  const handlePatientSelect = (patient: PatientResult) => {
    setSelectedPatient(patient);
    setForm((prev) => ({ ...prev, patient_id: patient.id }));
    setPatientSearch('');
    setPatients([]);
  };

  const handleChange = (field: keyof AdmissionFormData, value: string | number | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleKinChange = (field: keyof KinDetails, value: string) => {
    setForm((prev) => ({
      ...prev,
      kin: { ...prev.kin, [field]: value },
    }));
  };

  const handleChecklistChange = (field: keyof AdmissionChecklist) => {
    setForm((prev) => ({
      ...prev,
      checklist: { ...prev.checklist, [field]: !prev.checklist[field] },
    }));
  };

  const checklistComplete = Object.values(form.checklist).filter(Boolean).length;
  const checklistTotal = Object.keys(form.checklist).length;

  const handleSubmit = async () => {
    if (!selectedPatient) {
      toast('Select Patient', { description: 'Please search and select a patient', type: 'error' });
      return;
    }
    if (!form.doctor_id) {
      toast('Select Doctor', { description: 'Please select an admitting doctor', type: 'error' });
      return;
    }
    if (!form.primary_diagnosis.trim()) {
      toast('Diagnosis Required', { description: 'Please enter primary diagnosis', type: 'error' });
      return;
    }
    if (!form.kin.name.trim() || !form.kin.phone.trim()) {
      toast('Next of Kin Required', { description: 'Please provide kin name and phone number', type: 'error' });
      setActiveSection('kin');
      return;
    }

    setSubmitting(true);
    try {
      const hospitalId = user?.hospital_id ?? '';
      const admission = await ipdService.createAdmission(form, hospitalId, user?.id ?? '');

      if (depositAmount > 0) {
        await supabase.from('admissions').update({ deposit_amount: depositAmount } as never).eq('id', admission.id);
        await supabase.from('ipd_payments').insert({
          admission_id: admission.id,
          hospital_id: hospitalId,
          amount: depositAmount,
          payment_mode: depositMode,
          receipt_number: `DEP-${Date.now()}`,
          notes: 'Admission deposit',
          created_by: user?.id,
        } as never);
      }

      onSuccess();
    } catch (err: unknown) {
      toast('Admission Failed', {
        description: err instanceof Error ? err.message : 'Could not create admission',
        type: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const sections: Array<{ id: FormSection; label: string; icon: typeof User }> = [
    { id: 'patient', label: 'Patient & Clinical', icon: User },
    { id: 'kin', label: 'Next of Kin', icon: Users },
    { id: 'checklist', label: 'Checklist', icon: CheckSquare },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Admit Patient</h2>
            <p className="text-sm text-gray-500">
              Bed {bed.bed_number} - {bed.ward?.name}
            </p>
          </div>
          <button type="button" onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex border-b border-gray-100 px-6">
          {sections.map(sec => {
            const Icon = sec.icon;
            return (
              <button key={sec.id} onClick={() => setActiveSection(sec.id)}
                className={cn('flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px',
                  activeSection === sec.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                )}>
                <Icon className="w-3.5 h-3.5" />
                {sec.label}
                {sec.id === 'checklist' && (
                  <span className={cn('text-xs px-1.5 py-0.5 rounded-full font-bold ml-1',
                    checklistComplete === checklistTotal
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-gray-100 text-gray-500'
                  )}>
                    {checklistComplete}/{checklistTotal}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {activeSection === 'patient' && (
            <>
              <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-500" />
                  Patient *
                </label>

                {selectedPatient ? (
                  <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-semibold text-gray-800">{selectedPatient.full_name}</div>
                        <div className="text-sm text-gray-500 mt-1">
                          UHID: {selectedPatient.uhid} | {calculateAge(selectedPatient.date_of_birth)} |{' '}
                          {selectedPatient.gender} | {selectedPatient.blood_group || 'Blood group N/A'}
                        </div>
                        <div className="text-sm text-gray-500">{selectedPatient.phone}</div>
                      </div>
                      <button type="button"
                        onClick={() => { setSelectedPatient(null); setForm((prev) => ({ ...prev, patient_id: '' })); }}
                        className="text-xs text-blue-600 hover:underline">
                        Change
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="text" value={patientSearch}
                      onChange={(e) => setPatientSearch(e.target.value)}
                      placeholder="Search by name, UHID, or phone..."
                      className="w-full h-11 pl-10 pr-4 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
                    {searchingPatients && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />
                    )}
                    {patients.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                        {patients.map((p) => (
                          <button key={p.id} type="button" onClick={() => handlePatientSelect(p)}
                            className="w-full px-4 py-2.5 text-left hover:bg-gray-50 border-b border-gray-100 last:border-0">
                            <div className="font-medium text-sm text-gray-800">{p.full_name}</div>
                            <div className="text-xs text-gray-500">{p.uhid} | {p.phone} | {p.gender}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Stethoscope className="w-4 h-4 text-blue-500" />
                    Admitting Doctor *
                  </label>
                  <select value={form.doctor_id} onChange={(e) => handleChange('doctor_id', e.target.value)}
                    disabled={loadingDoctors}
                    className="w-full h-11 px-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400">
                    <option value="">Select doctor</option>
                    {doctors.map((d) => (
                      <option key={d.id} value={d.id}>
                        Dr. {d.full_name} {d.department ? `(${d.department})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Admission Type</label>
                  <div className="flex gap-2">
                    {(['planned', 'emergency', 'transfer'] as AdmissionType[]).map((type) => (
                      <button key={type} type="button" onClick={() => handleChange('admission_type', type)}
                        className={cn('flex-1 h-11 rounded-xl border text-sm font-medium transition-colors capitalize',
                          form.admission_type === type
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                        )}>
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-500" />
                  Primary Diagnosis *
                </label>
                <textarea value={form.primary_diagnosis} onChange={(e) => handleChange('primary_diagnosis', e.target.value)}
                  placeholder="Enter primary diagnosis..." rows={2}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400 resize-none" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Secondary Diagnosis</label>
                <input type="text" value={form.secondary_diagnosis}
                  onChange={(e) => handleChange('secondary_diagnosis', e.target.value)}
                  placeholder="Enter secondary diagnosis..."
                  className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400" />
              </div>

              <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-blue-500" />
                  Billing Category
                </label>
                <div className="flex flex-wrap gap-2">
                  {(['Cash', 'Insurance', 'TPA', 'Corporate'] as BillingCategory[]).map((cat) => (
                    <button key={cat} type="button" onClick={() => handleChange('billing_category', cat)}
                      className={cn('px-4 py-2 rounded-xl border text-sm font-medium transition-colors',
                        form.billing_category === cat
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      )}>
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {form.billing_category !== 'Cash' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-blue-500" />
                      {form.billing_category === 'TPA' ? 'TPA Name' : 'Insurance Company'}
                    </label>
                    <input type="text" value={form.insurance_company}
                      onChange={(e) => handleChange('insurance_company', e.target.value)}
                      placeholder="Enter company name..."
                      className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">Policy Number</label>
                    <input type="text" value={form.policy_number}
                      onChange={(e) => handleChange('policy_number', e.target.value)}
                      placeholder="Enter policy number..."
                      className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400" />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Estimated Stay (Days)</label>
                  <input type="number" min="1" value={form.estimated_stay_days}
                    onChange={(e) => handleChange('estimated_stay_days', parseInt(e.target.value) || 1)}
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">MLC Case</label>
                  <div className="flex gap-3 mt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" checked={!form.mlc_case} onChange={() => handleChange('mlc_case', false)} className="w-4 h-4 text-blue-600" />
                      <span className="text-sm">No</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" checked={form.mlc_case} onChange={() => handleChange('mlc_case', true)} className="w-4 h-4 text-blue-600" />
                      <span className="text-sm">Yes</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-emerald-500" />
                    Deposit Amount (Rs)
                  </label>
                  <input type="number" min="0" step="100"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Deposit Payment Mode</label>
                  <select value={depositMode} onChange={(e) => setDepositMode(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400">
                    <option value="Cash">Cash</option>
                    <option value="Card">Card</option>
                    <option value="UPI">UPI</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Notes</label>
                <textarea value={form.notes} onChange={(e) => handleChange('notes', e.target.value)}
                  placeholder="Any additional notes..." rows={2}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400 resize-none" />
              </div>
            </>
          )}

          {activeSection === 'kin' && (
            <div className="space-y-5">
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
                <p className="text-sm text-blue-800 font-medium flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Next of Kin / Emergency Contact
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  This information is mandatory for all inpatient admissions
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-gray-400" />
                    Full Name *
                  </label>
                  <input type="text" value={form.kin.name} onChange={e => handleKinChange('name', e.target.value)}
                    placeholder="Next of kin name"
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Relationship</label>
                  <select value={form.kin.relationship} onChange={e => handleKinChange('relationship', e.target.value)}
                    className="w-full h-11 px-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400">
                    <option value="">Select relationship</option>
                    {RELATIONSHIP_OPTIONS.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-gray-400" />
                    Phone Number *
                  </label>
                  <input type="tel" value={form.kin.phone} onChange={e => handleKinChange('phone', e.target.value)}
                    placeholder="Phone number"
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-gray-400" />
                    Address
                  </label>
                  <input type="text" value={form.kin.address} onChange={e => handleKinChange('address', e.target.value)}
                    placeholder="Address"
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                    <IdCard className="w-3.5 h-3.5 text-gray-400" />
                    ID Proof Type
                  </label>
                  <select value={form.kin.id_proof_type} onChange={e => handleKinChange('id_proof_type', e.target.value)}
                    className="w-full h-11 px-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400">
                    <option value="">Select ID type</option>
                    {ID_PROOF_OPTIONS.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">ID Proof Number</label>
                  <input type="text" value={form.kin.id_proof_number}
                    onChange={e => handleKinChange('id_proof_number', e.target.value)}
                    placeholder="ID number"
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400" />
                </div>
              </div>
            </div>
          )}

          {activeSection === 'checklist' && (
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
                <p className="text-sm text-amber-800 font-medium flex items-center gap-2">
                  <CheckSquare className="w-4 h-4" />
                  Admission Checklist
                </p>
                <p className="text-xs text-amber-600 mt-1">
                  Complete all items before finalizing admission ({checklistComplete}/{checklistTotal} done)
                </p>
              </div>

              <div className="space-y-2">
                {(Object.keys(CHECKLIST_LABELS) as Array<keyof AdmissionChecklist>).map(key => (
                  <button key={key} type="button" onClick={() => handleChecklistChange(key)}
                    className={cn(
                      'w-full flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all text-left',
                      form.checklist[key]
                        ? 'border-emerald-200 bg-emerald-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    )}>
                    <div className={cn(
                      'w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors',
                      form.checklist[key]
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'border-gray-300'
                    )}>
                      {form.checklist[key] && (
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className={cn('text-sm font-medium',
                      form.checklist[key] ? 'text-emerald-800' : 'text-gray-700'
                    )}>
                      {CHECKLIST_LABELS[key]}
                    </span>
                  </button>
                ))}
              </div>

              {checklistComplete === checklistTotal && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                  <p className="text-sm font-medium text-emerald-700">All checklist items complete!</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between rounded-b-2xl">
          <div className="text-xs text-gray-500">
            {checklistComplete < checklistTotal && (
              <span className="text-amber-600 font-medium">
                {checklistTotal - checklistComplete} checklist item(s) pending
              </span>
            )}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} disabled={submitting}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={submitting || !selectedPatient}
              className="bg-blue-600 hover:bg-blue-700 gap-2">
              {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Admitting...</> : 'Admit Patient'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
