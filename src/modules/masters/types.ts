export interface DoctorMaster {
  id: string;
  hospital_id: string;
  employee_id: string | null;
  first_name: string;
  last_name: string | null;
  specialty: string | null;
  department_id: string | null;
  phone: string | null;
  email: string | null;
  qualification: string | null;
  registration_number: string | null;
  first_visit_fee: number;
  followup_fee: number;
  schedule: Record<string, { start: string; end: string }[]>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  department?: { name: string } | null;
}

export interface DepartmentMaster {
  id: string;
  hospital_id: string;
  name: string;
  code: string | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ServiceMasterRow {
  id: string;
  hospital_id: string;
  service_name: string;
  category: string;
  price: number;
  gst_rate: number;
  hsn_code: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PackageMasterRow {
  id: string;
  hospital_id: string;
  package_name: string;
  description: string | null;
  services: { name: string; price: number }[];
  total_price: number;
  is_active: boolean;
  created_at: string;
}

export interface MedicationMaster {
  id: string;
  hospital_id: string;
  name: string | null;
  generic_name: string | null;
  brand_name: string | null;
  category: string | null;
  dosage_form: string | null;
  form: string | null;
  strength: string | null;
  unit: string | null;
  manufacturer: string | null;
  shortcut: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SymptomMaster {
  id: string;
  hospital_id: string;
  name: string;
  category: string | null;
  description: string | null;
  shortcut: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LabTestMaster {
  id: string;
  hospital_id: string;
  name: string | null;
  test_name: string | null;
  code: string | null;
  test_code: string | null;
  category: string | null;
  test_category: string | null;
  sample_type: string | null;
  normal_range: string | null;
  normal_range_male: string | null;
  normal_range_female: string | null;
  unit: string | null;
  price: number | null;
  test_price: number | null;
  is_active: boolean;
  created_at: string;
}

export interface CustomFieldConfig {
  id: string;
  hospital_id: string;
  form_name: string;
  field_label: string;
  field_type: string;
  is_mandatory: boolean;
  options: string[] | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  hospital_id: string;
  user_id: string | null;
  role_name: string;
  permissions: Record<string, boolean>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  profile?: { full_name: string; email: string } | null;
}

export interface GstSlabRow {
  id: string;
  hospital_id: string;
  category: string;
  gst_rate: number;
  hsn_code: string | null;
  cgst_rate: number;
  sgst_rate: number;
  igst_rate: number;
  is_active: boolean;
  created_at: string;
}

export interface VisitTypeRule {
  id: string;
  hospital_id: string;
  visit_type_name: string;
  days_threshold: number;
  description: string | null;
  fee_multiplier: number;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
}

export const WEEKDAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

export const FIELD_TYPES = ['Text', 'Number', 'Date', 'Dropdown', 'Toggle'] as const;

export const FORM_TARGETS = ['Patient', 'Appointment', 'IPD'] as const;

export const SYSTEM_ROLES = [
  'Super Admin', 'Admin', 'Doctor', 'Receptionist',
  'Lab Technician', 'Pharmacist', 'Nurse', 'Custom',
] as const;

export const MODULE_PERMISSIONS = [
  'Dashboard', 'OPD', 'IPD', 'Pharmacy', 'Lab',
  'Masters', 'Reports', 'Billing', 'HRMS', 'Admin',
] as const;

export const MEDICINE_TYPES = [
  'Tablet', 'Capsule', 'Syrup', 'Injection', 'Cream',
  'Ointment', 'Drops', 'Inhaler', 'Powder', 'Suspension',
  'Gel', 'Patch', 'Suppository', 'Solution', 'Spray',
] as const;

export const GST_SLABS = [0, 5, 12, 18, 28] as const;

export const SERVICE_CATEGORIES = [
  'Consultation', 'Investigation', 'Procedure', 'Nursing',
  'Therapy', 'Bed Charges', 'Medication', 'Surgery',
  'Room Charges', 'ICU Charges', 'OT Charges',
  'Physiotherapy', 'Ambulance', 'Other',
] as const;

export const LAB_CATEGORIES = [
  'Hematology', 'Biochemistry', 'Microbiology', 'Serology',
  'Immunology', 'Urinalysis', 'Histopathology', 'Cytology',
  'Radiology', 'Ultrasonography', 'CT Scan', 'MRI',
  'ECG', 'Pulmonary Function', 'Endoscopy', 'Other',
] as const;

export const SYMPTOM_CATEGORIES = [
  'General', 'Respiratory', 'Cardiovascular', 'Gastrointestinal',
  'Neurological', 'Musculoskeletal', 'Dermatological', 'Urological',
  'Gynecological', 'Psychiatric', 'ENT', 'Ophthalmological',
] as const;

export const SPECIALTIES = [
  'General Medicine', 'General Surgery', 'Pediatrics',
  'Obstetrics & Gynecology', 'Orthopedics', 'Cardiology',
  'Neurology', 'Dermatology', 'ENT', 'Ophthalmology',
  'Psychiatry', 'Radiology', 'Pathology', 'Anesthesiology',
  'Emergency Medicine', 'Pulmonology', 'Gastroenterology',
  'Nephrology', 'Urology', 'Oncology', 'Dental',
] as const;
