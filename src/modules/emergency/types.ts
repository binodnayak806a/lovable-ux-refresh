export type ArrivalMode = 'Ambulance' | 'Walk-in' | 'Police' | 'Referred' | 'Self' | 'Other';
export type TriageCategory = 'Red' | 'Yellow' | 'Green' | 'Black';
export type EmergencyStatus = 'waiting' | 'triaged' | 'in_treatment' | 'observation' | 'admitted' | 'discharged' | 'referred' | 'lama' | 'expired';
export type Disposition = 'Admitted' | 'Discharged' | 'Referred' | 'LAMA' | 'Expired' | 'Observation';
export type TreatmentType = 'general' | 'medication' | 'procedure' | 'vitals_check' | 'imaging' | 'lab_order' | 'consultation';

export interface VitalsOnArrival {
  systolic_bp?: number;
  diastolic_bp?: number;
  heart_rate?: number;
  respiratory_rate?: number;
  temperature?: number;
  spo2?: number;
  blood_glucose?: number;
  gcs_score?: number;
  pain_scale?: number;
}

export interface EmergencyCase {
  id: string;
  hospital_id: string;
  case_number: string;
  patient_id: string | null;
  ambulance_request_id: string | null;
  arrival_time: string;
  arrival_mode: ArrivalMode;
  triage_category: TriageCategory;
  triage_time: string | null;
  triaged_by: string | null;
  chief_complaint: string;
  history_of_present_illness: string | null;
  vitals_on_arrival: VitalsOnArrival | null;
  treating_doctor_id: string | null;
  bed_number: string | null;
  status: EmergencyStatus;
  disposition: Disposition | null;
  disposition_notes: string | null;
  disposition_time: string | null;
  admitted_to_ward: string | null;
  admission_id: string | null;
  created_at: string;
  updated_at: string;
  patient?: {
    id: string;
    full_name: string;
    phone: string;
    gender: string;
    date_of_birth: string;
    blood_group?: string;
  };
  treating_doctor?: {
    id: string;
    full_name: string;
  };
}

export interface EmergencyTreatment {
  id: string;
  emergency_case_id: string;
  treatment_time: string;
  treatment_type: TreatmentType;
  treatment_notes: string | null;
  medications_given: string | null;
  procedures_performed: string | null;
  vitals_after: VitalsOnArrival | null;
  performed_by: string;
  created_at: string;
  performer?: {
    id: string;
    full_name: string;
  };
}

export interface CreateEmergencyCaseInput {
  hospital_id: string;
  patient_id?: string;
  ambulance_request_id?: string;
  arrival_mode: ArrivalMode;
  triage_category: TriageCategory;
  chief_complaint: string;
  history_of_present_illness?: string;
  vitals_on_arrival?: VitalsOnArrival;
  treating_doctor_id?: string;
  bed_number?: string;
}

export interface CreateTreatmentInput {
  emergency_case_id: string;
  treatment_type: TreatmentType;
  treatment_notes?: string;
  medications_given?: string;
  procedures_performed?: string;
  vitals_after?: VitalsOnArrival;
  performed_by: string;
}

export const TRIAGE_CONFIG: Record<TriageCategory, { label: string; description: string; color: string; bgColor: string; borderColor: string }> = {
  Red: {
    label: 'Red - Immediate',
    description: 'Life-threatening, requires immediate attention',
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-500'
  },
  Yellow: {
    label: 'Yellow - Urgent',
    description: 'Serious but stable, needs attention within 30 min',
    color: 'text-amber-700',
    bgColor: 'bg-amber-100',
    borderColor: 'border-amber-500'
  },
  Green: {
    label: 'Green - Non-urgent',
    description: 'Minor condition, can wait',
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-100',
    borderColor: 'border-emerald-500'
  },
  Black: {
    label: 'Black - Deceased',
    description: 'No signs of life',
    color: 'text-gray-700',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-500'
  },
};

export const ARRIVAL_MODE_CONFIG: Record<ArrivalMode, { label: string; icon: string }> = {
  Ambulance: { label: 'Ambulance', icon: 'Truck' },
  'Walk-in': { label: 'Walk-in', icon: 'Footprints' },
  Police: { label: 'Police', icon: 'Shield' },
  Referred: { label: 'Referred', icon: 'FileText' },
  Self: { label: 'Self', icon: 'User' },
  Other: { label: 'Other', icon: 'HelpCircle' },
};

export const EMERGENCY_STATUS_CONFIG: Record<EmergencyStatus, { label: string; color: string; bgColor: string }> = {
  waiting: { label: 'Waiting', color: 'text-gray-700', bgColor: 'bg-gray-100' },
  triaged: { label: 'Triaged', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  in_treatment: { label: 'In Treatment', color: 'text-amber-700', bgColor: 'bg-amber-100' },
  observation: { label: 'Observation', color: 'text-cyan-700', bgColor: 'bg-cyan-100' },
  admitted: { label: 'Admitted', color: 'text-indigo-700', bgColor: 'bg-indigo-100' },
  discharged: { label: 'Discharged', color: 'text-emerald-700', bgColor: 'bg-emerald-100' },
  referred: { label: 'Referred', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  lama: { label: 'LAMA', color: 'text-orange-700', bgColor: 'bg-orange-100' },
  expired: { label: 'Expired', color: 'text-gray-800', bgColor: 'bg-gray-200' },
};

export const DISPOSITION_CONFIG: Record<Disposition, { label: string; color: string }> = {
  Admitted: { label: 'Admitted to Ward', color: 'text-indigo-700' },
  Discharged: { label: 'Discharged', color: 'text-emerald-700' },
  Referred: { label: 'Referred to Other Hospital', color: 'text-purple-700' },
  LAMA: { label: 'Left Against Medical Advice', color: 'text-orange-700' },
  Expired: { label: 'Expired', color: 'text-gray-700' },
  Observation: { label: 'Kept Under Observation', color: 'text-cyan-700' },
};

export const TREATMENT_TYPE_CONFIG: Record<TreatmentType, { label: string; icon: string }> = {
  general: { label: 'General Treatment', icon: 'Stethoscope' },
  medication: { label: 'Medication Given', icon: 'Pill' },
  procedure: { label: 'Procedure Performed', icon: 'Scissors' },
  vitals_check: { label: 'Vitals Check', icon: 'Activity' },
  imaging: { label: 'Imaging Ordered', icon: 'Scan' },
  lab_order: { label: 'Lab Test Ordered', icon: 'FlaskConical' },
  consultation: { label: 'Consultation', icon: 'Users' },
};
