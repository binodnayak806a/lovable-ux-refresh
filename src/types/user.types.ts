export type UserRole = 'superadmin' | 'admin' | 'doctor' | 'nurse' | 'billing' | 'pharmacist' | 'lab_technician' | 'receptionist';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  hospital_id: string | null;
  department: string | null;
  designation: string | null;
  phone: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Hospital {
  id: string;
  name: string;
  registration_number: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  logo_url: string | null;
  bed_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Department {
  id: string;
  hospital_id: string;
  name: string;
  code: string;
  head_doctor_id: string | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Doctor {
  id: string;
  user_id: string;
  hospital_id: string;
  department_id: string;
  registration_number: string;
  specialization: string;
  qualification: string;
  experience_years: number;
  consultation_fee: number;
  is_available: boolean;
  profile?: User;
  department?: Department;
}
