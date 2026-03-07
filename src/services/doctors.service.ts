import { supabase } from '../lib/supabase';

export interface Doctor {
  id: string;
  hospital_id: string;
  employee_id: string;
  first_name: string;
  last_name: string | null;
  gender: 'male' | 'female' | 'other' | null;
  date_of_birth: string | null;
  specialty: string;
  sub_specialty: string | null;
  qualification: string | null;
  additional_qualifications: string[] | null;
  registration_number: string | null;
  registration_council: string | null;
  registration_valid_till: string | null;
  experience_years: number;
  department_id: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  profile_photo_url: string | null;
  bio: string | null;
  is_active: boolean;
  is_available_for_opd: boolean;
  is_available_for_ipd: boolean;
  is_available_for_emergency: boolean;
  created_at: string;
  updated_at: string;
  department?: { id: string; name: string } | null;
  fees?: DoctorFee[];
  schedules?: DoctorSchedule[];
}

export interface DoctorFee {
  id: string;
  doctor_id: string;
  fee_type: 'consultation' | 'follow_up' | 'emergency' | 'video_consultation' | 'home_visit' | 'procedure';
  amount: number;
  validity_days: number;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DoctorSchedule {
  id: string;
  doctor_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
  max_patients: number;
  is_active: boolean;
  created_at: string;
}

export interface DoctorFormData {
  first_name: string;
  last_name: string;
  gender: 'male' | 'female' | 'other' | '';
  date_of_birth: string;
  specialty: string;
  sub_specialty: string;
  qualification: string;
  additional_qualifications: string[];
  registration_number: string;
  registration_council: string;
  registration_valid_till: string;
  experience_years: number;
  department_id: string;
  phone: string;
  email: string;
  address: string;
  bio: string;
  is_active: boolean;
  is_available_for_opd: boolean;
  is_available_for_ipd: boolean;
  is_available_for_emergency: boolean;
}

export interface DoctorFeeFormData {
  fee_type: DoctorFee['fee_type'];
  amount: number;
  validity_days: number;
  description: string;
  is_active: boolean;
}

export interface DoctorScheduleFormData {
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
  max_patients: number;
  is_active: boolean;
}

export const FEE_TYPE_LABELS: Record<DoctorFee['fee_type'], string> = {
  consultation: 'Consultation',
  follow_up: 'Follow-up',
  emergency: 'Emergency',
  video_consultation: 'Video Consultation',
  home_visit: 'Home Visit',
  procedure: 'Procedure',
};

export const DAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

class DoctorsService {
  async getDoctors(hospitalId: string): Promise<Doctor[]> {
    const { data, error } = await supabase
      .from('doctors')
      .select(`
        *,
        department:departments(id, name),
        fees:doctor_fees(*),
        schedules:doctor_schedules(*)
      `)
      .eq('hospital_id', hospitalId)
      .order('first_name');

    if (error) throw error;
    return (data || []) as Doctor[];
  }

  async getDoctor(id: string): Promise<Doctor | null> {
    const { data, error } = await supabase
      .from('doctors')
      .select(`
        *,
        department:departments(id, name),
        fees:doctor_fees(*),
        schedules:doctor_schedules(*)
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data as Doctor | null;
  }

  async getActiveDoctors(hospitalId: string): Promise<Doctor[]> {
    const { data, error } = await supabase
      .from('doctors')
      .select(`
        *,
        department:departments(id, name),
        fees:doctor_fees(*)
      `)
      .eq('hospital_id', hospitalId)
      .eq('is_active', true)
      .order('first_name');

    if (error) throw error;
    return (data || []) as Doctor[];
  }

  async getDoctorsBySpecialty(hospitalId: string, specialty: string): Promise<Doctor[]> {
    const { data, error } = await supabase
      .from('doctors')
      .select(`
        *,
        department:departments(id, name),
        fees:doctor_fees(*)
      `)
      .eq('hospital_id', hospitalId)
      .eq('specialty', specialty)
      .eq('is_active', true)
      .order('first_name');

    if (error) throw error;
    return (data || []) as Doctor[];
  }

  async generateEmployeeId(hospitalId: string): Promise<string> {
    try {
      const { data, error } = await supabase.rpc('generate_doctor_id', { p_hospital_id: hospitalId } as never);
      if (error) throw error;
      return data as string;
    } catch {
      const { count } = await supabase
        .from('doctors')
        .select('*', { count: 'exact', head: true })
        .eq('hospital_id', hospitalId);
      return `DR-${String((count || 0) + 1).padStart(4, '0')}`;
    }
  }

  async createDoctor(hospitalId: string, formData: DoctorFormData): Promise<Doctor> {
    const employeeId = await this.generateEmployeeId(hospitalId);

    const insertData = {
      hospital_id: hospitalId,
      employee_id: employeeId,
      first_name: formData.first_name,
      last_name: formData.last_name || null,
      gender: formData.gender || null,
      date_of_birth: formData.date_of_birth || null,
      specialty: formData.specialty,
      sub_specialty: formData.sub_specialty || null,
      qualification: formData.qualification || null,
      additional_qualifications: formData.additional_qualifications.length > 0 ? formData.additional_qualifications : null,
      registration_number: formData.registration_number || null,
      registration_council: formData.registration_council || null,
      registration_valid_till: formData.registration_valid_till || null,
      experience_years: formData.experience_years || 0,
      department_id: formData.department_id || null,
      phone: formData.phone || null,
      email: formData.email || null,
      address: formData.address || null,
      bio: formData.bio || null,
      is_active: formData.is_active,
      is_available_for_opd: formData.is_available_for_opd,
      is_available_for_ipd: formData.is_available_for_ipd,
      is_available_for_emergency: formData.is_available_for_emergency,
    };

    const { data, error } = await supabase
      .from('doctors')
      .insert(insertData as never)
      .select()
      .single();

    if (error) throw error;
    return data as Doctor;
  }

  async updateDoctor(id: string, formData: Partial<DoctorFormData>): Promise<Doctor> {
    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (formData.first_name !== undefined) updateData.first_name = formData.first_name;
    if (formData.last_name !== undefined) updateData.last_name = formData.last_name || null;
    if (formData.gender !== undefined) updateData.gender = formData.gender || null;
    if (formData.date_of_birth !== undefined) updateData.date_of_birth = formData.date_of_birth || null;
    if (formData.specialty !== undefined) updateData.specialty = formData.specialty;
    if (formData.sub_specialty !== undefined) updateData.sub_specialty = formData.sub_specialty || null;
    if (formData.qualification !== undefined) updateData.qualification = formData.qualification || null;
    if (formData.additional_qualifications !== undefined) {
      updateData.additional_qualifications = formData.additional_qualifications.length > 0 ? formData.additional_qualifications : null;
    }
    if (formData.registration_number !== undefined) updateData.registration_number = formData.registration_number || null;
    if (formData.registration_council !== undefined) updateData.registration_council = formData.registration_council || null;
    if (formData.registration_valid_till !== undefined) updateData.registration_valid_till = formData.registration_valid_till || null;
    if (formData.experience_years !== undefined) updateData.experience_years = formData.experience_years;
    if (formData.department_id !== undefined) updateData.department_id = formData.department_id || null;
    if (formData.phone !== undefined) updateData.phone = formData.phone || null;
    if (formData.email !== undefined) updateData.email = formData.email || null;
    if (formData.address !== undefined) updateData.address = formData.address || null;
    if (formData.bio !== undefined) updateData.bio = formData.bio || null;
    if (formData.is_active !== undefined) updateData.is_active = formData.is_active;
    if (formData.is_available_for_opd !== undefined) updateData.is_available_for_opd = formData.is_available_for_opd;
    if (formData.is_available_for_ipd !== undefined) updateData.is_available_for_ipd = formData.is_available_for_ipd;
    if (formData.is_available_for_emergency !== undefined) updateData.is_available_for_emergency = formData.is_available_for_emergency;

    const { data, error } = await supabase
      .from('doctors')
      .update(updateData as never)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Doctor;
  }

  async deleteDoctor(id: string): Promise<void> {
    const { error } = await supabase
      .from('doctors')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async getDoctorFees(doctorId: string): Promise<DoctorFee[]> {
    const { data, error } = await supabase
      .from('doctor_fees')
      .select('*')
      .eq('doctor_id', doctorId)
      .order('fee_type');

    if (error) throw error;
    return (data || []) as DoctorFee[];
  }

  async addDoctorFee(doctorId: string, formData: DoctorFeeFormData): Promise<DoctorFee> {
    const { data, error } = await supabase
      .from('doctor_fees')
      .insert({
        doctor_id: doctorId,
        fee_type: formData.fee_type,
        amount: formData.amount,
        validity_days: formData.validity_days,
        description: formData.description || null,
        is_active: formData.is_active,
      } as never)
      .select()
      .single();

    if (error) throw error;
    return data as DoctorFee;
  }

  async updateDoctorFee(id: string, formData: Partial<DoctorFeeFormData>): Promise<DoctorFee> {
    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (formData.amount !== undefined) updateData.amount = formData.amount;
    if (formData.validity_days !== undefined) updateData.validity_days = formData.validity_days;
    if (formData.description !== undefined) updateData.description = formData.description || null;
    if (formData.is_active !== undefined) updateData.is_active = formData.is_active;

    const { data, error } = await supabase
      .from('doctor_fees')
      .update(updateData as never)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as DoctorFee;
  }

  async deleteDoctorFee(id: string): Promise<void> {
    const { error } = await supabase
      .from('doctor_fees')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async getDoctorSchedules(doctorId: string): Promise<DoctorSchedule[]> {
    const { data, error } = await supabase
      .from('doctor_schedules')
      .select('*')
      .eq('doctor_id', doctorId)
      .order('day_of_week');

    if (error) throw error;
    return (data || []) as DoctorSchedule[];
  }

  async addDoctorSchedule(doctorId: string, formData: DoctorScheduleFormData): Promise<DoctorSchedule> {
    const { data, error } = await supabase
      .from('doctor_schedules')
      .insert({
        doctor_id: doctorId,
        day_of_week: formData.day_of_week,
        start_time: formData.start_time,
        end_time: formData.end_time,
        slot_duration_minutes: formData.slot_duration_minutes,
        max_patients: formData.max_patients,
        is_active: formData.is_active,
      } as never)
      .select()
      .single();

    if (error) throw error;
    return data as DoctorSchedule;
  }

  async updateDoctorSchedule(id: string, formData: Partial<DoctorScheduleFormData>): Promise<DoctorSchedule> {
    const updateData: Record<string, unknown> = {};

    if (formData.start_time !== undefined) updateData.start_time = formData.start_time;
    if (formData.end_time !== undefined) updateData.end_time = formData.end_time;
    if (formData.slot_duration_minutes !== undefined) updateData.slot_duration_minutes = formData.slot_duration_minutes;
    if (formData.max_patients !== undefined) updateData.max_patients = formData.max_patients;
    if (formData.is_active !== undefined) updateData.is_active = formData.is_active;

    const { data, error } = await supabase
      .from('doctor_schedules')
      .update(updateData as never)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as DoctorSchedule;
  }

  async deleteDoctorSchedule(id: string): Promise<void> {
    const { error } = await supabase
      .from('doctor_schedules')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  getConsultationFee(doctor: Doctor, feeType: DoctorFee['fee_type'] = 'consultation'): number {
    const fee = doctor.fees?.find(f => f.fee_type === feeType && f.is_active);
    return fee?.amount || 0;
  }
}

export const doctorsService = new DoctorsService();
