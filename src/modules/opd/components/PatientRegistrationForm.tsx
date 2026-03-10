import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Save, Trash2, AlertTriangle, Users, User, MapPin, ClipboardList, CreditCard, CheckCircle, Plus, X } from 'lucide-react';
import QuickBookAppointment from '../../patients/components/QuickBookAppointment';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Badge } from '../../../components/ui/badge';
import { Textarea } from '../../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { useAppSelector } from '../../../store';
import { useToast } from '../../../hooks/useToast';
import opdService from '../../../services/opd.service';
import { mockStore } from '../../../lib/mockStore';
import { FormField, InputField } from './FormField';
import type { RegistrationFormData } from '../types';
import { EMPTY_FORM, BLOOD_GROUPS, INDIAN_STATES, RELATIONSHIP_OPTIONS, PRE_EXISTING_CONDITIONS } from '../types';
import { cn } from '../../../lib/utils';

const DRAFT_KEY = 'opd_registration_draft';
const SAMPLE_HOSPITAL_ID = '11111111-1111-1111-1111-111111111111';

const BILLING_OPTIONS = [
  { value: 'cash', label: 'Cash / Self Pay', desc: 'Patient pays directly', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  { value: 'insurance', label: 'Insurance', desc: 'Health insurance', color: 'text-blue-700 bg-blue-50 border-blue-200' },
  { value: 'tpa', label: 'TPA', desc: 'Third party', color: 'text-amber-700 bg-amber-50 border-amber-200' },
];

function validate(form: RegistrationFormData): Partial<Record<keyof RegistrationFormData, string>> {
  const errs: Partial<Record<keyof RegistrationFormData, string>> = {};
  if (!form.firstName.trim()) errs.firstName = 'First name is required';
  if (!form.dateOfBirth && !form.ageYears) errs.dateOfBirth = 'Date of birth or age is required';
  if (!form.gender) errs.gender = 'Gender is required';
  if (!form.phone.trim()) errs.phone = 'Mobile number is required';
  else if (!/^[0-9]{10}$/.test(form.phone)) errs.phone = 'Must be exactly 10 digits';
  if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Invalid email';
  if (form.aadharNumber && !/^[0-9]{12}$/.test(form.aadharNumber)) errs.aadharNumber = 'Must be 12 digits';
  if (form.pincode && !/^[0-9]{6}$/.test(form.pincode)) errs.pincode = 'Must be 6 digits';
  if (form.guardianPhone && !/^[0-9]{10}$/.test(form.guardianPhone)) errs.guardianPhone = 'Must be 10 digits';
  if ((form.billingCategory === 'insurance' || form.billingCategory === 'tpa') && !form.insuranceCompany.trim()) {
    errs.insuranceCompany = 'Company name is required';
  }
  if ((form.billingCategory === 'insurance' || form.billingCategory === 'tpa') && !form.policyNumber.trim()) {
    errs.policyNumber = 'Policy / ID number is required';
  }
  return errs;
}

interface DuplicatePatient {
  id: string;
  full_name: string;
  uhid: string;
  phone: string;
  age: number | null;
  gender: string;
}

interface Props {
  onSuccess?: (patientId: string) => void;
  onCancel?: () => void;
  /** Pass patient data for edit mode */
  editPatientId?: string;
  initialData?: Partial<RegistrationFormData>;
}

export default function PatientRegistrationForm({ onSuccess, onCancel, editPatientId, initialData }: Props) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAppSelector((s) => s.auth);
  const hospitalId = user?.hospital_id ?? SAMPLE_HOSPITAL_ID;
  const isEditMode = !!editPatientId;

  const [form, setForm] = useState<RegistrationFormData>(() => {
    if (initialData) return { ...EMPTY_FORM, ...initialData };
    if (isEditMode) return EMPTY_FORM;
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) return { ...EMPTY_FORM, ...JSON.parse(saved) };
    } catch { /* noop */ }
    return EMPTY_FORM;
  });
  const [errors, setErrors] = useState<Partial<Record<keyof RegistrationFormData, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [duplicates, setDuplicates] = useState<DuplicatePatient[]>([]);
  const [dismissedDuplicates, setDismissedDuplicates] = useState(false);
  const [allergyInput, setAllergyInput] = useState('');
  const [registeredPatient, setRegisteredPatient] = useState<{ id: string; uhid: string; name: string } | null>(null);

  const saveDraft = useCallback((data: RegistrationFormData) => {
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(data)); } catch { /* noop */ }
  }, []);

  const handleChange = useCallback((field: keyof RegistrationFormData, value: string | string[]) => {
    setForm((prev) => {
      const updated = { ...prev, [field]: value };
      saveDraft(updated);
      return updated;
    });
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, [saveDraft]);

  const hasDraft = JSON.stringify(form) !== JSON.stringify(EMPTY_FORM);

  const clearDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
    setForm(EMPTY_FORM);
    setErrors({});
    setShowClearConfirm(false);
    setDuplicates([]);
    setDismissedDuplicates(false);
  };

  const addAllergy = () => {
    const trimmed = allergyInput.trim();
    if (trimmed && !form.allergies.includes(trimmed)) {
      handleChange('allergies', [...form.allergies, trimmed]);
    }
    setAllergyInput('');
  };

  const handleSubmit = async () => {
    const errs = validate(form);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    if (isEditMode) {
      setSubmitting(true);
      try {
        await opdService.updatePatient(editPatientId, form);
        toast('Patient Updated!', { description: 'Patient details saved successfully.', type: 'success' });
        if (onSuccess) onSuccess(editPatientId);
      } catch (err: unknown) {
        toast('Update Failed', { description: err instanceof Error ? err.message : 'Something went wrong.', type: 'error' });
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // Check duplicates
    if (!dismissedDuplicates) {
      try {
        const fullName = `${form.firstName.trim()} ${form.lastName.trim()}`.trim();
        const allPatients = mockStore.getPatients(hospitalId);
        const found = allPatients
          .filter(p => p.phone === form.phone || p.full_name.toLowerCase() === fullName.toLowerCase())
          .slice(0, 3)
          .map(p => ({ id: p.id, full_name: p.full_name, uhid: p.uhid, phone: p.phone, age: p.age, gender: p.gender }));
        if (found.length > 0) {
          setDuplicates(found);
          return;
        }
      } catch { /* noop */ }
    }

    setSubmitting(true);
    try {
      const { patient } = await opdService.registerPatient(hospitalId, user?.id ?? '', form);
      const p = patient as { id: string; uhid: string };
      localStorage.removeItem(DRAFT_KEY);
      toast('Patient Registered!', { description: `UHID: ${p.uhid}`, type: 'success' });
      const patientName = `${form.firstName} ${form.lastName}`.trim();
      setRegisteredPatient({ id: p.id, uhid: p.uhid, name: patientName });
    } catch (err: unknown) {
      toast('Registration Failed', { description: err instanceof Error ? err.message : 'Something went wrong.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const phoneValid = form.phone.length === 10 && /^[6-9]/.test(form.phone);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-5 pb-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{isEditMode ? 'Edit Patient Details' : 'New Patient Registration'}</h2>
          <p className="text-sm text-gray-500 mt-0.5">{isEditMode ? 'Update patient information' : 'Fill all required details in a single form'}</p>
        </div>
        <div className="flex items-center gap-2">
          {hasDraft && (
            <Button variant="ghost" size="sm" onClick={() => setShowClearConfirm(true)} className="h-8 text-xs text-gray-400 hover:text-red-500 gap-1">
              <Trash2 className="w-3.5 h-3.5" /> Clear Draft
            </Button>
          )}
        </div>
      </div>

      {showClearConfirm && (
        <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-red-700 text-sm">
            <AlertTriangle className="w-4 h-4 shrink-0" /> Clear all form data?
          </div>
          <div className="flex gap-2 shrink-0">
            <Button size="sm" variant="outline" className="h-7 text-xs border-red-200 text-red-600" onClick={clearDraft}>Clear</Button>
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setShowClearConfirm(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {duplicates.length > 0 && (
        <div className="mx-6 mt-4 p-4 bg-amber-50 border border-amber-300 rounded-xl">
          <div className="flex items-start gap-2 mb-3">
            <Users className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-800">Possible Duplicate Patients Found</p>
              <p className="text-xs text-amber-700 mt-0.5">Please confirm this is a new patient.</p>
            </div>
          </div>
          <div className="space-y-1.5 mb-3">
            {duplicates.map((p) => (
              <div key={p.id} className="flex items-center justify-between bg-white border border-amber-200 rounded-lg px-3 py-2">
                <span className="text-sm font-semibold text-gray-800">{p.full_name} <span className="text-xs text-gray-500 ml-1">UHID: {p.uhid}</span></span>
                <span className="text-xs text-gray-500">{p.phone} · {p.age ? `${p.age}y` : ''} {p.gender}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="h-7 text-xs border-amber-300 text-amber-700" onClick={() => { setDismissedDuplicates(true); setDuplicates([]); }}>
              Continue as New Patient
            </Button>
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setDuplicates([])}>Cancel</Button>
          </div>
        </div>
      )}

      <div className="p-6 space-y-8">
        {/* ─── PERSONAL INFO ─── */}
        <section>
          <div className="flex items-center gap-3 pb-3 border-b border-gray-100 mb-4">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <User className="w-4 h-4 text-blue-600" />
            </div>
            <h3 className="text-base font-semibold text-gray-900">Personal Information</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <InputField label="First Name" required placeholder="First name" value={form.firstName} onChange={(v) => handleChange('firstName', v)} error={errors.firstName} autoFocus />
            <InputField label="Middle Name" placeholder="Middle name" value={form.middleName} onChange={(v) => handleChange('middleName', v)} />
            <InputField label="Last Name" placeholder="Last name" value={form.lastName} onChange={(v) => handleChange('lastName', v)} />
            <InputField
              label="Date of Birth" type="date" value={form.dateOfBirth}
              onChange={(v) => {
                handleChange('dateOfBirth', v);
                if (v) {
                  const age = Math.floor((Date.now() - new Date(v).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
                  handleChange('ageYears', String(Math.max(0, age)));
                }
              }}
              error={errors.dateOfBirth} hint="Or enter age if DOB unknown"
            />
            <InputField label="Age (years)" type="number" placeholder="e.g. 30" value={form.ageYears} onChange={(v) => handleChange('ageYears', v)} suffix="years" />
            <FormField label="Gender" required error={errors.gender}>
              <Select value={form.gender} onValueChange={(v) => handleChange('gender', v)}>
                <SelectTrigger className={cn('h-10 text-sm border-gray-200', errors.gender && 'border-red-300')}>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Blood Group" hint="Optional">
              <div className="flex flex-wrap gap-1.5">
                {BLOOD_GROUPS.map((bg) => (
                  <button key={bg} type="button" onClick={() => handleChange('bloodGroup', bg)}
                    className={cn('px-2.5 py-1 text-xs font-medium rounded-lg border transition-all', form.bloodGroup === bg ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-200 text-gray-700 hover:border-blue-300')}>
                    {bg}
                  </button>
                ))}
              </div>
            </FormField>
            <InputField label="Mobile Number" required type="tel" placeholder="10-digit number" value={form.phone} onChange={(v) => handleChange('phone', v.replace(/\D/g, '').slice(0, 10))} error={errors.phone} success={phoneValid} prefix="+91" />
            <InputField label="Email" type="email" placeholder="patient@example.com" value={form.email} onChange={(v) => handleChange('email', v)} error={errors.email} hint="Optional" />
            <InputField label="Aadhar Number" placeholder="12-digit Aadhar" value={form.aadharNumber} onChange={(v) => handleChange('aadharNumber', v.replace(/\D/g, '').slice(0, 12))} error={errors.aadharNumber} hint="Optional" />
          </div>
        </section>

        {/* ─── ADDRESS ─── */}
        <section>
          <div className="flex items-center gap-3 pb-3 border-b border-gray-100 mb-4">
            <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
              <MapPin className="w-4 h-4 text-emerald-600" />
            </div>
            <h3 className="text-base font-semibold text-gray-900">Address</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="sm:col-span-2 lg:col-span-3">
              <FormField label="Address">
                <Textarea placeholder="House no, street, locality…" value={form.address} onChange={(e) => handleChange('address', e.target.value)} rows={2} className="text-sm border-gray-200 resize-none" />
              </FormField>
            </div>
            <InputField label="City" placeholder="City name" value={form.city} onChange={(v) => handleChange('city', v)} />
            <FormField label="State">
              <Select value={form.state} onValueChange={(v) => handleChange('state', v)}>
                <SelectTrigger className="h-10 text-sm border-gray-200"><SelectValue placeholder="Select state" /></SelectTrigger>
                <SelectContent className="max-h-60">
                  {INDIAN_STATES.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
                </SelectContent>
              </Select>
            </FormField>
            <InputField label="Pin Code" placeholder="6-digit" value={form.pincode} onChange={(v) => handleChange('pincode', v.replace(/\D/g, '').slice(0, 6))} error={errors.pincode} />
          </div>
        </section>

        {/* ─── GUARDIAN / EMERGENCY ─── */}
        <section>
          <div className="flex items-center gap-3 pb-3 border-b border-gray-100 mb-4">
            <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
              <Users className="w-4 h-4 text-amber-600" />
            </div>
            <h3 className="text-base font-semibold text-gray-900">Guardian / Emergency Contact</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <InputField label="Guardian Name" placeholder="Full name" value={form.guardianName} onChange={(v) => handleChange('guardianName', v)} />
            <InputField label="Guardian Phone" type="tel" placeholder="10-digit" value={form.guardianPhone} onChange={(v) => handleChange('guardianPhone', v.replace(/\D/g, '').slice(0, 10))} error={errors.guardianPhone} />
            <FormField label="Relationship">
              <Select value={form.guardianRelation} onValueChange={(v) => handleChange('guardianRelation', v)}>
                <SelectTrigger className="h-10 text-sm border-gray-200"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {RELATIONSHIP_OPTIONS.map((r) => (<SelectItem key={r} value={r}>{r}</SelectItem>))}
                </SelectContent>
              </Select>
            </FormField>
            <InputField label="Emergency Contact Name" placeholder="Full name" value={form.emergencyContactName} onChange={(v) => handleChange('emergencyContactName', v)} />
            <InputField label="Emergency Contact Phone" type="tel" placeholder="10-digit" value={form.emergencyContactPhone} onChange={(v) => handleChange('emergencyContactPhone', v.replace(/\D/g, '').slice(0, 10))} />
            <InputField label="Referred By" placeholder="Doctor or facility" value={form.referredBy} onChange={(v) => handleChange('referredBy', v)} />
          </div>
        </section>

        {/* ─── MEDICAL HISTORY ─── */}
        <section>
          <div className="flex items-center gap-3 pb-3 border-b border-gray-100 mb-4">
            <div className="w-8 h-8 bg-rose-100 rounded-lg flex items-center justify-center">
              <ClipboardList className="w-4 h-4 text-rose-600" />
            </div>
            <h3 className="text-base font-semibold text-gray-900">Medical History</h3>
          </div>
          <div className="space-y-4">
            <FormField label="Known Allergies" hint="Type and press Add">
              <div className="flex gap-2">
                <Input value={allergyInput} onChange={(e) => setAllergyInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addAllergy(); } }} placeholder="e.g. Penicillin" className="h-9 text-sm flex-1" />
                <Button type="button" variant="outline" size="sm" onClick={addAllergy} className="h-9 px-3 shrink-0"><Plus className="w-4 h-4" /> Add</Button>
              </div>
              {form.allergies.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {form.allergies.map((a) => (
                    <Badge key={a} className="bg-red-100 text-red-700 border-0 gap-1 px-2 py-0.5">
                      {a} <button type="button" onClick={() => handleChange('allergies', form.allergies.filter((x) => x !== a))}><X className="w-3 h-3" /></button>
                    </Badge>
                  ))}
                </div>
              )}
            </FormField>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Pre-existing Conditions</p>
              <div className="flex flex-wrap gap-2">
                {PRE_EXISTING_CONDITIONS.map((c) => {
                  const selected = form.preExistingConditions.includes(c);
                  return (
                    <button key={c} type="button" onClick={() => handleChange('preExistingConditions', selected ? form.preExistingConditions.filter((x) => x !== c) : [...form.preExistingConditions, c])}
                      className={`text-xs px-3 py-1.5 rounded-full border font-medium ${selected ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'}`}>
                      {c}
                    </button>
                  );
                })}
              </div>
            </div>
            <FormField label="Current Medications" hint="Optional">
              <Textarea placeholder="e.g. Metformin 500mg twice daily…" value={form.currentMedications} onChange={(e) => handleChange('currentMedications', e.target.value)} rows={2} className="text-sm resize-none" />
            </FormField>
          </div>
        </section>

        {/* ─── BILLING ─── */}
        <section>
          <div className="flex items-center gap-3 pb-3 border-b border-gray-100 mb-4">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-green-600" />
            </div>
            <h3 className="text-base font-semibold text-gray-900">Billing Information</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            {BILLING_OPTIONS.map((opt) => {
              const active = form.billingCategory === opt.value;
              return (
                <button key={opt.value} type="button" onClick={() => handleChange('billingCategory', opt.value)}
                  className={`relative p-3 rounded-xl border-2 text-left transition-all ${active ? `${opt.color} border-current` : 'bg-white border-gray-200 hover:border-gray-300'}`}>
                  {active && <CheckCircle className="absolute top-2 right-2 w-4 h-4" />}
                  <p className={`font-semibold text-sm ${active ? '' : 'text-gray-800'}`}>{opt.label}</p>
                  <p className={`text-xs mt-0.5 ${active ? 'opacity-80' : 'text-gray-400'}`}>{opt.desc}</p>
                </button>
              );
            })}
          </div>
          {(form.billingCategory === 'insurance' || form.billingCategory === 'tpa') && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
              <InputField label={form.billingCategory === 'insurance' ? 'Insurance Company' : 'TPA Company'} required placeholder="Company name" value={form.insuranceCompany} onChange={(v) => handleChange('insuranceCompany', v)} error={errors.insuranceCompany} />
              <InputField label={form.billingCategory === 'insurance' ? 'Policy Number' : 'TPA ID'} required placeholder="Policy / ID" value={form.policyNumber} onChange={(v) => handleChange('policyNumber', v)} error={errors.policyNumber} />
            </div>
          )}
        </section>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {onCancel && <Button variant="ghost" size="sm" onClick={onCancel} className="text-gray-500">Cancel</Button>}
          {hasDraft && <span className="text-xs text-gray-400 flex items-center gap-1"><Save className="w-3 h-3" /> Draft saved</span>}
        </div>
        <Button size="sm" onClick={handleSubmit} disabled={submitting} className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 min-w-[140px]">
          {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> {isEditMode ? 'Saving…' : 'Registering…'}</> : isEditMode ? 'Save Changes' : 'Register Patient'}
        </Button>
      </div>

      {registeredPatient && (
        <QuickBookAppointment
          open={!!registeredPatient}
          onClose={() => {
            const pid = registeredPatient.id;
            setRegisteredPatient(null);
            if (onSuccess) onSuccess(pid);
            else navigate(`/opd?registered=${registeredPatient.uhid}`);
          }}
          hospitalId={hospitalId}
          userId={user?.id ?? ''}
          patientId={registeredPatient.id}
          patientName={registeredPatient.name}
          patientUhid={registeredPatient.uhid}
          onSuccess={() => {
            const pid = registeredPatient.id;
            setRegisteredPatient(null);
            if (onSuccess) onSuccess(pid);
            else navigate(`/opd?registered=${registeredPatient.uhid}`);
          }}
        />
      )}
    </div>
  );
}
