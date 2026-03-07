export interface VitalsFormData {
  systolicBp: string;
  diastolicBp: string;
  heartRate: string;
  respiratoryRate: string;
  temperature: string;
  spo2: string;
  height: string;
  weight: string;
  bmi: string;
  bloodGlucoseLevel: string;
  painScale: number;
  notes: string;
}

export const EMPTY_VITALS: VitalsFormData = {
  systolicBp: '',
  diastolicBp: '',
  heartRate: '',
  respiratoryRate: '',
  temperature: '',
  spo2: '',
  height: '',
  weight: '',
  bmi: '',
  bloodGlucoseLevel: '',
  painScale: 0,
  notes: '',
};

export interface VitalRange {
  min: number;
  max: number;
  unit: string;
  criticalMin?: number;
  criticalMax?: number;
}

export const VITAL_RANGES: Record<string, VitalRange> = {
  systolicBp:      { min: 90,   max: 140,   unit: 'mmHg', criticalMin: 70,  criticalMax: 180 },
  diastolicBp:     { min: 60,   max: 90,    unit: 'mmHg', criticalMin: 40,  criticalMax: 120 },
  heartRate:       { min: 60,   max: 100,   unit: 'bpm',  criticalMin: 40,  criticalMax: 150 },
  respiratoryRate: { min: 12,   max: 20,    unit: '/min', criticalMin: 8,   criticalMax: 30  },
  temperature:     { min: 36.5, max: 37.5,  unit: '°C',   criticalMin: 35,  criticalMax: 40  },
  spo2:            { min: 94,   max: 100,   unit: '%',    criticalMin: 85,  criticalMax: 100 },
};

export type VitalStatus = 'normal' | 'warning' | 'critical';

export function getVitalStatus(field: string, value: number): VitalStatus {
  const range = VITAL_RANGES[field];
  if (!range) return 'normal';
  if (value < (range.criticalMin ?? range.min) || value > (range.criticalMax ?? range.max)) return 'critical';
  if (value < range.min || value > range.max) return 'warning';
  return 'normal';
}

export function getBMICategory(bmi: number): { label: string; color: string } {
  if (bmi < 18.5) return { label: 'Underweight', color: 'text-blue-600' };
  if (bmi < 25)   return { label: 'Normal',      color: 'text-emerald-600' };
  if (bmi < 30)   return { label: 'Overweight',  color: 'text-amber-600' };
  return              { label: 'Obese',         color: 'text-red-600' };
}

export interface VitalsRecord {
  id: string;
  patient_id: string;
  appointment_id: string | null;
  recorded_by: string | null;
  recorded_at: string;
  systolic_bp: number | null;
  diastolic_bp: number | null;
  heart_rate: number | null;
  respiratory_rate: number | null;
  temperature: number | null;
  spo2: number | null;
  height: number | null;
  weight: number | null;
  bmi: number | null;
  blood_glucose_level: number | null;
  pain_scale: number | null;
  notes: string | null;
  is_abnormal: boolean;
}
