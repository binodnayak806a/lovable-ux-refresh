import { useState, useCallback, useEffect } from 'react';
import { Activity, RotateCcw, Save, Loader2, CheckCircle2, AlertOctagon } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent } from '../../../components/ui/card';
import { useAppSelector } from '../../../store';
import { useToast } from '../../../hooks/useToast';
import vitalsService, { getCriticalAlerts } from '../../../services/vitals.service';
import { mockStore } from '../../../lib/mockStore';
import VitalsForm from './VitalsForm';
import VitalsHistory from './VitalsHistory';
import PatientLookup from './PatientLookup';
import type { VitalsFormData, VitalsRecord } from './types';
import { EMPTY_VITALS, VITAL_RANGES, getVitalStatus } from './types';

interface PatientResult {
  id: string;
  uhid: string;
  full_name: string;
  phone: string;
  gender: string;
  date_of_birth: string | null;
}

function validate(form: VitalsFormData): Partial<Record<keyof VitalsFormData, string>> {
  const errs: Partial<Record<keyof VitalsFormData, string>> = {};

  const numFields: Array<[keyof VitalsFormData, string, number, number]> = [
    ['systolicBp',   'Systolic BP',         0,   300],
    ['diastolicBp',  'Diastolic BP',         0,   200],
    ['heartRate',    'Heart rate',          20,   300],
    ['respiratoryRate', 'Respiratory rate',  4,    60],
    ['temperature',  'Temperature',         30,    45],
    ['spo2',         'SpO₂',               50,   100],
    ['height',       'Height',             30,   250],
    ['weight',       'Weight',              1,   500],
  ];

  for (const [field, label, min, max] of numFields) {
    const raw = form[field] as string;
    if (raw) {
      const n = parseFloat(raw);
      if (isNaN(n) || n < min || n > max) {
        errs[field] = `${label} must be between ${min} and ${max}`;
      }
    }
  }

  const allEmpty = [
    form.systolicBp, form.diastolicBp, form.heartRate, form.respiratoryRate,
    form.temperature, form.spo2, form.height, form.weight, form.bloodGlucoseLevel,
  ].every((v) => !v);
  if (allEmpty) {
    errs.systolicBp = 'Please enter at least one vital measurement';
  }

  return errs;
}

interface VitalsPageProps {
  initialPatientId?: string | null;
}

export default function VitalsPage({ initialPatientId }: VitalsPageProps) {
  const { user } = useAppSelector((s) => s.auth);
  const { toast } = useToast();

  const [patient, setPatient] = useState<PatientResult | null>(null);
  const [appointmentId, setAppointmentId] = useState<string | null>(null);
  const [form, setForm] = useState<VitalsFormData>(EMPTY_VITALS);
  const [errors, setErrors] = useState<Partial<Record<keyof VitalsFormData, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [history, setHistory] = useState<VitalsRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Auto-select patient from queue context
  useEffect(() => {
    if (initialPatientId && !patient) {
      const p = mockStore.getPatientById(initialPatientId);
      if (p) {
        const result: PatientResult = {
          id: p.id, uhid: p.uhid, full_name: p.full_name,
          phone: p.phone, gender: p.gender, date_of_birth: p.date_of_birth,
        };
        setPatient(result);
        loadHistory(p.id);
      }
    }
  }, [initialPatientId]);

  const loadHistory = useCallback(async (patientId: string) => {
    setHistoryLoading(true);
    try {
      const records = await vitalsService.getPatientVitals(patientId, 10);
      setHistory(records);
    } catch {
      setHistory([]);
      toast('Load Error', { description: 'Failed to load vitals history', type: 'error' });
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const handlePatientSelect = (p: PatientResult | null) => {
    setPatient(p);
    setHistory([]);
    setSaved(false);
    setForm(EMPTY_VITALS);
    setErrors({});
    if (p) loadHistory(p.id);
  };

  const handleChange = useCallback((field: keyof VitalsFormData, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
    setSaved(false);
  }, []);

  const handleClear = () => {
    setForm(EMPTY_VITALS);
    setErrors({});
    setSaved(false);
  };

  const handleSubmit = async () => {
    if (!patient) {
      toast('No Patient Selected', { description: 'Please search and select a patient first.', type: 'error' });
      return;
    }
    const errs = validate(form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setSubmitting(true);
    try {
      await vitalsService.saveVitals(patient.id, appointmentId, user?.id ?? '', form, patient.full_name);
      setSaved(true);
      const criticals = getCriticalAlerts(form);
      if (criticals.length > 0) {
        toast('CRITICAL VITALS DETECTED', {
          description: `${criticals.map((a) => `${a.label}: ${a.value}${a.unit}`).join(', ')} — Immediate attention needed!`,
          type: 'error',
        });
      } else {
        toast('Vitals Recorded', { description: `Vitals saved for ${patient.full_name} (${patient.uhid})`, type: 'success' });
      }
      await loadHistory(patient.id);
    } catch (err: unknown) {
      toast('Save Failed', { description: err instanceof Error ? err.message : 'Could not save vitals.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const criticalAlerts = getCriticalAlerts(form);

  const abnormalCount = Object.entries(VITAL_RANGES).filter(([field]) => {
    const map: Record<string, string> = {
      systolicBp: form.systolicBp,
      diastolicBp: form.diastolicBp,
      heartRate: form.heartRate,
      respiratoryRate: form.respiratoryRate,
      temperature: form.temperature,
      spo2: form.spo2,
    };
    const val = parseFloat(map[field] ?? '');
    return !isNaN(val) && getVitalStatus(field, val) !== 'normal';
  }).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Record Vitals</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            OPD Step 3 — Vital Signs Assessment
          </p>
        </div>
        <div className="flex items-center gap-2">
          {abnormalCount > 0 && (
            <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
              {abnormalCount} Abnormal
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleClear}
            disabled={submitting}
            className="gap-1.5 border-gray-200 text-gray-600 h-8"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Clear
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={submitting || !patient}
            className={`gap-1.5 h-8 min-w-[120px] ${saved ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {submitting ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…</>
            ) : saved ? (
              <><CheckCircle2 className="w-3.5 h-3.5" /> Saved</>
            ) : (
              <><Save className="w-3.5 h-3.5" /> Save Vitals</>
            )}
          </Button>
        </div>
      </div>

      <Card className="border border-gray-100 shadow-sm">
        <CardContent className="px-5 py-4">
          <div className="space-y-1.5 mb-1">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-500" />
              <label className="text-sm font-semibold text-gray-700">Patient</label>
            </div>
          </div>
          <PatientLookup
            selectedPatient={patient}
            onSelect={handlePatientSelect}
            selectedAppointmentId={appointmentId}
            onSelectAppointment={setAppointmentId}
          />
        </CardContent>
      </Card>

      {criticalAlerts.length > 0 && patient && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-300 rounded-xl animate-in fade-in duration-200">
          <AlertOctagon className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-red-800">Critical Values Detected — Immediate Attention Required</p>
            <div className="flex flex-wrap gap-2 mt-1.5">
              {criticalAlerts.map((a) => (
                <span key={a.field} className="text-xs font-semibold bg-red-100 text-red-700 px-2 py-0.5 rounded-lg border border-red-200">
                  {a.label}: {a.value}{a.unit}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className={`transition-all duration-200 ${!patient ? 'opacity-40 pointer-events-none' : ''}`}>
        <VitalsForm form={form} errors={errors} onChange={handleChange} />
      </div>

      {!patient && (
        <div className="text-center py-6 text-gray-400 text-sm">
          Search and select a patient above to start recording vitals
        </div>
      )}

      {patient && (
        <VitalsHistory records={history} loading={historyLoading} />
      )}
    </div>
  );
}
