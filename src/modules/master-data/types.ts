export interface Medication {
  id: string;
  hospital_id: string;
  generic_name: string;
  brand_name: string | null;
  category: string;
  dosage_form: string;
  strength: string | null;
  unit: string;
  manufacturer: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MedicationFormData {
  generic_name: string;
  brand_name: string;
  category: string;
  dosage_form: string;
  strength: string;
  unit: string;
  manufacturer: string;
  is_active: boolean;
}

export interface Symptom {
  id: string;
  hospital_id: string;
  name: string;
  category: string | null;
  description: string | null;
  usage_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SymptomFormData {
  name: string;
  category: string;
  description: string;
  is_active: boolean;
}

export interface Diagnosis {
  id: string;
  hospital_id: string;
  name: string;
  icd_code: string | null;
  category: string | null;
  description: string | null;
  usage_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DiagnosisFormData {
  name: string;
  icd_code: string;
  category: string;
  description: string;
  is_active: boolean;
}

export interface Investigation {
  id: string;
  hospital_id: string;
  name: string;
  code: string | null;
  category: string;
  sample_type: string | null;
  normal_range_male: string | null;
  normal_range_female: string | null;
  unit: string | null;
  price: number;
  turnaround_time: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface InvestigationFormData {
  name: string;
  code: string;
  category: string;
  sample_type: string;
  normal_range_male: string;
  normal_range_female: string;
  unit: string;
  price: number;
  turnaround_time: string;
  is_active: boolean;
}

export interface WardPrice {
  ward_id: string;
  ward_name: string;
  price: number;
}

export interface ServiceItem {
  id: string;
  hospital_id: string;
  name: string;
  code: string | null;
  category: string;
  service_group: string;
  service_type: 'OPD' | 'IPD' | 'BOTH';
  rate: number;
  tax_percentage: number;
  description: string | null;
  ward_prices: WardPrice[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ServiceItemFormData {
  name: string;
  code: string;
  category: string;
  service_group: string;
  service_type: 'OPD' | 'IPD' | 'BOTH';
  rate: number;
  tax_percentage: number;
  description: string;
  ward_prices: WardPrice[];
  is_active: boolean;
}

export interface Department {
  id: string;
  hospital_id: string;
  name: string;
  code: string | null;
  head_doctor_id: string | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  head_doctor?: { first_name: string; last_name: string } | null;
}

export interface DepartmentFormData {
  name: string;
  code: string;
  head_doctor_id: string;
  description: string;
  is_active: boolean;
}

export interface Ward {
  id: string;
  hospital_id: string;
  name: string;
  ward_type: string;
  category: string | null;
  floor: string | null;
  block: string | null;
  total_beds: number;
  daily_rate: number;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WardFormData {
  name: string;
  ward_type: string;
  category: string;
  floor: string;
  block: string;
  total_beds: number;
  daily_rate: number;
  description: string;
  is_active: boolean;
}

export const WARD_CATEGORIES = [
  'General Ward', 'Private Room', 'Semi-Private', 'ICU', 'NICU', 'PICU', 'HDU', 'Emergency', 'OT', 'Isolation',
] as const;

export interface Consultant {
  id: string;
  user_id: string | null;
  hospital_id: string;
  first_name: string;
  last_name: string;
  specialty: string;
  department: string | null;
  qualification: string | null;
  registration_number: string | null;
  phone: string | null;
  email: string | null;
  consultation_fee: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ConsultantFormData {
  first_name: string;
  last_name: string;
  specialty: string;
  department: string;
  qualification: string;
  registration_number: string;
  phone: string;
  email: string;
  consultation_fee: number;
  is_active: boolean;
}

export const MEDICATION_CATEGORIES = [
  'Antibiotics', 'Analgesics', 'Antipyretics', 'Antihypertensives', 'Antidiabetics',
  'Cardiovascular', 'Gastrointestinal', 'Respiratory', 'Neurological', 'Dermatological',
  'Vitamins & Supplements', 'Hormones', 'Antihistamines', 'Antifungals', 'Antivirals',
  'Anticoagulants', 'Sedatives', 'Muscle Relaxants', 'Other',
] as const;

export const DOSAGE_FORMS = [
  'Tablet', 'Capsule', 'Syrup', 'Injection', 'Cream', 'Ointment', 'Drops',
  'Inhaler', 'Powder', 'Suspension', 'Gel', 'Patch', 'Suppository', 'Solution', 'Spray', 'Lotion',
] as const;

export const SYMPTOM_CATEGORIES = [
  'General', 'Respiratory', 'Cardiovascular', 'Gastrointestinal', 'Neurological',
  'Musculoskeletal', 'Dermatological', 'Urological', 'Gynecological', 'Psychiatric',
  'ENT', 'Ophthalmological', 'Endocrine', 'Hematological', 'Infectious',
] as const;

export const DIAGNOSIS_CATEGORIES = [
  'Infectious Diseases', 'Neoplasms', 'Blood Disorders', 'Endocrine Disorders',
  'Mental Disorders', 'Nervous System', 'Eye Disorders', 'Ear Disorders',
  'Cardiovascular', 'Respiratory', 'Digestive System', 'Skin Disorders',
  'Musculoskeletal', 'Genitourinary', 'Pregnancy Related', 'Congenital', 'Injuries', 'External Causes',
] as const;

export const INVESTIGATION_CATEGORIES = [
  'Hematology', 'Biochemistry', 'Microbiology', 'Serology', 'Immunology',
  'Urinalysis', 'Histopathology', 'Cytology', 'Radiology', 'Ultrasonography',
  'CT Scan', 'MRI', 'ECG', 'EEG', 'Pulmonary Function', 'Endoscopy', 'Other',
] as const;

export const SERVICE_CATEGORIES = [
  'Consultation', 'Procedure', 'Surgery', 'Room Charges', 'Nursing Charges',
  'Laboratory', 'Radiology', 'Pharmacy', 'Emergency', 'ICU Charges',
  'OT Charges', 'Physiotherapy', 'Ambulance', 'Other Services',
] as const;

export const SERVICE_GROUPS = [
  'Consultation', 'Lab', 'Radiology', 'Room Charges', 'Procedure',
  'Surgery', 'Pharmacy', 'Nursing', 'Emergency', 'Other',
] as const;

export const SERVICE_TYPES = ['OPD', 'IPD', 'BOTH'] as const;

export const WARD_TYPES = [
  'General', 'Private', 'Semi-Private', 'ICU', 'NICU', 'PICU', 'CCU', 'HDU',
  'Emergency', 'Maternity', 'Pediatric', 'Surgical', 'Medical', 'Orthopedic', 'Isolation',
] as const;

export const SPECIALTIES = [
  'General Medicine', 'General Surgery', 'Pediatrics', 'Obstetrics & Gynecology',
  'Orthopedics', 'Cardiology', 'Neurology', 'Dermatology', 'ENT', 'Ophthalmology',
  'Psychiatry', 'Radiology', 'Pathology', 'Anesthesiology', 'Emergency Medicine',
  'Pulmonology', 'Gastroenterology', 'Nephrology', 'Urology', 'Oncology',
  'Endocrinology', 'Rheumatology', 'Plastic Surgery', 'Dental',
] as const;
