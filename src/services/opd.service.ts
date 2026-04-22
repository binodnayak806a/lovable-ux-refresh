import { mockStore } from '../lib/mockStore';
import { mockMasterStore } from '../lib/mockMasterStore';
import { supabase } from '../lib/supabase';
import patientService from './patient.service';

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
  middleName: string;
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

const HOSPITAL_ID = '11111111-1111-1111-1111-111111111111';

const opdService = {
  async getDepartments(hospitalId: string): Promise<DepartmentOption[]> {
    const deps = mockMasterStore.getAll<{ id: string; name: string; code: string; hospital_id: string }>('departments', hospitalId);
    return deps.map(d => ({ id: d.id, name: d.name, code: d.code || d.name.slice(0, 3).toUpperCase() }));
  },

  async getDoctors(hospitalId: string, departmentId?: string): Promise<DoctorOption[]> {
    const docs = mockStore.getDoctors(hospitalId);
    let filtered = docs;
    if (departmentId) filtered = docs.filter(d => d.department_id === departmentId);
    return filtered.map(d => ({
      id: d.id,
      full_name: d.full_name,
      designation: d.designation,
      department: d.department,
      department_id: d.department_id,
    }));
  },

  async generateUHID(hospitalId: string): Promise<string> {
    return patientService.generateUHID(hospitalId);
  },

  async getAvailableSlots(doctorId: string, date: string): Promise<string[]> {
    const appts = mockStore.getAppointments(HOSPITAL_ID, date);
    const booked = new Set(appts.filter(a => a.doctor_id === doctorId).map(a => a.appointment_time.slice(0, 5)));
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
    _userId: string,
    form: RegistrationFormData
  ) {
    const uhid = await patientService.generateUHID(hospitalId);
    const fullName = [form.firstName, form.middleName, form.lastName].filter(Boolean).join(' ').trim();

    let dob: string | null = form.dateOfBirth || null;
    let age: number | null = null;
    if (!dob && form.ageYears) {
      age = parseInt(form.ageYears, 10);
      const year = new Date().getFullYear() - age;
      dob = `${year}-01-01`;
    } else if (dob) {
      age = new Date().getFullYear() - new Date(dob).getFullYear();
    }

    const insertPayload = {
      hospital_id: hospitalId,
      uhid,
      first_name: form.firstName,
      middle_name: form.middleName || null,
      last_name: form.lastName || null,
      full_name: fullName,
      date_of_birth: dob,
      age,
      gender: form.gender,
      blood_group: form.bloodGroup || null,
      phone: form.phone,
      email: form.email || null,
      aadhar_number: form.aadharNumber || null,
      address: form.address || null,
      city: form.city || null,
      state: form.state || null,
      pincode: form.pincode || null,
      guardian_name: form.guardianName || null,
      guardian_phone: form.guardianPhone || null,
      guardian_relation: form.guardianRelation || null,
      emergency_contact_name: form.emergencyContactName || null,
      emergency_contact_phone: form.emergencyContactPhone || null,
      allergies: form.allergies?.length ? form.allergies : null,
      pre_existing_conditions: form.preExistingConditions?.length ? form.preExistingConditions : null,
      current_medications: form.currentMedications || null,
      billing_category: form.billingCategory || 'cash',
      policy_number: form.policyNumber || null,
      registration_type: form.appointmentType === 'Emergency' ? 'emergency' : 'walk-in',
      is_active: true,
    };

    const { data: patient, error } = await supabase
      .from('patients')
      .insert(insertPayload as never)
      .select()
      .single();
    if (error) throw error;

    let appointment = null;
    if (form.doctorId && form.appointmentDate) {
      const { data: appt, error: apptErr } = await supabase
        .from('appointments')
        .insert({
          hospital_id: hospitalId,
          patient_id: (patient as { id: string }).id,
          doctor_id: form.doctorId,
          appointment_date: form.appointmentDate,
          appointment_time: (form.appointmentTime || '09:00') + ':00',
          type: form.appointmentType === 'Follow-up' ? 'follow_up'
            : form.appointmentType === 'Emergency' ? 'emergency' : 'opd',
          status: 'scheduled',
          chief_complaint: form.chiefComplaint || null,
        } as never)
        .select()
        .single();
      if (!apptErr) appointment = appt;
    }

    return { patient, appointment };
  },

  async updatePatient(
    patientId: string,
    form: RegistrationFormData
  ) {
    let dob: string | null = form.dateOfBirth || null;
    let age: number | null = null;
    if (!dob && form.ageYears) {
      age = parseInt(form.ageYears, 10);
      dob = `${new Date().getFullYear() - age}-01-01`;
    } else if (dob) {
      age = new Date().getFullYear() - new Date(dob).getFullYear();
    }

    const updates = {
      first_name: form.firstName,
      middle_name: form.middleName || null,
      last_name: form.lastName || null,
      full_name: [form.firstName, form.middleName, form.lastName].filter(Boolean).join(' ').trim(),
      date_of_birth: dob,
      age,
      gender: form.gender,
      blood_group: form.bloodGroup || null,
      phone: form.phone,
      email: form.email || null,
      aadhar_number: form.aadharNumber || null,
      address: form.address || null,
      city: form.city || null,
      state: form.state || null,
      pincode: form.pincode || null,
      guardian_name: form.guardianName || null,
      guardian_phone: form.guardianPhone || null,
      guardian_relation: form.guardianRelation || null,
      emergency_contact_name: form.emergencyContactName || null,
      emergency_contact_phone: form.emergencyContactPhone || null,
      billing_category: form.billingCategory || 'cash',
      policy_number: form.policyNumber || null,
    };

    const { data, error } = await supabase
      .from('patients')
      .update(updates as never)
      .eq('id', patientId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};

export default opdService;
