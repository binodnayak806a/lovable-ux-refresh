/**
 * Mock data store — localStorage-backed for demo purposes.
 * Provides seed data for the full OPD flow when the DB is empty.
 */

const STORE_KEY = 'hms_mock_store';

export interface MockPatient {
  id: string;
  uhid: string;
  hospital_id: string;
  full_name: string;
  phone: string;
  gender: string;
  date_of_birth: string | null;
  age: number | null;
  blood_group: string | null;
  email: string | null;
  address: string;
  city: string;
  state: string;
  pincode: string | null;
  billing_category: string;
  registration_type: string;
  is_active: boolean;
  created_at: string;
}

export interface MockAppointment {
  id: string;
  hospital_id: string;
  patient_id: string;
  doctor_id: string;
  appointment_date: string;
  appointment_time: string;
  type: string;
  status: string;
  chief_complaint: string | null;
  created_at: string;
}

export interface MockDoctor {
  id: string;
  full_name: string;
  designation: string;
  department: string;
  department_id: string;
  hospital_id: string;
}

export interface MockVitals {
  id: string;
  patient_id: string;
  appointment_id: string | null;
  systolic_bp: number | null;
  diastolic_bp: number | null;
  heart_rate: number | null;
  respiratory_rate: number | null;
  temperature: number | null;
  spo2: number | null;
  height: number | null;
  weight: number | null;
  bmi: number | null;
  pain_scale: number;
  blood_glucose_level: number | null;
  is_abnormal: boolean;
  notes: string | null;
  recorded_by: string;
  recorded_at: string;
}

export interface MockConsultation {
  id: string;
  patient_id: string;
  appointment_id: string | null;
  doctor_id: string;
  chief_complaint: string | null;
  assessment: string | null;
  plan: string | null;
  is_completed: boolean;
  consultation_date: string;
  created_at: string;
}

export interface MockBill {
  id: string;
  bill_number: string;
  patient_id: string;
  consultation_id: string | null;
  bill_type: string;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  amount_paid: number;
  payment_status: string;
  payment_mode: string;
  notes: string | null;
  bill_date: string;
  created_at: string;
}

export interface MockPrescription {
  id: string;
  prescription_number: string;
  patient_id: string;
  consultation_id: string | null;
  doctor_id: string;
  diagnosis: string | null;
  general_advice: string | null;
  follow_up_date: string | null;
  is_dispensed: boolean;
  prescription_date: string;
  created_at: string;
}

interface MockStore {
  patients: MockPatient[];
  appointments: MockAppointment[];
  doctors: MockDoctor[];
  vitals: MockVitals[];
  consultations: MockConsultation[];
  bills: MockBill[];
  prescriptions: MockPrescription[];
  _seeded: boolean;
}

const HOSPITAL_ID = '11111111-1111-1111-1111-111111111111';

function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

const today = new Date().toISOString().split('T')[0];

function seedData(): MockStore {
  const doctors: MockDoctor[] = [
    { id: uuid(), full_name: 'Dr. Rajesh Kumar', designation: 'MBBS, MD (Medicine)', department: 'General Medicine', department_id: uuid(), hospital_id: HOSPITAL_ID },
    { id: uuid(), full_name: 'Dr. Priya Sharma', designation: 'MBBS, MS (Surgery)', department: 'General Surgery', department_id: uuid(), hospital_id: HOSPITAL_ID },
    { id: uuid(), full_name: 'Dr. Anand Patel', designation: 'MBBS, MD (Pediatrics)', department: 'Pediatrics', department_id: uuid(), hospital_id: HOSPITAL_ID },
    { id: uuid(), full_name: 'Dr. Sneha Reddy', designation: 'MBBS, DGO', department: 'Obstetrics & Gynecology', department_id: uuid(), hospital_id: HOSPITAL_ID },
    { id: uuid(), full_name: 'Dr. Vikram Singh', designation: 'MBBS, MS (Ortho)', department: 'Orthopedics', department_id: uuid(), hospital_id: HOSPITAL_ID },
  ];

  const patients: MockPatient[] = [
    { id: uuid(), uhid: 'UHID-20260308-0001', hospital_id: HOSPITAL_ID, full_name: 'Ramesh Gupta', phone: '9876543210', gender: 'male', date_of_birth: '1985-03-15', age: 41, blood_group: 'B+', email: 'ramesh@example.com', address: '12, MG Road', city: 'Mumbai', state: 'Maharashtra', pincode: '400001', billing_category: 'cash', registration_type: 'walk-in', is_active: true, created_at: new Date().toISOString() },
    { id: uuid(), uhid: 'UHID-20260308-0002', hospital_id: HOSPITAL_ID, full_name: 'Sunita Devi', phone: '9876543211', gender: 'female', date_of_birth: '1992-07-20', age: 33, blood_group: 'O+', email: null, address: '45, Nehru Nagar', city: 'Delhi', state: 'Delhi', pincode: '110001', billing_category: 'insurance', registration_type: 'walk-in', is_active: true, created_at: new Date().toISOString() },
    { id: uuid(), uhid: 'UHID-20260308-0003', hospital_id: HOSPITAL_ID, full_name: 'Mohd Irfan', phone: '9876543212', gender: 'male', date_of_birth: '1978-11-05', age: 47, blood_group: 'A+', email: 'irfan@example.com', address: '78, Civil Lines', city: 'Lucknow', state: 'Uttar Pradesh', pincode: '226001', billing_category: 'cash', registration_type: 'walk-in', is_active: true, created_at: new Date().toISOString() },
    { id: uuid(), uhid: 'UHID-20260308-0004', hospital_id: HOSPITAL_ID, full_name: 'Lakshmi Nair', phone: '9876543213', gender: 'female', date_of_birth: '2000-01-10', age: 26, blood_group: 'AB+', email: null, address: '23, Park Street', city: 'Kochi', state: 'Kerala', pincode: '682001', billing_category: 'cash', registration_type: 'walk-in', is_active: true, created_at: new Date().toISOString() },
    { id: uuid(), uhid: 'UHID-20260308-0005', hospital_id: HOSPITAL_ID, full_name: 'Arjun Mehta', phone: '9876543214', gender: 'male', date_of_birth: '1965-05-22', age: 60, blood_group: 'O-', email: 'arjun.m@example.com', address: '56, Ring Road', city: 'Ahmedabad', state: 'Gujarat', pincode: '380001', billing_category: 'tpa', registration_type: 'walk-in', is_active: true, created_at: new Date().toISOString() },
    { id: uuid(), uhid: 'UHID-20260308-0006', hospital_id: HOSPITAL_ID, full_name: 'Deepa Verma', phone: '9876543215', gender: 'female', date_of_birth: '1990-09-30', age: 35, blood_group: 'B-', email: null, address: '89, Koramangala', city: 'Bangalore', state: 'Karnataka', pincode: '560034', billing_category: 'cash', registration_type: 'walk-in', is_active: true, created_at: new Date().toISOString() },
  ];

  const appointments: MockAppointment[] = [
    { id: uuid(), hospital_id: HOSPITAL_ID, patient_id: patients[0].id, doctor_id: doctors[0].id, appointment_date: today, appointment_time: '09:00:00', type: 'opd', status: 'scheduled', chief_complaint: 'Fever and body ache since 3 days', created_at: new Date().toISOString() },
    { id: uuid(), hospital_id: HOSPITAL_ID, patient_id: patients[1].id, doctor_id: doctors[3].id, appointment_date: today, appointment_time: '09:30:00', type: 'opd', status: 'in_progress', chief_complaint: 'Routine checkup', created_at: new Date().toISOString() },
    { id: uuid(), hospital_id: HOSPITAL_ID, patient_id: patients[2].id, doctor_id: doctors[0].id, appointment_date: today, appointment_time: '10:00:00', type: 'follow_up', status: 'scheduled', chief_complaint: 'Follow-up for diabetes management', created_at: new Date().toISOString() },
    { id: uuid(), hospital_id: HOSPITAL_ID, patient_id: patients[3].id, doctor_id: doctors[2].id, appointment_date: today, appointment_time: '10:30:00', type: 'opd', status: 'completed', chief_complaint: 'Cold and cough', created_at: new Date().toISOString() },
    { id: uuid(), hospital_id: HOSPITAL_ID, patient_id: patients[4].id, doctor_id: doctors[4].id, appointment_date: today, appointment_time: '11:00:00', type: 'opd', status: 'scheduled', chief_complaint: 'Knee pain for 2 weeks', created_at: new Date().toISOString() },
    { id: uuid(), hospital_id: HOSPITAL_ID, patient_id: patients[5].id, doctor_id: doctors[1].id, appointment_date: today, appointment_time: '11:30:00', type: 'emergency', status: 'scheduled', chief_complaint: 'Acute abdominal pain', created_at: new Date().toISOString() },
  ];

  return {
    patients,
    appointments,
    doctors,
    vitals: [],
    consultations: [],
    bills: [],
    prescriptions: [],
    _seeded: true,
  };
}

function loadStore(): MockStore {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as MockStore;
      if (parsed._seeded) return parsed;
    }
  } catch { /* noop */ }
  const store = seedData();
  saveStore(store);
  return store;
}

function saveStore(store: MockStore) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(store));
  } catch { /* noop */ }
}

// ── Public API ──

export const mockStore = {
  get(): MockStore {
    return loadStore();
  },

  reset() {
    const store = seedData();
    saveStore(store);
    return store;
  },

  // Patients
  getPatients(hospitalId: string, search?: string): MockPatient[] {
    const store = loadStore();
    let pts = store.patients.filter(p => p.hospital_id === hospitalId && p.is_active);
    if (search?.trim()) {
      const q = search.toLowerCase();
      pts = pts.filter(p =>
        p.full_name.toLowerCase().includes(q) ||
        p.uhid.toLowerCase().includes(q) ||
        p.phone.includes(q)
      );
    }
    return pts;
  },

  getPatientById(id: string): MockPatient | null {
    return loadStore().patients.find(p => p.id === id) ?? null;
  },

  addPatient(patient: MockPatient): MockPatient {
    const store = loadStore();
    store.patients.push(patient);
    saveStore(store);
    return patient;
  },

  generateUHID(): string {
    const d = new Date();
    const dateStr = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
    const store = loadStore();
    const seq = String(store.patients.length + 1).padStart(4, '0');
    return `UHID-${dateStr}-${seq}`;
  },

  // Appointments
  getAppointments(hospitalId: string, date?: string, status?: string): MockAppointment[] {
    const store = loadStore();
    let appts = store.appointments.filter(a => a.hospital_id === hospitalId);
    if (date) appts = appts.filter(a => a.appointment_date === date);
    if (status && status !== 'all') appts = appts.filter(a => a.status === status);
    return appts.sort((a, b) => a.appointment_time.localeCompare(b.appointment_time));
  },

  addAppointment(appt: MockAppointment): MockAppointment {
    const store = loadStore();
    store.appointments.push(appt);
    saveStore(store);
    return appt;
  },

  updateAppointmentStatus(id: string, status: string) {
    const store = loadStore();
    const appt = store.appointments.find(a => a.id === id);
    if (appt) { appt.status = status; saveStore(store); }
  },

  // Doctors
  getDoctors(hospitalId: string): MockDoctor[] {
    return loadStore().doctors.filter(d => d.hospital_id === hospitalId);
  },

  // Vitals
  addVitals(vitals: MockVitals): MockVitals {
    const store = loadStore();
    store.vitals.push(vitals);
    saveStore(store);
    return vitals;
  },

  getPatientVitals(patientId: string, limit = 10): MockVitals[] {
    return loadStore().vitals
      .filter(v => v.patient_id === patientId)
      .sort((a, b) => b.recorded_at.localeCompare(a.recorded_at))
      .slice(0, limit);
  },

  // Consultations
  addConsultation(c: MockConsultation): MockConsultation {
    const store = loadStore();
    store.consultations.push(c);
    saveStore(store);
    return c;
  },

  // Bills
  addBill(bill: MockBill): MockBill {
    const store = loadStore();
    store.bills.push(bill);
    saveStore(store);
    return bill;
  },

  generateBillNumber(): string {
    const d = new Date();
    const dateStr = d.toISOString().slice(0, 10).replace(/-/g, '');
    const store = loadStore();
    const seq = String(store.bills.length + 1).padStart(4, '0');
    return `INV${dateStr}-${seq}`;
  },

  // Prescriptions
  addPrescription(rx: MockPrescription): MockPrescription {
    const store = loadStore();
    store.prescriptions.push(rx);
    saveStore(store);
    return rx;
  },

  generatePrescriptionNumber(): string {
    const d = new Date();
    const dateStr = d.toISOString().slice(0, 10).replace(/-/g, '');
    const store = loadStore();
    const seq = String(store.prescriptions.length + 1).padStart(4, '0');
    return `RX${dateStr}-${seq}`;
  },

  // Resolve names
  getPatientName(patientId: string): string {
    return loadStore().patients.find(p => p.id === patientId)?.full_name ?? 'Unknown';
  },

  getDoctorName(doctorId: string): string {
    return loadStore().doctors.find(d => d.id === doctorId)?.full_name ?? 'Unknown';
  },

  uuid,
};
