import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Loader2, Save, Trash2, AlertTriangle, Users } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { useAppSelector } from '../../../store';
import { useToast } from '../../../hooks/useToast';
import opdService from '../../../services/opd.service';
import { supabase } from '../../../lib/supabase';
import StepIndicator from './StepIndicator';
import Step1Personal from '../steps/Step1Personal';
import Step2Address from '../steps/Step2Address';
import Step3Guardian from '../steps/Step3Guardian';
import Step4Medical from '../steps/Step4Medical';
import Step5Appointment from '../steps/Step5Appointment';
import Step6Billing from '../steps/Step6Billing';
import type { RegistrationFormData, StepId } from '../types';
import { EMPTY_FORM, STEPS } from '../types';

const DRAFT_KEY = 'opd_registration_draft';
const SAMPLE_HOSPITAL_ID = '11111111-1111-1111-1111-111111111111';

function validate(
  form: RegistrationFormData,
  step: number
): Partial<Record<keyof RegistrationFormData, string>> {
  const errs: Partial<Record<keyof RegistrationFormData, string>> = {};
  if (step === 0) {
    if (!form.firstName.trim()) errs.firstName = 'First name is required';
    if (!form.dateOfBirth && !form.ageYears) errs.dateOfBirth = 'Date of birth or age is required';
    if (!form.gender) errs.gender = 'Gender is required';
    if (!form.phone.trim()) errs.phone = 'Mobile number is required';
    else if (!/^[0-9]{10}$/.test(form.phone)) errs.phone = 'Must be exactly 10 digits';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Invalid email address';
    if (form.aadharNumber && !/^[0-9]{12}$/.test(form.aadharNumber)) errs.aadharNumber = 'Must be 12 digits';
  }
  if (step === 1) {
    if (form.pincode && !/^[0-9]{6}$/.test(form.pincode)) errs.pincode = 'Must be 6 digits';
  }
  if (step === 2) {
    if (form.guardianPhone && !/^[0-9]{10}$/.test(form.guardianPhone)) errs.guardianPhone = 'Must be 10 digits';
  }
  if (step === 4) {
    if (!form.departmentId) errs.departmentId = 'Please select a department';
    if (!form.doctorId) errs.doctorId = 'Please select a doctor';
    if (!form.appointmentDate) errs.appointmentDate = 'Appointment date is required';
    if (!form.appointmentTime) errs.appointmentTime = 'Please select a time slot';
    if (!form.chiefComplaint.trim()) errs.chiefComplaint = 'Chief complaint is required';
  }
  if (step === 5) {
    if ((form.billingCategory === 'insurance' || form.billingCategory === 'tpa') && !form.insuranceCompany.trim()) {
      errs.insuranceCompany = 'Company name is required';
    }
    if ((form.billingCategory === 'insurance' || form.billingCategory === 'tpa') && !form.policyNumber.trim()) {
      errs.policyNumber = 'Policy / ID number is required';
    }
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
}

export default function PatientRegistrationForm({ onSuccess, onCancel }: Props) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAppSelector((s) => s.auth);
  const hospitalId = user?.hospital_id ?? SAMPLE_HOSPITAL_ID;

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<RegistrationFormData>(() => {
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
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);
  const [dismissedDuplicates, setDismissedDuplicates] = useState(false);

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

  const checkDuplicates = async () => {
    if (step !== 0) return true;
    setCheckingDuplicates(true);
    try {
      const fullName = `${form.firstName.trim()} ${form.lastName.trim()}`.trim();
      const { data } = await supabase
        .from('patients')
        .select('id, full_name, uhid, phone, age, gender')
        .eq('hospital_id', hospitalId)
        .or(`phone.eq.${form.phone},full_name.ilike.${fullName}`)
        .limit(3);
      const found = (data ?? []) as DuplicatePatient[];
      if (found.length > 0 && !dismissedDuplicates) {
        setDuplicates(found);
        return false;
      }
    } catch { /* noop */ } finally {
      setCheckingDuplicates(false);
    }
    return true;
  };

  const goNext = async () => {
    const errs = validate(form, step);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    if (step === 0 && duplicates.length === 0) {
      const canProceed = await checkDuplicates();
      if (!canProceed) return;
    }
    setDuplicates([]);
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  };

  const goPrev = () => {
    setErrors({});
    setStep((s) => Math.max(0, s - 1));
  };

  const clearDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
    setForm(EMPTY_FORM);
    setStep(0);
    setErrors({});
    setShowClearConfirm(false);
    setDuplicates([]);
    setDismissedDuplicates(false);
  };

  const handleSubmit = async () => {
    const errs = validate(form, step);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setSubmitting(true);
    try {
      const { patient } = await opdService.registerPatient(hospitalId, user?.id ?? '', form);
      const p = patient as { id: string; uhid: string };
      localStorage.removeItem(DRAFT_KEY);
      toast('Patient Registered!', { description: `UHID: ${p.uhid} — appointment scheduled successfully.`, type: 'success' });
      if (onSuccess) onSuccess(p.id);
      else navigate(`/opd?registered=${p.uhid}`);
    } catch (err: unknown) {
      toast('Registration Failed', { description: err instanceof Error ? err.message : 'Something went wrong.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const stepId: StepId = STEPS[step].id;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 pt-6 pb-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-bold text-gray-900">New Patient Registration</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Step {step + 1} of {STEPS.length} — {STEPS[step].title}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {hasDraft && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowClearConfirm(true)}
                className="h-8 text-xs text-gray-400 hover:text-red-500 gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear Draft
              </Button>
            )}
          </div>
        </div>
        <StepIndicator steps={STEPS} currentStep={step} />
      </div>

      {showClearConfirm && (
        <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-red-700 text-sm">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            Clear all form data and start over?
          </div>
          <div className="flex gap-2 shrink-0">
            <Button size="sm" variant="outline" className="h-7 text-xs border-red-200 text-red-600 hover:bg-red-50" onClick={clearDraft}>Clear</Button>
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setShowClearConfirm(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {duplicates.length > 0 && step === 0 && (
        <div className="mx-6 mt-4 p-4 bg-amber-50 border border-amber-300 rounded-xl">
          <div className="flex items-start gap-2 mb-3">
            <Users className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-800">Possible Duplicate Patients Found</p>
              <p className="text-xs text-amber-700 mt-0.5">The following patients match by phone or name. Please confirm this is a new patient.</p>
            </div>
          </div>
          <div className="space-y-1.5 mb-3">
            {duplicates.map((p) => (
              <div key={p.id} className="flex items-center justify-between bg-white border border-amber-200 rounded-lg px-3 py-2">
                <div>
                  <span className="text-sm font-semibold text-gray-800">{p.full_name}</span>
                  <span className="text-xs text-gray-500 ml-2">UHID: {p.uhid}</span>
                </div>
                <span className="text-xs text-gray-500">{p.phone} · {p.age ? `${p.age}y` : ''} {p.gender}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs border-amber-300 text-amber-700 hover:bg-amber-50"
              onClick={() => { setDismissedDuplicates(true); setDuplicates([]); setStep((s) => s + 1); }}
            >
              Continue as New Patient
            </Button>
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setDuplicates([])}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="p-6 min-h-[400px]">
        {stepId === 'personal' && (
          <Step1Personal form={form} errors={errors} onChange={handleChange} />
        )}
        {stepId === 'address' && (
          <Step2Address form={form} errors={errors} onChange={handleChange} />
        )}
        {stepId === 'guardian' && (
          <Step3Guardian form={form} errors={errors} onChange={handleChange} />
        )}
        {stepId === 'medical' && (
          <Step4Medical form={form} errors={errors} onChange={handleChange} />
        )}
        {stepId === 'appointment' && (
          <Step5Appointment form={form} errors={errors} onChange={handleChange} hospitalId={hospitalId} />
        )}
        {stepId === 'billing' && (
          <Step6Billing form={form} errors={errors} onChange={handleChange} />
        )}
      </div>

      <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {onCancel && (
            <Button variant="ghost" size="sm" onClick={onCancel} className="text-gray-500">
              Cancel
            </Button>
          )}
          {step > 0 && (
            <Button variant="outline" size="sm" onClick={goPrev} className="gap-1.5 border-gray-200">
              <ChevronLeft className="w-4 h-4" /> Previous
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {hasDraft && step < STEPS.length - 1 && (
            <span className="text-xs text-gray-400 flex items-center gap-1 hidden sm:flex">
              <Save className="w-3 h-3" /> Draft saved
            </span>
          )}
          {step < STEPS.length - 1 ? (
            <Button size="sm" onClick={goNext} disabled={checkingDuplicates} className="gap-1.5 bg-blue-600 hover:bg-blue-700">
              {checkingDuplicates ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Next <ChevronRight className="w-4 h-4" /></>}
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={submitting}
              className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 min-w-[140px]"
            >
              {submitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Registering…</>
              ) : (
                'Register Patient'
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
