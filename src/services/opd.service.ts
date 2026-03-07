import { supabase } from '../lib/supabase';

export interface DepartmentOption {
  id: string;
  name: string;
  code: string;
}

export interface DoctorOption {
  id: string;
  full_name: string;
  designation: string | null;
  department: string | null;
  department_id: string | null;
}

export interface RegistrationFormData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  ageYears: string;
  gender: string;
  bloodGroup: string;
  phone: string;
  email: string;
  aadharNumber: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  guardianName: string;
  guardianPhone: string;
  guardianRelation: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  allergies: string[];
  preExistingConditions: string[];
  currentMedications: string;
  departmentId: string;
  doctorId: string;
  appointmentDate: string;
  appointmentTime: string;
  appointmentType: string;
  chiefComplaint: string;
  referredBy: string;
  billingCategory: string;
  insuranceCompany: string;
  policyNumber: string;
}

const opdService = {
  async getDepartments(hospitalId: string): Promise<DepartmentOption[]> {
    const { data, error } = await supabase
      .from('departments')
      .select('id, name, code')
      .eq('hospital_id', hospitalId)
      .eq('is_active', true)
      .order('name');
    if (error) throw error;
    return (data ?? []) as DepartmentOption[];
  },

  async getDoctors(hospitalId: string, departmentId?: string): Promise<DoctorOption[]> {
    let query = supabase
      .from('profiles')
      .select('id, full_name, designation, department, department_id')
      .eq('hospital_id', hospitalId)
      .eq('role', 'doctor')
      .eq('is_active', true)
      .order('full_name');

    if (departmentId) {
      query = query.eq('department_id', departmentId) as typeof query;
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as DoctorOption[];
  },

  async generateUHID(hospitalId: string): Promise<string> {
    const { data, error } = await supabase.rpc('generate_uhid' as never, {
      p_hospital_id: hospitalId,
    } as never);
    if (!error && data) return data as string;
    const today = new Date();
    const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
    const rand = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
    return `UHID-${dateStr}-${rand}`;
  },

  async getAvailableSlots(doctorId: string, date: string): Promise<string[]> {
    const { data } = await supabase
      .from('appointments')
      .select('appointment_time')
      .eq('doctor_id', doctorId)
      .eq('appointment_date', date)
      .neq('status', 'cancelled');

    const booked = new Set(((data ?? []) as { appointment_time: string }[]).map((r) => r.appointment_time.slice(0, 5)));
    const slots: string[] = [];
    for (let m = 9 * 60; m < 17 * 60; m += 15) {
      const h = Math.floor(m / 60).toString().padStart(2, '0');
      const min = (m % 60).toString().padStart(2, '0');
      const t = `${h}:${min}`;
      if (!booked.has(t)) slots.push(t);
    }
    return slots;
  },

  async registerPatient(
    hospitalId: string,
    userId: string,
    form: RegistrationFormData
  ) {
    const uhid = await opdService.generateUHID(hospitalId);

    let dob = form.dateOfBirth;
    if (!dob && form.ageYears) {
      const year = new Date().getFullYear() - parseInt(form.ageYears, 10);
      dob = `${year}-01-01`;
    }

    const { data: patient, error: patientErr } = await supabase
      .from('patients')
      .insert({
        uhid,
        hospital_id: hospitalId,
        full_name: `${form.firstName} ${form.lastName}`.trim(),
        date_of_birth: dob,
        gender: form.gender,
        blood_group: form.bloodGroup || null,
        phone: form.phone,
        email: form.email || null,
        address: form.address || '',
        city: form.city || '',
        state: form.state || '',
        pincode: form.pincode || null,
        aadhar_number: form.aadharNumber || null,
        referred_by: form.referredBy || null,
        guardian_name: form.guardianName || null,
        guardian_phone: form.guardianPhone || null,
        guardian_relation: form.guardianRelation || null,
        emergency_contact_name: form.emergencyContactName || null,
        emergency_contact_phone: form.emergencyContactPhone || null,
        insurance_provider: form.billingCategory === 'insurance' ? form.insuranceCompany : null,
        insurance_number: form.billingCategory === 'insurance' ? form.policyNumber : null,
        registration_type: form.appointmentType === 'Emergency' ? 'emergency' : 'walk-in',
        billing_category: form.billingCategory || 'cash',
        created_by: userId,
        is_active: true,
      } as never)
      .select()
      .single();

    if (patientErr) throw patientErr;
    const patientId = (patient as { id: string }).id;

    const { data: appointment, error: apptErr } = await supabase
      .from('appointments')
      .insert({
        hospital_id: hospitalId,
        patient_id: patientId,
        doctor_id: form.doctorId,
        appointment_date: form.appointmentDate,
        appointment_time: form.appointmentTime + ':00',
        type: form.appointmentType === 'Follow-up' ? 'follow_up'
          : form.appointmentType === 'Emergency' ? 'emergency' : 'opd',
        status: 'scheduled',
        chief_complaint: form.chiefComplaint || null,
        created_by: userId,
      } as never)
      .select()
      .single();

    if (apptErr) throw apptErr;

    const historyRecords: {
      patient_id: string;
      history_type: string;
      condition_name: string;
    }[] = [];

    for (const allergy of form.allergies) {
      if (allergy.trim()) {
        historyRecords.push({ patient_id: patientId, history_type: 'allergy', condition_name: allergy.trim() });
      }
    }
    for (const cond of form.preExistingConditions) {
      if (cond.trim()) {
        historyRecords.push({ patient_id: patientId, history_type: 'past', condition_name: cond.trim() });
      }
    }
    if (form.currentMedications.trim()) {
      historyRecords.push({ patient_id: patientId, history_type: 'drug', condition_name: form.currentMedications.trim() });
    }

    if (historyRecords.length > 0) {
      await supabase.from('medical_history').insert(historyRecords as never);
    }

    return { patient, appointment };
  },
};

export default opdService;
