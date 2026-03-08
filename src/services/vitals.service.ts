import { mockStore } from '../lib/mockStore';
import type { VitalsFormData, VitalsRecord } from '../modules/opd/vitals/types';
import { getVitalStatus } from '../modules/opd/vitals/types';

function hasAbnormal(form: VitalsFormData): boolean {
  const checks: Array<[string, string]> = [
    ['systolicBp', form.systolicBp],
    ['diastolicBp', form.diastolicBp],
    ['heartRate', form.heartRate],
    ['respiratoryRate', form.respiratoryRate],
    ['temperature', form.temperature],
    ['spo2', form.spo2],
  ];
  return checks.some(([field, val]) => {
    if (!val) return false;
    return getVitalStatus(field, parseFloat(val)) !== 'normal';
  });
}

export interface CriticalVitalAlert {
  field: string;
  label: string;
  value: number;
  unit: string;
}

export function getCriticalAlerts(form: VitalsFormData): CriticalVitalAlert[] {
  const fieldMap: Array<[string, string, string]> = [
    ['systolicBp',      form.systolicBp,      'Systolic BP'],
    ['diastolicBp',     form.diastolicBp,     'Diastolic BP'],
    ['heartRate',       form.heartRate,       'Heart Rate'],
    ['respiratoryRate', form.respiratoryRate, 'Respiratory Rate'],
    ['temperature',     form.temperature,     'Temperature'],
    ['spo2',            form.spo2,            'SpO₂'],
  ];

  const UNITS: Record<string, string> = {
    systolicBp: 'mmHg', diastolicBp: 'mmHg', heartRate: 'bpm',
    respiratoryRate: '/min', temperature: '°C', spo2: '%',
  };

  return fieldMap
    .filter(([field, val]) => val && getVitalStatus(field, parseFloat(val)) === 'critical')
    .map(([field, val, label]) => ({
      field,
      label,
      value: parseFloat(val),
      unit: UNITS[field] ?? '',
    }));
}

const vitalsService = {
  async saveVitals(
    patientId: string,
    appointmentId: string | null,
    recordedBy: string,
    form: VitalsFormData,
    _patientName?: string
  ): Promise<VitalsRecord> {
    const id = mockStore.uuid();
    const now = new Date().toISOString();

    const record = {
      id,
      patient_id: patientId,
      appointment_id: appointmentId,
      systolic_bp: form.systolicBp ? parseInt(form.systolicBp) : null,
      diastolic_bp: form.diastolicBp ? parseInt(form.diastolicBp) : null,
      heart_rate: form.heartRate ? parseInt(form.heartRate) : null,
      respiratory_rate: form.respiratoryRate ? parseInt(form.respiratoryRate) : null,
      temperature: form.temperature ? parseFloat(form.temperature) : null,
      spo2: form.spo2 ? parseInt(form.spo2) : null,
      height: form.height ? parseFloat(form.height) : null,
      weight: form.weight ? parseFloat(form.weight) : null,
      bmi: form.bmi ? parseFloat(form.bmi) : null,
      blood_glucose_level: form.bloodGlucoseLevel ? parseFloat(form.bloodGlucoseLevel) : null,
      pain_scale: form.painScale,
      is_abnormal: hasAbnormal(form),
      notes: form.notes || null,
      recorded_by: recordedBy,
      recorded_at: now,
    };

    mockStore.addVitals(record);
    return record as VitalsRecord;
  },

  async getPatientVitals(patientId: string, limit = 10): Promise<VitalsRecord[]> {
    return mockStore.getPatientVitals(patientId, limit) as VitalsRecord[];
  },

  async getVitalsById(vitalsId: string): Promise<VitalsRecord | null> {
    const store = mockStore.get();
    return (store.vitals.find(v => v.id === vitalsId) as VitalsRecord) ?? null;
  },
};

export default vitalsService;
