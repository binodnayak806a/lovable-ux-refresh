import { mockStore } from '../lib/mockStore';
import { mockMasterStore } from '../lib/mockMasterStore';

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

  async generateUHID(_hospitalId: string): Promise<string> {
    return mockStore.generateUHID();
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
    const uhid = mockStore.generateUHID();
    const fullName = [form.firstName, form.middleName, form.lastName].filter(Boolean).join(' ').trim();

    let dob = form.dateOfBirth;
    let age: number | null = null;
    if (!dob && form.ageYears) {
      age = parseInt(form.ageYears, 10);
      const year = new Date().getFullYear() - age;
      dob = `${year}-01-01`;
    } else if (dob) {
      age = new Date().getFullYear() - new Date(dob).getFullYear();
    }

    const patient = mockStore.addPatient({
      id: mockStore.uuid(),
      uhid,
      hospital_id: hospitalId,
      full_name: fullName,
      phone: form.phone,
      gender: form.gender,
      date_of_birth: dob || null,
      age,
      blood_group: form.bloodGroup || null,
      email: form.email || null,
      address: form.address || '',
      city: form.city || '',
      state: form.state || '',
      pincode: form.pincode || null,
      billing_category: form.billingCategory || 'cash',
      registration_type: form.appointmentType === 'Emergency' ? 'emergency' : 'walk-in',
      is_active: true,
      created_at: new Date().toISOString(),
    });

    let appointment = null;
    if (form.doctorId && form.appointmentDate) {
      appointment = mockStore.addAppointment({
        id: mockStore.uuid(),
        hospital_id: hospitalId,
        patient_id: patient.id,
        doctor_id: form.doctorId,
        appointment_date: form.appointmentDate,
        appointment_time: (form.appointmentTime || '09:00') + ':00',
        type: form.appointmentType === 'Follow-up' ? 'follow_up'
          : form.appointmentType === 'Emergency' ? 'emergency' : 'opd',
        status: 'scheduled',
        chief_complaint: form.chiefComplaint || null,
        created_at: new Date().toISOString(),
      });
    }

    return { patient, appointment };
  },

  async updatePatient(
    patientId: string,
    form: RegistrationFormData
  ) {
    const store = mockStore.get();
    const idx = store.patients.findIndex(p => p.id === patientId);
    if (idx === -1) throw new Error('Patient not found');

    let dob = form.dateOfBirth;
    let age: number | null = null;
    if (!dob && form.ageYears) {
      age = parseInt(form.ageYears, 10);
      dob = `${new Date().getFullYear() - age}-01-01`;
    } else if (dob) {
      age = new Date().getFullYear() - new Date(dob).getFullYear();
    }

    const updated = {
      ...store.patients[idx],
      full_name: `${form.firstName} ${form.lastName}`.trim(),
      date_of_birth: dob || null,
      age,
      gender: form.gender,
      blood_group: form.bloodGroup || null,
      phone: form.phone,
      email: form.email || null,
      address: form.address || '',
      city: form.city || '',
      state: form.state || '',
      pincode: form.pincode || null,
      billing_category: form.billingCategory || 'cash',
    };
    store.patients[idx] = updated;
    localStorage.setItem('hms_mock_store', JSON.stringify(store));
    return updated;
  },
};

export default opdService;
