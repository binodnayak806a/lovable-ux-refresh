import { supabase } from '../lib/supabase';
import { mockStore } from '../lib/mockStore';

export interface PatientDetail {
  id: string;
  uhid: string;
  hospital_id: string;
  full_name: string;
  date_of_birth: string;
  age: number | null;
  gender: string;
  blood_group: string | null;
  phone: string;
  email: string | null;
  address: string;
  city: string;
  state: string;
  pincode: string | null;
  nationality: string;
  marital_status: string | null;
  occupation: string | null;
  referred_by: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_relation: string | null;
  aadhar_number: string | null;
  aadhaar_url: string | null;
  insurance_provider: string | null;
  insurance_number: string | null;
  insurance_expiry: string | null;
  registration_type: string | null;
  billing_category: string | null;
  custom_field_values: Record<string, unknown> | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CustomFieldConfig {
  id: string;
  hospital_id: string;
  form_name: string;
  field_label: string;
  field_type: 'text' | 'date' | 'dropdown' | 'toggle';
  is_mandatory: boolean;
  options: string[];
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface OPDVisit {
  id: string;
  appointment_date: string;
  appointment_time: string;
  type: string;
  status: string;
  chief_complaint: string | null;
  doctor_name: string;
}

export interface IPDAdmission {
  id: string;
  admission_number: string;
  admission_date: string;
  discharge_date: string | null;
  status: string;
  ward_name: string;
  primary_diagnosis: string | null;
}

export interface PatientPayment {
  id: string;
  payment_date: string;
  amount: number;
  payment_mode: string;
  payment_reference: string | null;
  bill_number: string | null;
}

export interface PatientVitalRecord {
  id: string;
  recorded_at: string;
  systolic_bp: number | null;
  diastolic_bp: number | null;
  heart_rate: number | null;
  temperature: number | null;
  spo2: number | null;
  weight: number | null;
  height: number | null;
  respiratory_rate: number | null;
}

export interface PatientPrescription {
  id: string;
  prescription_number: string;
  prescription_date: string;
  diagnosis: string | null;
  doctor_name: string;
  items: Array<{
    drug_name: string;
    dosage: string | null;
    frequency: string | null;
    duration_days: number | null;
  }>;
}

const patientService = {
  /**
   * Generates a sequential UHID per hospital using the current count + a random suffix.
   * Format: UHID-YYYYMMDD-XXXX
   */
  async generateUHID(hospitalId: string): Promise<string> {
    const d = new Date();
    const dateStr = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
    // Count today's patients in this hospital to get a sequential number
    const startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString();
    const { count } = await supabase
      .from('patients')
      .select('id', { count: 'exact', head: true })
      .eq('hospital_id', hospitalId)
      .gte('created_at', startOfDay);
    const seq = String((count ?? 0) + 1).padStart(4, '0');
    return `UHID-${dateStr}-${seq}`;
  },

  async getPatientById(patientId: string): Promise<PatientDetail | null> {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .eq('id', patientId)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const p = data as Record<string, unknown>;
    return {
      id: p.id as string,
      uhid: p.uhid as string,
      hospital_id: p.hospital_id as string,
      full_name: p.full_name as string,
      date_of_birth: (p.date_of_birth as string) || '',
      age: (p.age as number | null) ?? null,
      gender: (p.gender as string) || '',
      blood_group: (p.blood_group as string | null) ?? null,
      phone: (p.phone as string) || '',
      email: (p.email as string | null) ?? null,
      address: (p.address as string) || '',
      city: (p.city as string) || '',
      state: (p.state as string) || '',
      pincode: (p.pincode as string | null) ?? null,
      nationality: 'Indian',
      marital_status: (p.marital_status as string | null) ?? null,
      occupation: null,
      referred_by: null,
      emergency_contact_name: (p.emergency_contact_name as string | null) ?? null,
      emergency_contact_phone: (p.emergency_contact_phone as string | null) ?? null,
      emergency_contact_relation: (p.guardian_relation as string | null) ?? null,
      aadhar_number: (p.aadhar_number as string | null) ?? null,
      aadhaar_url: null,
      insurance_provider: null,
      insurance_number: (p.policy_number as string | null) ?? null,
      insurance_expiry: null,
      registration_type: (p.registration_type as string | null) ?? null,
      billing_category: (p.billing_category as string | null) ?? null,
      custom_field_values: null,
      is_active: (p.is_active as boolean) ?? true,
      created_at: p.created_at as string,
      updated_at: (p.updated_at as string) || (p.created_at as string),
    };
  },

  async uploadAadhaar(_patientId: string, _file: File): Promise<string> {
    return 'mock-aadhaar-url';
  },

  async getCustomFieldsConfig(_hospitalId: string, _formName = 'patient'): Promise<CustomFieldConfig[]> {
    return [];
  },

  async saveCustomFieldConfig(_hospitalId: string, config: Omit<CustomFieldConfig, 'id' | 'hospital_id' | 'created_at'>): Promise<CustomFieldConfig> {
    return { id: mockStore.uuid(), hospital_id: '11111111-1111-1111-1111-111111111111', created_at: new Date().toISOString(), ...config };
  },

  async updateCustomFieldConfig(_id: string, _updates: Partial<CustomFieldConfig>): Promise<void> {},
  async deleteCustomFieldConfig(_id: string): Promise<void> {},
  async updatePatientCustomFields(_patientId: string, _values: Record<string, unknown>): Promise<void> {},

  async getOPDVisits(patientId: string): Promise<OPDVisit[]> {
    const store = mockStore.get();
    return store.appointments
      .filter(a => a.patient_id === patientId)
      .sort((a, b) => b.appointment_date.localeCompare(a.appointment_date))
      .slice(0, 50)
      .map(a => ({
        id: a.id,
        appointment_date: a.appointment_date,
        appointment_time: a.appointment_time,
        type: a.type,
        status: a.status,
        chief_complaint: a.chief_complaint,
        doctor_name: mockStore.getDoctorName(a.doctor_id),
      }));
  },

  async getIPDAdmissions(_patientId: string): Promise<IPDAdmission[]> {
    return [];
  },

  async getPatientPayments(patientId: string): Promise<PatientPayment[]> {
    const store = mockStore.get();
    return store.bills
      .filter(b => b.patient_id === patientId)
      .map(b => ({
        id: b.id,
        payment_date: b.bill_date,
        amount: b.amount_paid,
        payment_mode: b.payment_mode,
        payment_reference: null,
        bill_number: b.bill_number,
      }));
  },

  async getPatientVitals(patientId: string): Promise<PatientVitalRecord[]> {
    return mockStore.getPatientVitals(patientId, 20).map(v => ({
      id: v.id,
      recorded_at: v.recorded_at,
      systolic_bp: v.systolic_bp,
      diastolic_bp: v.diastolic_bp,
      heart_rate: v.heart_rate,
      temperature: v.temperature,
      spo2: v.spo2,
      weight: v.weight,
      height: v.height,
      respiratory_rate: v.respiratory_rate,
    }));
  },

  async getPatientPrescriptions(patientId: string): Promise<PatientPrescription[]> {
    const store = mockStore.get();
    return store.prescriptions
      .filter(r => r.patient_id === patientId)
      .map(r => ({
        id: r.id,
        prescription_number: r.prescription_number,
        prescription_date: r.prescription_date,
        diagnosis: r.diagnosis,
        doctor_name: mockStore.getDoctorName(r.doctor_id),
        items: [],
      }));
  },
};

export default patientService;
