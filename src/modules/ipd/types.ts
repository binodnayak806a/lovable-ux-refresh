export interface Ward {
  id: string;
  hospital_id: string;
  name: string;
  ward_type: WardType;
  total_beds: number;
  available_beds: number;
  floor: number;
  block: string | null;
  daily_rate: number;
  is_active: boolean;
}

export interface Bed {
  id: string;
  hospital_id: string;
  ward_id: string;
  bed_number: string;
  bed_type: BedType;
  status: BedStatus;
  daily_rate: number;
  ward?: Ward;
  current_admission?: AdmissionSummary | null;
}

export interface AdmissionSummary {
  id: string;
  admission_number: string;
  patient_name: string;
  admission_date: string;
  days_admitted: number;
}

export interface Admission {
  id: string;
  admission_number: string;
  hospital_id: string;
  patient_id: string;
  doctor_id: string;
  ward_id: string;
  bed_id: string;
  admission_date: string;
  discharge_date: string | null;
  admission_type: AdmissionType;
  status: AdmissionStatus;
  primary_diagnosis: string | null;
  secondary_diagnosis: string | null;
  billing_category: BillingCategory;
  insurance_company: string | null;
  policy_number: string | null;
  estimated_stay_days: number;
  mlc_case: boolean;
  notes: string | null;
  discharge_summary: string | null;
  patient?: PatientInfo;
  bed?: Bed;
  doctor?: DoctorInfo;
  pending_tasks_count?: number;
  latest_vitals?: IpdVitals | null;
}

export interface PatientInfo {
  id: string;
  uhid: string;
  full_name: string;
  phone: string;
  gender: string;
  date_of_birth: string | null;
  blood_group: string | null;
}

export interface DoctorInfo {
  id: string;
  full_name: string;
  department: string | null;
  designation: string | null;
}

export interface NursingTask {
  id: string;
  admission_id: string;
  task_type: TaskType;
  task_description: string;
  scheduled_time: string;
  completed_time: string | null;
  completed_by: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  recurrence: TaskRecurrence;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

export interface IpdVitals {
  id: string;
  admission_id: string;
  recorded_by: string | null;
  recorded_at: string;
  systolic_bp: number | null;
  diastolic_bp: number | null;
  heart_rate: number | null;
  respiratory_rate: number | null;
  temperature: number | null;
  spo2: number | null;
  blood_glucose: number | null;
  input_output_chart: Record<string, unknown>;
  pain_score: number | null;
  consciousness_level: ConsciousnessLevel | null;
  gcs_score: number | null;
  notes: string | null;
}

export interface NursingNote {
  id: string;
  admission_id: string;
  nurse_id: string | null;
  note_type: NoteType;
  note_text: string;
  created_at: string;
  nurse_name?: string;
}

export interface DoctorRound {
  id: string;
  admission_id: string;
  doctor_id: string | null;
  round_date: string;
  round_time: string | null;
  clinical_notes: string | null;
  treatment_plan: string | null;
  orders: string | null;
  follow_up_instructions: string | null;
  created_at: string;
  doctor_name?: string;
}

export interface BedHistory {
  id: string;
  admission_id: string;
  bed_id: string;
  assigned_at: string;
  released_at: string | null;
  reason: string | null;
  bed_number?: string;
  ward_name?: string;
}

export type WardType = 'general' | 'icu' | 'nicu' | 'picu' | 'ot' | 'emergency' | 'private' | 'semi_private' | 'hdu';
export type BedType = 'general' | 'icu' | 'ventilator' | 'oxygen' | 'isolation';
export type BedStatus = 'available' | 'occupied' | 'reserved' | 'maintenance' | 'cleaning';
export type AdmissionType = 'general' | 'emergency' | 'planned' | 'transfer';
export type AdmissionStatus = 'active' | 'discharged' | 'transferred' | 'absconded' | 'death';
export type BillingCategory = 'Cash' | 'Insurance' | 'TPA' | 'Corporate' | 'Government';
export type TaskType = 'Vitals' | 'Medication' | 'Dressing' | 'Observation' | 'Lab' | 'Procedure' | 'Other';
export type TaskStatus = 'pending' | 'completed' | 'missed' | 'delayed' | 'cancelled';
export type TaskPriority = 'low' | 'normal' | 'high' | 'urgent';
export type TaskRecurrence = 'once' | 'daily' | 'every-4-hours' | 'every-6-hours' | 'every-8-hours' | 'every-12-hours';
export type NoteType = 'General' | 'Handover' | 'Incident' | 'Progress' | 'Procedure' | 'Observation';
export type ConsciousnessLevel = 'Alert' | 'Verbal' | 'Pain' | 'Unresponsive';

export interface KinDetails {
  name: string;
  relationship: string;
  phone: string;
  address: string;
  id_proof_type: string;
  id_proof_number: string;
}

export interface AdmissionChecklist {
  id_verified: boolean;
  consent_signed: boolean;
  valuables_deposited: boolean;
  allergies_documented: boolean;
  current_medications_noted: boolean;
  advance_paid: boolean;
  wristband_attached: boolean;
}

export interface AdmissionFormData {
  patient_id: string;
  doctor_id: string;
  ward_id: string;
  bed_id: string;
  admission_type: AdmissionType;
  primary_diagnosis: string;
  secondary_diagnosis: string;
  billing_category: BillingCategory;
  insurance_company: string;
  policy_number: string;
  estimated_stay_days: number;
  mlc_case: boolean;
  notes: string;
  kin: KinDetails;
  checklist: AdmissionChecklist;
}

export const EMPTY_KIN: KinDetails = {
  name: '',
  relationship: '',
  phone: '',
  address: '',
  id_proof_type: '',
  id_proof_number: '',
};

export const EMPTY_CHECKLIST: AdmissionChecklist = {
  id_verified: false,
  consent_signed: false,
  valuables_deposited: false,
  allergies_documented: false,
  current_medications_noted: false,
  advance_paid: false,
  wristband_attached: false,
};

export const EMPTY_ADMISSION_FORM: AdmissionFormData = {
  patient_id: '',
  doctor_id: '',
  ward_id: '',
  bed_id: '',
  admission_type: 'planned',
  primary_diagnosis: '',
  secondary_diagnosis: '',
  billing_category: 'Cash',
  insurance_company: '',
  policy_number: '',
  estimated_stay_days: 3,
  mlc_case: false,
  notes: '',
  kin: { ...EMPTY_KIN },
  checklist: { ...EMPTY_CHECKLIST },
};

export const RELATIONSHIP_OPTIONS = [
  'Spouse', 'Parent', 'Child', 'Sibling', 'Guardian', 'Friend', 'Other',
];

export const ID_PROOF_OPTIONS = [
  'Aadhaar Card', 'PAN Card', 'Passport', 'Driving License', 'Voter ID', 'Other',
];

export const CHECKLIST_LABELS: Record<keyof AdmissionChecklist, string> = {
  id_verified: 'Patient identity verified',
  consent_signed: 'Admission consent form signed',
  valuables_deposited: 'Valuables deposited / acknowledged',
  allergies_documented: 'Known allergies documented',
  current_medications_noted: 'Current medications recorded',
  advance_paid: 'Advance payment received',
  wristband_attached: 'Patient wristband attached',
};

export interface TaskFormData {
  task_type: TaskType;
  task_description: string;
  scheduled_time: string;
  priority: TaskPriority;
  recurrence: TaskRecurrence;
  notes: string;
}

export const EMPTY_TASK_FORM: TaskFormData = {
  task_type: 'Vitals',
  task_description: '',
  scheduled_time: new Date().toISOString(),
  priority: 'normal',
  recurrence: 'once',
  notes: '',
};

export const BED_STATUS_CONFIG: Record<BedStatus, { label: string; color: string; bgColor: string }> = {
  available: { label: 'Available', color: '#10B981', bgColor: 'bg-emerald-50' },
  occupied: { label: 'Occupied', color: '#3B82F6', bgColor: 'bg-blue-50' },
  reserved: { label: 'Reserved', color: '#8B5CF6', bgColor: 'bg-violet-50' },
  maintenance: { label: 'Maintenance', color: '#EF4444', bgColor: 'bg-red-50' },
  cleaning: { label: 'Cleaning', color: '#F59E0B', bgColor: 'bg-amber-50' },
};

export const WARD_TYPE_CONFIG: Record<WardType, { label: string; color: string }> = {
  general: { label: 'General', color: 'bg-gray-100 text-gray-700' },
  icu: { label: 'ICU', color: 'bg-red-100 text-red-700' },
  nicu: { label: 'NICU', color: 'bg-pink-100 text-pink-700' },
  picu: { label: 'PICU', color: 'bg-purple-100 text-purple-700' },
  ot: { label: 'OT', color: 'bg-blue-100 text-blue-700' },
  emergency: { label: 'Emergency', color: 'bg-orange-100 text-orange-700' },
  private: { label: 'Private', color: 'bg-teal-100 text-teal-700' },
  semi_private: { label: 'Semi-Private', color: 'bg-cyan-100 text-cyan-700' },
  hdu: { label: 'HDU', color: 'bg-amber-100 text-amber-700' },
};

export const TASK_TYPE_CONFIG: Record<TaskType, { label: string; icon: string }> = {
  Vitals: { label: 'Vitals', icon: 'Activity' },
  Medication: { label: 'Medication', icon: 'Pill' },
  Dressing: { label: 'Dressing', icon: 'Bandage' },
  Observation: { label: 'Observation', icon: 'Eye' },
  Lab: { label: 'Lab Test', icon: 'TestTube' },
  Procedure: { label: 'Procedure', icon: 'Stethoscope' },
  Other: { label: 'Other', icon: 'ClipboardList' },
};

export const PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string; bgColor: string }> = {
  low: { label: 'Low', color: 'text-gray-600', bgColor: 'bg-gray-100' },
  normal: { label: 'Normal', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  high: { label: 'High', color: 'text-amber-600', bgColor: 'bg-amber-100' },
  urgent: { label: 'Urgent', color: 'text-red-600', bgColor: 'bg-red-100' },
};

export type BillItemType = 'bed_charges' | 'medication' | 'procedure' | 'investigation' | 'consultation' | 'nursing' | 'misc';
export type DischargeType = 'Normal' | 'LAMA' | 'Death' | 'Transfer' | 'Absconded';
export type ConditionAtDischarge = 'Stable' | 'Improved' | 'Unchanged' | 'Deteriorated' | 'Critical' | 'Expired';

export interface IpdBillItem {
  id: string;
  admission_id: string;
  item_date: string;
  item_type: BillItemType;
  item_name: string;
  item_description: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  is_billable: boolean;
  service_id: string | null;
  category: string | null;
  gst_rate: number;
  gst_amount: number;
  hsn_code: string | null;
  created_by: string | null;
  created_at: string;
}

export interface DischargeSummary {
  id: string;
  admission_id: string;
  discharge_date: string;
  discharge_type: DischargeType;
  final_diagnosis: string;
  treatment_summary: string | null;
  procedures_performed: string | null;
  medications_on_discharge: string | null;
  follow_up_instructions: string | null;
  follow_up_date: string | null;
  diet_advice: string | null;
  activity_restrictions: string | null;
  condition_at_discharge: ConditionAtDischarge;
  created_by: string | null;
  created_at: string;
}

export interface DischargeFormData {
  discharge_date: string;
  discharge_type: DischargeType;
  final_diagnosis: string;
  treatment_summary: string;
  procedures_performed: string;
  medications_on_discharge: string;
  follow_up_instructions: string;
  follow_up_date: string;
  diet_advice: string;
  activity_restrictions: string;
  condition_at_discharge: ConditionAtDischarge;
}

export const EMPTY_DISCHARGE_FORM: DischargeFormData = {
  discharge_date: new Date().toISOString(),
  discharge_type: 'Normal',
  final_diagnosis: '',
  treatment_summary: '',
  procedures_performed: '',
  medications_on_discharge: '',
  follow_up_instructions: '',
  follow_up_date: '',
  diet_advice: '',
  activity_restrictions: '',
  condition_at_discharge: 'Stable',
};

export interface BillSummary {
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  taxPercent: number;
  taxAmount: number;
  total: number;
}

export const BILL_ITEM_TYPE_CONFIG: Record<BillItemType, { label: string; color: string }> = {
  bed_charges: { label: 'Bed Charges', color: 'bg-blue-100 text-blue-700' },
  medication: { label: 'Medication', color: 'bg-emerald-100 text-emerald-700' },
  procedure: { label: 'Procedure', color: 'bg-amber-100 text-amber-700' },
  investigation: { label: 'Investigation', color: 'bg-cyan-100 text-cyan-700' },
  consultation: { label: 'Consultation', color: 'bg-teal-100 text-teal-700' },
  nursing: { label: 'Nursing', color: 'bg-pink-100 text-pink-700' },
  misc: { label: 'Miscellaneous', color: 'bg-gray-100 text-gray-700' },
};

export const DISCHARGE_TYPE_CONFIG: Record<DischargeType, { label: string; color: string }> = {
  Normal: { label: 'Normal Discharge', color: 'bg-emerald-100 text-emerald-700' },
  LAMA: { label: 'Left Against Medical Advice', color: 'bg-amber-100 text-amber-700' },
  Death: { label: 'Death', color: 'bg-gray-100 text-gray-700' },
  Transfer: { label: 'Transfer to Another Facility', color: 'bg-blue-100 text-blue-700' },
  Absconded: { label: 'Absconded', color: 'bg-red-100 text-red-700' },
};

export const CONDITION_CONFIG: Record<ConditionAtDischarge, { label: string; color: string }> = {
  Stable: { label: 'Stable', color: 'bg-emerald-100 text-emerald-700' },
  Improved: { label: 'Improved', color: 'bg-green-100 text-green-700' },
  Unchanged: { label: 'Unchanged', color: 'bg-gray-100 text-gray-700' },
  Deteriorated: { label: 'Deteriorated', color: 'bg-amber-100 text-amber-700' },
  Critical: { label: 'Critical', color: 'bg-red-100 text-red-700' },
  Expired: { label: 'Expired', color: 'bg-gray-200 text-gray-800' },
};

export interface ServiceMaster {
  id: string;
  hospital_id: string;
  service_name: string;
  category: string;
  price: number;
  gst_rate: number;
  hsn_code: string | null;
  is_active: boolean;
}

export interface PackageMaster {
  id: string;
  hospital_id: string;
  package_name: string;
  description: string | null;
  services: Array<{ name: string; price: number }>;
  total_price: number;
  is_active: boolean;
}

export interface GstMaster {
  id: string;
  hospital_id: string;
  category: string;
  gst_rate: number;
  hsn_code: string | null;
  cgst_rate: number;
  sgst_rate: number;
  igst_rate: number;
  is_active: boolean;
}

export interface IpdPayment {
  id: string;
  admission_id: string;
  hospital_id: string;
  amount: number;
  payment_mode: string;
  receipt_number: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

export interface IpdDailyNote {
  id: string;
  admission_id: string;
  doctor_id: string | null;
  note_date: string;
  observations: string | null;
  plan: string | null;
  vitals: Record<string, unknown>;
  created_at: string;
  doctor_name?: string;
}

export interface EnhancedBillSummary extends BillSummary {
  gstBreakup: {
    cgst: number;
    sgst: number;
    igst: number;
  };
  totalPaid: number;
  balanceDue: number;
}

export const PAYMENT_MODES = ['Cash', 'Card', 'UPI', 'Bank Transfer', 'Cheque', 'Insurance'] as const;

export const SERVICE_CATEGORIES = [
  'Consultation', 'Investigation', 'Procedure', 'Nursing',
  'Therapy', 'Bed Charges', 'Medication', 'General',
] as const;
