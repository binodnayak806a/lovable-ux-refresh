export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
export type Gender = 'male' | 'female' | 'other';
export type MaritalStatus = 'single' | 'married' | 'divorced' | 'widowed';

export interface Patient {
  id: string;
  uhid: string;
  hospital_id: string;
  full_name: string;
  date_of_birth: string;
  age?: number;
  gender: Gender;
  blood_group: BloodGroup | null;
  phone: string;
  email: string | null;
  address: string;
  city: string;
  state: string;
  pincode: string | null;
  nationality: string;
  marital_status: MaritalStatus | null;
  occupation: string | null;
  referred_by: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_relation: string | null;
  aadhar_number: string | null;
  insurance_provider: string | null;
  insurance_number: string | null;
  insurance_expiry: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PatientVital {
  id: string;
  patient_id: string;
  hospital_id: string;
  recorded_by: string;
  temperature: number | null;
  pulse: number | null;
  blood_pressure_systolic: number | null;
  blood_pressure_diastolic: number | null;
  respiratory_rate: number | null;
  oxygen_saturation: number | null;
  weight: number | null;
  height: number | null;
  bmi: number | null;
  recorded_at: string;
}

export interface PatientAllergy {
  id: string;
  patient_id: string;
  allergen: string;
  reaction: string | null;
  severity: 'mild' | 'moderate' | 'severe';
  noted_at: string;
}

export interface MedicalHistory {
  id: string;
  patient_id: string;
  condition: string;
  diagnosed_date: string | null;
  status: 'active' | 'resolved' | 'chronic';
  notes: string | null;
}
