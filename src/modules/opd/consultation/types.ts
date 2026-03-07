export interface Symptom {
  id: string;
  name: string;
  category: string;
  usage_count: number;
  is_active: boolean;
}

export interface SelectedSymptom {
  symptomId: string;
  name: string;
  severity: 'mild' | 'moderate' | 'severe';
  durationDays: string;
  notes: string;
}

export interface Diagnosis {
  id: string;
  name: string;
  icd10_code: string | null;
  category: string;
  is_active: boolean;
}

export interface SelectedDiagnosis {
  diagnosisId: string;
  name: string;
  icd10Code: string | null;
  diagnosisType: 'primary' | 'secondary' | 'provisional';
  severity: 'mild' | 'moderate' | 'severe' | 'critical';
  notes: string;
}

export interface ConsultationFormData {
  chiefComplaint: string;
  historyOfPresentIllness: string;
  pastHistory: string;
  familyHistory: string;
  personalHistory: string;
  drugHistory: string;
  allergyHistory: string;
  physicalExamination: string;
  clinicalNotes: string;
  assessment: string;
  plan: string;
  followUpDate: string;
}

export const EMPTY_CONSULTATION: ConsultationFormData = {
  chiefComplaint: '',
  historyOfPresentIllness: '',
  pastHistory: '',
  familyHistory: '',
  personalHistory: '',
  drugHistory: '',
  allergyHistory: '',
  physicalExamination: '',
  clinicalNotes: '',
  assessment: '',
  plan: '',
  followUpDate: '',
};

export interface ConsultationRecord {
  id: string;
  appointment_id: string | null;
  patient_id: string;
  doctor_id: string | null;
  consultation_date: string;
  chief_complaint: string | null;
  history_of_present_illness: string | null;
  past_history: string | null;
  family_history: string | null;
  personal_history: string | null;
  drug_history: string | null;
  allergy_history: string | null;
  physical_examination: string | null;
  clinical_notes: string | null;
  assessment: string | null;
  plan: string | null;
  follow_up_date: string | null;
  is_completed: boolean;
}

export type ConsultationTab = 'symptoms' | 'history' | 'examination' | 'diagnosis' | 'assessment' | 'prescription' | 'billing';
export type HistorySubTab = 'hpi' | 'past' | 'family' | 'personal' | 'drug' | 'allergy';

export const SYMPTOM_CATEGORIES = [
  'General',
  'Respiratory',
  'Cardiovascular',
  'Gastrointestinal',
  'Neurological',
  'Musculoskeletal',
  'Dermatological',
  'ENT',
  'Urogenital',
  'Psychological',
] as const;

export const SEVERITY_OPTIONS = [
  { value: 'mild', label: 'Mild', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  { value: 'moderate', label: 'Moderate', color: 'text-amber-700 bg-amber-50 border-amber-200' },
  { value: 'severe', label: 'Severe', color: 'text-red-700 bg-red-50 border-red-200' },
] as const;

export const DIAGNOSIS_SEVERITY_OPTIONS = [
  { value: 'mild', label: 'Mild', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  { value: 'moderate', label: 'Moderate', color: 'text-amber-700 bg-amber-50 border-amber-200' },
  { value: 'severe', label: 'Severe', color: 'text-orange-700 bg-orange-50 border-orange-200' },
  { value: 'critical', label: 'Critical', color: 'text-red-700 bg-red-50 border-red-200' },
] as const;
