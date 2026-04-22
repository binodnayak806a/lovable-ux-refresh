import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Printer, Loader2, Plus, AlertTriangle, Users } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Checkbox } from '../../components/ui/checkbox';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Textarea } from '../../components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { RadioGroup, RadioGroupItem } from '../../components/ui/radio-group';
import { Label } from '../../components/ui/label';
import { usePageTitle } from '../../hooks/usePageTitle';
import { useAppSelector } from '../../store';
import { useToast } from '../../hooks/useToast';
import opdService from '../../services/opd.service';
import { supabase } from '../../lib/supabase';
import PatientStickerPrint from './components/PatientStickerPrint';
import type { RegistrationFormData } from '../opd/types';
import {
  EMPTY_FORM, BLOOD_GROUPS, INDIAN_STATES, RELATIONSHIP_OPTIONS,
  PRE_EXISTING_CONDITIONS,
} from '../opd/types';
import { cn } from '../../lib/utils';
import { format } from 'date-fns';

const DRAFT_KEY = 'opd_registration_draft';
const SAMPLE_HOSPITAL_ID = '11111111-1111-1111-1111-111111111111';

function validate(form: RegistrationFormData): Partial<Record<keyof RegistrationFormData, string>> {
  const errs: Partial<Record<keyof RegistrationFormData, string>> = {};
  if (!form.firstName.trim()) errs.firstName = 'Required';
  if (!form.dateOfBirth && !form.ageYears) errs.dateOfBirth = 'DOB or age required';
  if (!form.gender) errs.gender = 'Required';
  if (!form.phone.trim()) errs.phone = 'Required';
  else if (!/^[0-9]{10}$/.test(form.phone)) errs.phone = '10 digits';
  if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Invalid';
  if (form.aadharNumber && !/^[0-9]{12}$/.test(form.aadharNumber)) errs.aadharNumber = '12 digits';
  if (form.pincode && !/^[0-9]{6}$/.test(form.pincode)) errs.pincode = '6 digits';
  if (form.guardianPhone && !/^[0-9]{10}$/.test(form.guardianPhone)) errs.guardianPhone = '10 digits';
  if ((form.billingCategory === 'insurance' || form.billingCategory === 'tpa') && !form.insuranceCompany.trim()) errs.insuranceCompany = 'Required';
  if ((form.billingCategory === 'insurance' || form.billingCategory === 'tpa') && !form.policyNumber.trim()) errs.policyNumber = 'Required';
  return errs;
}

interface DuplicatePatient { id: string; full_name: string; uhid: string; phone: string; age: number | null; gender: string; }

export default function AddPatientPage() {
  usePageTitle('Add Patient');
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAppSelector((s) => s.auth);
  const hospitalId = user?.hospital_id ?? SAMPLE_HOSPITAL_ID;

  const [form, setForm] = useState<RegistrationFormData>(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) return { ...EMPTY_FORM, ...JSON.parse(saved) };
    } catch { /* noop */ }
    return EMPTY_FORM;
  });
  const [errors, setErrors] = useState<Partial<Record<keyof RegistrationFormData, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [labelPrint, setLabelPrint] = useState(false);
  const [needVerify, setNeedVerify] = useState(false);
  const [duplicates, setDuplicates] = useState<DuplicatePatient[]>([]);
  const [dismissedDuplicates, setDismissedDuplicates] = useState(false);
  const [allergyInput, setAllergyInput] = useState('');
  const [stickerPatient, setStickerPatient] = useState<{
    full_name: string; uhid: string; phone: string; age?: number; gender?: string; blood_group?: string | null; address?: string;
  } | null>(null);
  const [stickerSize, setStickerSize] = useState<'thermal' | 'a4'>('thermal');

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

    if (!dismissedDuplicates) {
      try {
        const fullName = [form.firstName, form.middleName, form.lastName].filter(s => s.trim()).join(' ').trim();
        const { data: matches } = await supabase
          .from('patients')
          .select('id, full_name, uhid, phone, age, gender')
          .eq('hospital_id', hospitalId)
          .or(`phone.eq.${form.phone},full_name.ilike.${fullName}`)
          .limit(3);
        if (matches && matches.length > 0) {
          setDuplicates(matches as DuplicatePatient[]);
          return;
        }
      } catch { /* noop */ }
    }

    setSubmitting(true);
    try {
      const { patient } = await opdService.registerPatient(hospitalId, user?.id ?? '', form);
      const p = patient as { id: string; uhid: string };
      localStorage.removeItem(DRAFT_KEY);
      const fullName = [form.firstName, form.middleName, form.lastName].filter(Boolean).join(' ').trim();
      toast('Patient Registered!', { description: `UHID: ${p.uhid}`, type: 'success' });

      if (labelPrint) {
        setStickerPatient({
          full_name: fullName, uhid: p.uhid, phone: form.phone,
          age: form.ageYears ? parseInt(form.ageYears) : undefined,
          gender: form.gender, blood_group: form.bloodGroup || null,
          address: [form.address, form.city].filter(Boolean).join(', '),
        });
      } else {
        navigate(`/patients?id=${p.id}`);
      }
    } catch (err: unknown) {
      toast('Registration Failed', { description: err instanceof Error ? err.message : 'Something went wrong.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const phoneValid = form.phone.length === 10 && /^[6-9]/.test(form.phone);

  // Compact field helper
  const CompactField = ({ label, required, children, className }: { label: string; required?: boolean; children: React.ReactNode; className?: string }) => (
    <div className={cn('space-y-1', className)}>
      <Label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
        {label}{required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {children}
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-muted/30">
      {/* ─── HEADER BAR ─── */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-amber-400 text-amber-950">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-amber-500/50 rounded flex items-center justify-center">
            <Users className="w-4 h-4" />
          </div>
          <span className="font-bold text-sm">Patient Information</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs font-medium">
            Registration Date: <span className="font-bold">{format(new Date(), 'dd/MM/yyyy')}</span>
          </span>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-amber-950 hover:bg-amber-500/40" onClick={() => navigate('/patients')}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Duplicate warning */}
      {duplicates.length > 0 && (
        <div className="mx-4 mt-2 p-3 bg-amber-50 border border-amber-300 rounded-lg">
          <div className="flex items-start gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-amber-800">Possible Duplicate Patients</p>
              {duplicates.map((p) => (
                <div key={p.id} className="text-xs text-amber-700 mt-1">{p.full_name} — UHID: {p.uhid} — {p.phone}</div>
              ))}
            </div>
          </div>
          <div className="flex gap-2 mt-2">
            <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={() => { setDismissedDuplicates(true); setDuplicates([]); }}>Continue as New</Button>
            <Button size="sm" variant="ghost" className="h-6 text-[10px]" onClick={() => setDuplicates([])}>Cancel</Button>
          </div>
        </div>
      )}

      {/* ─── 3-COLUMN FORM ─── */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* ─── COLUMN 1: Patient Details ─── */}
          <div className="bg-card border border-border rounded-lg p-4 space-y-3">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider border-b border-border pb-2">Patient Details</h3>

            <div className="grid grid-cols-3 gap-2">
              <CompactField label="First Name" required>
                <Input value={form.firstName} onChange={(e) => handleChange('firstName', e.target.value)} placeholder="First" className={cn('h-8 text-xs', errors.firstName && 'border-destructive')} autoFocus />
              </CompactField>
              <CompactField label="Middle Name">
                <Input value={form.middleName} onChange={(e) => handleChange('middleName', e.target.value)} placeholder="Middle" className="h-8 text-xs" />
              </CompactField>
              <CompactField label="Last Name">
                <Input value={form.lastName} onChange={(e) => handleChange('lastName', e.target.value)} placeholder="Last" className="h-8 text-xs" />
              </CompactField>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <CompactField label="Date of Birth" required>
                <Input type="date" value={form.dateOfBirth} onChange={(e) => {
                  handleChange('dateOfBirth', e.target.value);
                  if (e.target.value) {
                    const age = Math.floor((Date.now() - new Date(e.target.value).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
                    handleChange('ageYears', String(Math.max(0, age)));
                  }
                }} className={cn('h-8 text-xs', errors.dateOfBirth && 'border-destructive')} />
              </CompactField>
              <CompactField label="Age (Years)">
                <Input type="number" value={form.ageYears} onChange={(e) => handleChange('ageYears', e.target.value)} placeholder="Age" className="h-8 text-xs" />
              </CompactField>
            </div>

            <CompactField label="Gender" required>
              <RadioGroup value={form.gender} onValueChange={(v) => handleChange('gender', v)} className="flex gap-4 mt-1">
                {['male', 'female', 'other'].map((g) => (
                  <div key={g} className="flex items-center gap-1.5">
                    <RadioGroupItem value={g} id={`gender-${g}`} />
                    <Label htmlFor={`gender-${g}`} className="text-xs capitalize cursor-pointer">{g}</Label>
                  </div>
                ))}
              </RadioGroup>
              {errors.gender && <p className="text-[10px] text-destructive mt-0.5">{errors.gender}</p>}
            </CompactField>

            <CompactField label="Blood Group">
              <div className="flex flex-wrap gap-1">
                {BLOOD_GROUPS.map((bg) => (
                  <button key={bg} type="button" onClick={() => handleChange('bloodGroup', bg)}
                    className={cn('px-2 py-0.5 text-[10px] font-semibold rounded border transition-all',
                      form.bloodGroup === bg ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-muted-foreground hover:border-primary/50')}>
                    {bg}
                  </button>
                ))}
              </div>
            </CompactField>

            <CompactField label="Aadhar Number">
              <Input value={form.aadharNumber} onChange={(e) => handleChange('aadharNumber', e.target.value.replace(/\D/g, '').slice(0, 12))} placeholder="12-digit" className={cn('h-8 text-xs', errors.aadharNumber && 'border-destructive')} />
            </CompactField>

            <CompactField label="Email">
              <Input type="email" value={form.email} onChange={(e) => handleChange('email', e.target.value)} placeholder="patient@email.com" className={cn('h-8 text-xs', errors.email && 'border-destructive')} />
            </CompactField>
          </div>

          {/* ─── COLUMN 2: Contact Details ─── */}
          <div className="bg-card border border-border rounded-lg p-4 space-y-3">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider border-b border-border pb-2">Contact Details</h3>

            <div className="grid grid-cols-3 gap-2">
              <CompactField label="Code" className="col-span-1">
                <Input value="+91" disabled className="h-8 text-xs bg-muted" />
              </CompactField>
              <CompactField label="Mobile Number" required className="col-span-2">
                <Input type="tel" value={form.phone} onChange={(e) => handleChange('phone', e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="10-digit"
                  className={cn('h-8 text-xs', errors.phone && 'border-destructive', phoneValid && 'border-emerald-400')} />
              </CompactField>
            </div>

            <CompactField label="Address / House No">
              <Textarea value={form.address} onChange={(e) => handleChange('address', e.target.value)} placeholder="House no, street..." rows={2} className="text-xs resize-none" />
            </CompactField>

            <CompactField label="Area / Landmark">
              <Input value={form.city} onChange={(e) => handleChange('city', e.target.value)} placeholder="City / area" className="h-8 text-xs" />
            </CompactField>

            <div className="grid grid-cols-2 gap-2">
              <CompactField label="Pincode">
                <Input value={form.pincode} onChange={(e) => handleChange('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="6-digit" className={cn('h-8 text-xs', errors.pincode && 'border-destructive')} />
              </CompactField>
              <CompactField label="State">
                <Select value={form.state} onValueChange={(v) => handleChange('state', v)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent className="max-h-48">
                    {INDIAN_STATES.map((s) => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </CompactField>
            </div>
          </div>

          {/* ─── COLUMN 3: Kin Details ─── */}
          <div className="bg-card border border-border rounded-lg p-4 space-y-3">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider border-b border-border pb-2">Kin Details</h3>

            <CompactField label="Relation">
              <Select value={form.guardianRelation} onValueChange={(v) => handleChange('guardianRelation', v)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select relation" /></SelectTrigger>
                <SelectContent>
                  {RELATIONSHIP_OPTIONS.map((r) => <SelectItem key={r} value={r} className="text-xs">{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </CompactField>

            <CompactField label="Full Name">
              <Input value={form.guardianName} onChange={(e) => handleChange('guardianName', e.target.value)} placeholder="Guardian name" className="h-8 text-xs" />
            </CompactField>

            <CompactField label="Contact No">
              <Input type="tel" value={form.guardianPhone} onChange={(e) => handleChange('guardianPhone', e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="10-digit"
                className={cn('h-8 text-xs', errors.guardianPhone && 'border-destructive')} />
            </CompactField>

            <div className="mt-4 pt-3 border-t border-border">
              <p className="text-[10px] font-bold text-destructive uppercase tracking-wider mb-2">Emergency Contact</p>
              <div className="space-y-2">
                <CompactField label="Name">
                  <Input value={form.emergencyContactName} onChange={(e) => handleChange('emergencyContactName', e.target.value)} placeholder="Emergency contact" className="h-8 text-xs" />
                </CompactField>
                <CompactField label="Phone">
                  <Input type="tel" value={form.emergencyContactPhone} onChange={(e) => handleChange('emergencyContactPhone', e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="10-digit" className="h-8 text-xs" />
                </CompactField>
              </div>
            </div>
          </div>
        </div>

        {/* ─── TABBED SECTION: Other Info / Payer Details ─── */}
        <div className="mt-4 bg-card border border-border rounded-lg p-4">
          <Tabs defaultValue="other" className="w-full">
            <TabsList className="h-8 mb-3">
              <TabsTrigger value="other" className="text-xs h-7">Other Info</TabsTrigger>
              <TabsTrigger value="payer" className="text-xs h-7">Payer Details</TabsTrigger>
            </TabsList>

            <TabsContent value="other" className="mt-0">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <CompactField label="Referred By">
                  <Input value={form.referredBy} onChange={(e) => handleChange('referredBy', e.target.value)} placeholder="Doctor / facility" className="h-8 text-xs" />
                </CompactField>

                <CompactField label="Known Allergies" className="lg:col-span-2">
                  <div className="flex gap-1.5">
                    <Input value={allergyInput} onChange={(e) => setAllergyInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addAllergy(); } }} placeholder="e.g. Penicillin" className="h-8 text-xs flex-1" />
                    <Button type="button" variant="outline" size="sm" onClick={addAllergy} className="h-8 px-2 text-xs"><Plus className="w-3 h-3" /></Button>
                  </div>
                  {form.allergies.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {form.allergies.map((a) => (
                        <Badge key={a} variant="destructive" className="text-[10px] gap-1 px-1.5 py-0">
                          {a} <button type="button" onClick={() => handleChange('allergies', form.allergies.filter((x) => x !== a))}>×</button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </CompactField>
              </div>

              <div className="mt-3">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Pre-existing Conditions</p>
                <div className="flex flex-wrap gap-1.5">
                  {PRE_EXISTING_CONDITIONS.map((c) => {
                    const sel = form.preExistingConditions.includes(c);
                    return (
                      <button key={c} type="button" onClick={() => handleChange('preExistingConditions', sel ? form.preExistingConditions.filter((x) => x !== c) : [...form.preExistingConditions, c])}
                        className={cn('text-[10px] px-2 py-1 rounded-full border font-medium transition-all',
                          sel ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-muted-foreground border-border hover:border-primary/50')}>
                        {c}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-3">
                <CompactField label="Current Medications">
                  <Textarea value={form.currentMedications} onChange={(e) => handleChange('currentMedications', e.target.value)} placeholder="e.g. Metformin 500mg..." rows={2} className="text-xs resize-none" />
                </CompactField>
              </div>
            </TabsContent>

            <TabsContent value="payer" className="mt-0">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                {[
                  { value: 'cash', label: 'Cash / Self Pay' },
                  { value: 'insurance', label: 'Insurance' },
                  { value: 'tpa', label: 'TPA' },
                ].map((opt) => {
                  const active = form.billingCategory === opt.value;
                  return (
                    <button key={opt.value} type="button" onClick={() => handleChange('billingCategory', opt.value)}
                      className={cn('p-2.5 rounded-lg border text-xs font-semibold text-left transition-all',
                        active ? 'bg-primary/10 border-primary text-primary' : 'bg-card border-border text-muted-foreground hover:border-primary/40')}>
                      {opt.label}
                    </button>
                  );
                })}
              </div>
              {(form.billingCategory === 'insurance' || form.billingCategory === 'tpa') && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-muted/50 rounded-lg border border-border">
                  <CompactField label={form.billingCategory === 'insurance' ? 'Insurance Company' : 'TPA Company'} required>
                    <Input value={form.insuranceCompany} onChange={(e) => handleChange('insuranceCompany', e.target.value)} placeholder="Company name" className={cn('h-8 text-xs', errors.insuranceCompany && 'border-destructive')} />
                  </CompactField>
                  <CompactField label={form.billingCategory === 'insurance' ? 'Policy Number' : 'TPA ID'} required>
                    <Input value={form.policyNumber} onChange={(e) => handleChange('policyNumber', e.target.value)} placeholder="Policy / ID" className={cn('h-8 text-xs', errors.policyNumber && 'border-destructive')} />
                  </CompactField>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* ─── FOOTER BAR ─── */}
      <div className="flex items-center justify-between px-4 py-2.5 border-t border-border bg-card">
        <div className="flex items-center gap-5">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <Checkbox checked={labelPrint} onCheckedChange={(c) => setLabelPrint(!!c)} />
            <span className="text-xs font-medium text-foreground flex items-center gap-1">
              <Printer className="w-3.5 h-3.5" /> Label Print
            </span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <Checkbox checked={needVerify} onCheckedChange={(c) => setNeedVerify(!!c)} />
            <span className="text-xs font-medium text-foreground">Need To Verify?</span>
          </label>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => navigate('/patients')}>Cancel</Button>
          <Button size="sm" onClick={handleSubmit} disabled={submitting} className="h-8 text-xs gap-1.5 min-w-[120px]">
            {submitting ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Registering…</> : 'Add Patient'}
          </Button>
        </div>
      </div>

      {/* Sticker Print Dialog */}
      {stickerPatient && (
        <PatientStickerPrint
          patient={stickerPatient}
          onClose={() => { setStickerPatient(null); navigate('/patients'); }}
          stickerSize={stickerSize}
          onSizeChange={setStickerSize}
        />
      )}
    </div>
  );
}
