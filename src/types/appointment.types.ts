import type { Patient } from './patient.types';
import type { Doctor } from './user.types';

export type AppointmentType = 'opd' | 'telemedicine' | 'follow_up' | 'emergency';
export type AppointmentStatus = 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';

export interface Appointment {
  id: string;
  hospital_id: string;
  patient_id: string;
  doctor_id: string;
  appointment_date: string;
  appointment_time: string;
  slot_duration_minutes: number;
  type: AppointmentType;
  status: AppointmentStatus;
  token_number: number | null;
  chief_complaint: string | null;
  diagnosis: string | null;
  prescription: string | null;
  follow_up_date: string | null;
  notes: string | null;
  cancelled_reason: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  patient?: Patient;
  doctor?: Doctor;
}

export interface TimeSlot {
  time: string;
  is_available: boolean;
  appointment_id: string | null;
}

export interface DoctorSchedule {
  id: string;
  doctor_id: string;
  hospital_id: string;
  day_of_week: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
  max_appointments: number;
  is_active: boolean;
}
