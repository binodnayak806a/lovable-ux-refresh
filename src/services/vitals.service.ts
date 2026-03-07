import { supabase } from '../lib/supabase';
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

async function createCriticalVitalNotification(
  _patientId: string,
  patientName: string,
  alerts: CriticalVitalAlert[],
  notifyUserId: string
): Promise<void> {
  if (alerts.length === 0) return;
  const alertText = alerts.map((a) => `${a.label}: ${a.value}${a.unit}`).join(', ');
  const message = `CRITICAL VITALS — ${patientName}: ${alertText}. Immediate attention required.`;
  await supabase.from('notifications').insert({
    user_id: notifyUserId,
    title: 'Critical Vitals Alert',
    message,
    type: 'error',
    source: 'system',
    is_read: false,
  } as never);
}

const vitalsService = {
  async saveVitals(
    patientId: string,
    appointmentId: string | null,
    recordedBy: string,
    form: VitalsFormData,
    patientName?: string
  ): Promise<VitalsRecord> {
    const payload: Record<string, unknown> = {
      patient_id:           patientId,
      appointment_id:       appointmentId || null,
      recorded_by:          recordedBy,
      is_abnormal:          hasAbnormal(form),
      pain_scale:           form.painScale,
      notes:                form.notes || null,
    };

    if (form.systolicBp)         payload.systolic_bp          = parseInt(form.systolicBp);
    if (form.diastolicBp)        payload.diastolic_bp         = parseInt(form.diastolicBp);
    if (form.heartRate)          payload.heart_rate           = parseInt(form.heartRate);
    if (form.respiratoryRate)    payload.respiratory_rate     = parseInt(form.respiratoryRate);
    if (form.temperature)        payload.temperature          = parseFloat(form.temperature);
    if (form.spo2)               payload.spo2                 = parseInt(form.spo2);
    if (form.height)             payload.height               = parseFloat(form.height);
    if (form.weight)             payload.weight               = parseFloat(form.weight);
    if (form.bmi)                payload.bmi                  = parseFloat(form.bmi);
    if (form.bloodGlucoseLevel)  payload.blood_glucose_level  = parseFloat(form.bloodGlucoseLevel);

    const { data, error } = await supabase
      .from('vitals')
      .insert(payload as never)
      .select()
      .single();

    if (error) throw error;

    if (recordedBy && patientName) {
      const criticals = getCriticalAlerts(form);
      if (criticals.length > 0) {
        createCriticalVitalNotification(patientId, patientName, criticals, recordedBy).catch(() => {});
      }
    }

    return data as VitalsRecord;
  },

  async getPatientVitals(patientId: string, limit = 10): Promise<VitalsRecord[]> {
    const { data, error } = await supabase
      .from('vitals')
      .select('*')
      .eq('patient_id', patientId)
      .order('recorded_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data ?? []) as VitalsRecord[];
  },

  async getVitalsById(vitalsId: string): Promise<VitalsRecord | null> {
    const { data, error } = await supabase
      .from('vitals')
      .select('*')
      .eq('id', vitalsId)
      .maybeSingle();

    if (error) throw error;
    return data as VitalsRecord | null;
  },
};

export default vitalsService;
