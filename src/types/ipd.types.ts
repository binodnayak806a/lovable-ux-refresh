import type { Patient } from './patient.types';
import type { Doctor } from './user.types';

export type AdmissionType = 'general' | 'emergency' | 'planned' | 'transfer';
export type AdmissionStatus = 'active' | 'discharged' | 'transferred' | 'absconded' | 'death';
export type WardType = 'general' | 'icu' | 'nicu' | 'picu' | 'ot' | 'emergency' | 'private' | 'semi_private' | 'hdu';
export type BedType = 'general' | 'icu' | 'ventilator' | 'oxygen' | 'isolation';
export type BedStatus = 'available' | 'occupied' | 'reserved' | 'maintenance' | 'cleaning';

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
  mlc_case: boolean;
  notes: string | null;
  discharge_summary: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  patient?: Patient;
  doctor?: Doctor;
  ward?: Ward;
  bed?: Bed;
}

export interface NursingNote {
  id: string;
  admission_id: string;
  recorded_by: string;
  note: string;
  created_at: string;
}

export interface DoctorRound {
  id: string;
  admission_id: string;
  doctor_id: string;
  round_time: string;
  findings: string;
  instructions: string | null;
  created_at: string;
}
