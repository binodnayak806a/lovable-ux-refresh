import { supabase } from '../lib/supabase';

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
  async generateUHID(hospitalId: string): Promise<string> {
    const { data, error } = await supabase.rpc('generate_uhid' as never, {
      p_hospital_id: hospitalId,
    } as never);
    if (error) {
      const today = new Date();
      const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
      const rand = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
      return `UHID-${dateStr}-${rand}`;
    }
    return data as string;
  },

  async getPatientById(patientId: string): Promise<PatientDetail | null> {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .eq('id', patientId)
      .maybeSingle();
    if (error) throw error;
    return data as PatientDetail | null;
  },

  async uploadAadhaar(patientId: string, file: File): Promise<string> {
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `aadhaar/${patientId}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('patient-docs')
      .upload(path, file, { upsert: true });
    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from('patient-docs')
      .getPublicUrl(path);

    const url = urlData.publicUrl;

    const { error: updateError } = await supabase
      .from('patients')
      .update({ aadhaar_url: url } as never)
      .eq('id', patientId);
    if (updateError) throw updateError;

    return url;
  },

  async getCustomFieldsConfig(hospitalId: string, formName = 'patient'): Promise<CustomFieldConfig[]> {
    const { data, error } = await supabase
      .from('custom_fields_config')
      .select('*')
      .eq('hospital_id', hospitalId)
      .eq('form_name', formName)
      .eq('is_active', true)
      .order('sort_order');
    if (error) throw error;
    return (data ?? []) as CustomFieldConfig[];
  },

  async saveCustomFieldConfig(
    hospitalId: string,
    config: Omit<CustomFieldConfig, 'id' | 'hospital_id' | 'created_at'>
  ): Promise<CustomFieldConfig> {
    const { data, error } = await supabase
      .from('custom_fields_config')
      .insert({
        hospital_id: hospitalId,
        form_name: config.form_name,
        field_label: config.field_label,
        field_type: config.field_type,
        is_mandatory: config.is_mandatory,
        options: config.options,
        sort_order: config.sort_order,
        is_active: config.is_active,
      } as never)
      .select()
      .single();
    if (error) throw error;
    return data as CustomFieldConfig;
  },

  async updateCustomFieldConfig(
    id: string,
    updates: Partial<CustomFieldConfig>
  ): Promise<void> {
    const { error } = await supabase
      .from('custom_fields_config')
      .update(updates as never)
      .eq('id', id);
    if (error) throw error;
  },

  async deleteCustomFieldConfig(id: string): Promise<void> {
    const { error } = await supabase
      .from('custom_fields_config')
      .update({ is_active: false } as never)
      .eq('id', id);
    if (error) throw error;
  },

  async updatePatientCustomFields(
    patientId: string,
    values: Record<string, unknown>
  ): Promise<void> {
    const { error } = await supabase
      .from('patients')
      .update({ custom_field_values: values } as never)
      .eq('id', patientId);
    if (error) throw error;
  },

  async getOPDVisits(patientId: string): Promise<OPDVisit[]> {
    const { data, error } = await supabase
      .from('appointments')
      .select('id, appointment_date, appointment_time, type, status, chief_complaint, doctor:profiles!doctor_id(full_name)')
      .eq('patient_id', patientId)
      .order('appointment_date', { ascending: false })
      .order('appointment_time', { ascending: false })
      .limit(50);
    if (error) throw error;
    return (data ?? []).map((row: Record<string, unknown>) => ({
      id: row.id as string,
      appointment_date: row.appointment_date as string,
      appointment_time: row.appointment_time as string,
      type: row.type as string,
      status: row.status as string,
      chief_complaint: row.chief_complaint as string | null,
      doctor_name: ((row.doctor as Record<string, unknown>)?.full_name as string) ?? 'Unknown',
    }));
  },

  async getIPDAdmissions(patientId: string): Promise<IPDAdmission[]> {
    const { data, error } = await supabase
      .from('admissions')
      .select('id, admission_number, admission_date, discharge_date, status, primary_diagnosis, ward:wards!ward_id(name)')
      .eq('patient_id', patientId)
      .order('admission_date', { ascending: false })
      .limit(50);
    if (error) throw error;
    return (data ?? []).map((row: Record<string, unknown>) => ({
      id: row.id as string,
      admission_number: row.admission_number as string,
      admission_date: row.admission_date as string,
      discharge_date: row.discharge_date as string | null,
      status: row.status as string,
      primary_diagnosis: row.primary_diagnosis as string | null,
      ward_name: ((row.ward as Record<string, unknown>)?.name as string) ?? 'Unknown',
    }));
  },

  async getPatientPayments(patientId: string): Promise<PatientPayment[]> {
    const { data: bills, error: billsErr } = await supabase
      .from('bills')
      .select('id, bill_number')
      .eq('patient_id', patientId);
    if (billsErr) throw billsErr;

    if (!bills || bills.length === 0) return [];

    const billIds = (bills as { id: string; bill_number: string }[]).map((b) => b.id);
    const billMap = new Map((bills as { id: string; bill_number: string }[]).map((b) => [b.id, b.bill_number]));

    const { data, error } = await supabase
      .from('payments')
      .select('id, payment_date, amount, payment_mode, payment_reference, bill_id')
      .in('bill_id', billIds)
      .order('payment_date', { ascending: false })
      .limit(50);
    if (error) throw error;

    return (data ?? []).map((row: Record<string, unknown>) => ({
      id: row.id as string,
      payment_date: row.payment_date as string,
      amount: Number(row.amount) || 0,
      payment_mode: row.payment_mode as string,
      payment_reference: row.payment_reference as string | null,
      bill_number: billMap.get(row.bill_id as string) ?? null,
    }));
  },

  async getPatientVitals(patientId: string): Promise<PatientVitalRecord[]> {
    const { data, error } = await supabase
      .from('vitals')
      .select('id, recorded_at, systolic_bp, diastolic_bp, heart_rate, temperature, spo2, weight, height, respiratory_rate')
      .eq('patient_id', patientId)
      .order('recorded_at', { ascending: false })
      .limit(20);
    if (error) throw error;
    return (data ?? []) as PatientVitalRecord[];
  },

  async getPatientPrescriptions(patientId: string): Promise<PatientPrescription[]> {
    const { data, error } = await supabase
      .from('prescriptions')
      .select('id, prescription_number, prescription_date, diagnosis, doctor_id, doctor:profiles!doctor_id(full_name)')
      .eq('patient_id', patientId)
      .order('prescription_date', { ascending: false })
      .limit(20);
    if (error) throw error;

    const prescriptions = (data ?? []) as Array<Record<string, unknown>>;
    const results: PatientPrescription[] = [];

    for (const rx of prescriptions) {
      const { data: items } = await supabase
        .from('prescription_items')
        .select('drug_name, dosage, frequency, duration_days')
        .eq('prescription_id', rx.id as string)
        .order('sort_order');

      results.push({
        id: rx.id as string,
        prescription_number: rx.prescription_number as string,
        prescription_date: rx.prescription_date as string,
        diagnosis: rx.diagnosis as string | null,
        doctor_name: ((rx.doctor as Record<string, unknown>)?.full_name as string) ?? 'Unknown',
        items: (items ?? []) as Array<{
          drug_name: string;
          dosage: string | null;
          frequency: string | null;
          duration_days: number | null;
        }>,
      });
    }

    return results;
  },
};

export default patientService;
