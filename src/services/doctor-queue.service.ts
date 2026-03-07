import { supabase } from '../lib/supabase';

export interface QueueAppointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  hospital_id: string;
  patient_name: string;
  patient_uhid: string;
  patient_gender: string | null;
  patient_dob: string | null;
  patient_age: number | null;
  appointment_date: string;
  appointment_time: string;
  status: string;
  chief_complaint: string | null;
  token_number: number | null;
  visit_type: string | null;
  emergency: boolean;
  created_at: string;
}

export interface PatientInfo {
  id: string;
  full_name: string;
  uhid: string;
  gender: string | null;
  date_of_birth: string | null;
  age: number | null;
  phone: string | null;
  last_visit_date: string | null;
}

export interface InvestigationItem {
  test_id: string;
  test_name: string;
  test_code: string;
  test_price: number;
}

export interface ConsultationSaveData {
  appointment_id: string;
  patient_id: string;
  doctor_id: string;
  hospital_id: string;
  chief_complaint: string;
  examination_notes: string;
  diagnosis: string;
  advice: string;
  followup_date: string | null;
  symptoms: Array<{ symptom_id: string; name: string; severity: string }>;
  diagnoses: Array<{ diagnosis_id: string; name: string; icd10_code: string | null; type: string }>;
  investigations: InvestigationItem[];
  prescriptionItems: PrescriptionDrug[];
}

export interface PrescriptionDrug {
  id: string;
  medicine_name: string;
  dose: string;
  frequency: string;
  duration: string;
  instructions: string;
  medication_id: string | null;
}

const QUEUE_SELECT = `
  id, patient_id, doctor_id, hospital_id, appointment_date, appointment_time,
  status, chief_complaint, token_number, visit_type, emergency, created_at,
  patients!inner(full_name, uhid, gender, date_of_birth, age)
`;

function mapQueueRow(row: Record<string, unknown>): QueueAppointment {
  const patient = row.patients as Record<string, unknown>;
  return {
    id: row.id as string,
    patient_id: row.patient_id as string,
    doctor_id: row.doctor_id as string,
    hospital_id: row.hospital_id as string,
    patient_name: (patient?.full_name as string) ?? '',
    patient_uhid: (patient?.uhid as string) ?? '',
    patient_gender: (patient?.gender as string) ?? null,
    patient_dob: (patient?.date_of_birth as string) ?? null,
    patient_age: (patient?.age as number) ?? null,
    appointment_date: row.appointment_date as string,
    appointment_time: row.appointment_time as string,
    status: row.status as string,
    chief_complaint: row.chief_complaint as string | null,
    token_number: row.token_number as number | null,
    visit_type: row.visit_type as string | null,
    emergency: (row.emergency as boolean) ?? false,
    created_at: row.created_at as string,
  };
}

const doctorQueueService = {
  async getTodayQueue(doctorId: string, hospitalId: string): Promise<QueueAppointment[]> {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('appointments')
      .select(QUEUE_SELECT)
      .eq('hospital_id', hospitalId)
      .eq('doctor_id', doctorId)
      .eq('appointment_date', today)
      .order('token_number', { ascending: true });

    if (error) throw error;
    return (data ?? []).map((r: Record<string, unknown>) => mapQueueRow(r));
  },

  async getPatientInfo(patientId: string): Promise<PatientInfo | null> {
    const { data, error } = await supabase
      .from('patients')
      .select('id, full_name, uhid, gender, date_of_birth, age, phone')
      .eq('id', patientId)
      .maybeSingle();

    if (error || !data) return null;

    const { data: lastAppt } = await supabase
      .from('appointments')
      .select('appointment_date')
      .eq('patient_id', patientId)
      .eq('status', 'completed')
      .order('appointment_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    return {
      ...(data as Omit<PatientInfo, 'last_visit_date'>),
      last_visit_date: (lastAppt as { appointment_date: string } | null)?.appointment_date ?? null,
    };
  },

  async searchSymptoms(term: string) {
    if (!term || term.length < 1) {
      const { data } = await supabase
        .from('symptoms')
        .select('id, name, category')
        .eq('is_active', true)
        .order('usage_count', { ascending: false })
        .limit(20);
      return (data ?? []) as Array<{ id: string; name: string; category: string }>;
    }
    const { data } = await supabase
      .from('symptoms')
      .select('id, name, category')
      .eq('is_active', true)
      .ilike('name', `%${term}%`)
      .order('usage_count', { ascending: false })
      .limit(20);
    return (data ?? []) as Array<{ id: string; name: string; category: string }>;
  },

  async searchDiagnoses(term: string) {
    if (!term || term.length < 2) return [];
    const { data } = await supabase
      .from('diagnoses')
      .select('id, name, icd10_code, category')
      .eq('is_active', true)
      .or(`name.ilike.%${term}%,icd10_code.ilike.%${term}%`)
      .order('name')
      .limit(15);
    return (data ?? []) as Array<{ id: string; name: string; icd10_code: string | null; category: string }>;
  },

  async searchInvestigations(term: string) {
    if (!term || term.length < 2) return [];
    const { data } = await supabase
      .from('lab_tests')
      .select('id, test_name, test_code, price')
      .eq('is_active', true)
      .or(`test_name.ilike.%${term}%,test_code.ilike.%${term}%`)
      .order('test_name')
      .limit(15);
    return (data ?? []).map((t: Record<string, unknown>) => ({
      test_id: t.id as string,
      test_name: t.test_name as string,
      test_code: t.test_code as string,
      test_price: Number(t.price ?? 0),
    })) as InvestigationItem[];
  },

  async searchMedications(term: string) {
    if (!term || term.length < 2) return [];
    const { data } = await supabase
      .from('medications')
      .select('id, generic_name, brand_name, form, strength')
      .eq('is_active', true)
      .or(`generic_name.ilike.%${term}%,brand_name.ilike.%${term}%`)
      .order('usage_count', { ascending: false })
      .limit(15);
    return (data ?? []) as Array<{
      id: string;
      generic_name: string;
      brand_name: string | null;
      form: string;
      strength: string | null;
    }>;
  },

  async getSetting(hospitalId: string, key: string): Promise<string | null> {
    const { data } = await supabase
      .from('settings')
      .select('value')
      .eq('hospital_id', hospitalId)
      .eq('key', key)
      .maybeSingle();
    return (data as { value: string } | null)?.value ?? null;
  },

  async getHospitalSettings(hospitalId: string): Promise<Record<string, string>> {
    const { data } = await supabase
      .from('settings')
      .select('key, value')
      .eq('hospital_id', hospitalId);
    const map: Record<string, string> = {};
    for (const row of (data ?? []) as { key: string; value: string }[]) {
      map[row.key] = row.value;
    }
    return map;
  },

  async saveConsultation(payload: ConsultationSaveData): Promise<string> {
    const { data: consultation, error: consultationError } = await supabase
      .from('consultations')
      .insert({
        hospital_id: payload.hospital_id,
        appointment_id: payload.appointment_id,
        patient_id: payload.patient_id,
        doctor_id: payload.doctor_id,
        chief_complaint: payload.chief_complaint || null,
        physical_examination: payload.examination_notes || null,
        diagnosis: payload.diagnosis || null,
        advice: payload.advice || null,
        follow_up_date: payload.followup_date || null,
        is_completed: true,
        status: 'completed',
      } as never)
      .select('id')
      .single();

    if (consultationError) throw consultationError;
    const consultationId = (consultation as { id: string }).id;

    if (payload.symptoms.length > 0) {
      const symptomRecords = payload.symptoms.map(s => ({
        consultation_id: consultationId,
        symptom_id: s.symptom_id,
        severity: s.severity || 'moderate',
        notes: null,
      }));
      const { error: sympError } = await supabase.from('consultation_symptoms').insert(symptomRecords as never);
      if (sympError) throw sympError;
    }

    if (payload.diagnoses.length > 0) {
      const diagRecords = payload.diagnoses.map((d, idx) => ({
        consultation_id: consultationId,
        diagnosis_id: d.diagnosis_id,
        diagnosis_type: idx === 0 ? 'primary' : d.type,
        severity: 'moderate',
        notes: null,
      }));
      const { error: diagError } = await supabase.from('consultation_diagnoses').insert(diagRecords as never);
      if (diagError) throw diagError;
    }

    if (payload.investigations.length > 0) {
      const orderNumber = `LAB-${Date.now()}`;
      const totalAmt = payload.investigations.reduce((s, t) => s + t.test_price, 0);

      const { data: labOrder, error: labError } = await supabase
        .from('lab_orders')
        .insert({
          order_number: orderNumber,
          hospital_id: payload.hospital_id,
          patient_id: payload.patient_id,
          doctor_id: payload.doctor_id,
          appointment_id: payload.appointment_id,
          consultation_id: consultationId,
          order_date: new Date().toISOString().split('T')[0],
          priority: 'routine',
          status: 'pending',
          total_amount: totalAmt,
          created_by: payload.doctor_id,
        } as never)
        .select('id')
        .single();

      if (!labError && labOrder) {
        const orderId = (labOrder as { id: string }).id;
        const items = payload.investigations.map(t => ({
          order_id: orderId,
          test_id: t.test_id,
          test_name: t.test_name,
          test_code: t.test_code,
          test_price: t.test_price,
          price: t.test_price,
          status: 'pending',
        }));
        const { error: itemsError } = await supabase.from('lab_order_items').insert(items as never);
        if (itemsError) throw itemsError;
      }
    }

    if (payload.prescriptionItems.length > 0) {
      const rxNumber = `RX-${Date.now()}`;
      const { data: rx, error: rxError } = await supabase
        .from('prescriptions')
        .insert({
          hospital_id: payload.hospital_id,
          patient_id: payload.patient_id,
          consultation_id: consultationId,
          appointment_id: payload.appointment_id,
          doctor_id: payload.doctor_id,
          prescription_number: rxNumber,
          diagnosis: payload.diagnosis || null,
          general_advice: payload.advice || null,
          follow_up_date: payload.followup_date || null,
          is_dispensed: false,
        } as never)
        .select('id')
        .single();

      if (rxError) throw rxError;
      if (rx) {
        const rxId = (rx as { id: string }).id;
        const items = payload.prescriptionItems.map((item, idx) => ({
          prescription_id: rxId,
          medication_id: item.medication_id || null,
          drug_name: item.medicine_name,
          dosage: item.dose,
          frequency: item.frequency,
          duration_days: parseInt(item.duration) || null,
          special_instructions: item.instructions || null,
          sort_order: idx,
        }));
        const { error: rxItemsError } = await supabase.from('prescription_items').insert(items as never);
        if (rxItemsError) throw rxItemsError;
      }
    }

    await supabase
      .from('appointments')
      .update({ status: 'completed' } as never)
      .eq('id', payload.appointment_id);

    return consultationId;
  },

  async markEmergency(
    appointmentId: string,
    patientId: string,
    hospitalId: string,
    doctorId: string
  ): Promise<void> {
    await supabase
      .from('appointments')
      .update({ emergency: true } as never)
      .eq('id', appointmentId);

    const { data: patient } = await supabase
      .from('patients')
      .select('full_name, age, gender, phone')
      .eq('id', patientId)
      .maybeSingle();

    const p = patient as { full_name: string; age: number | null; gender: string | null; phone: string | null } | null;

    await supabase.from('emergency_cases').insert({
      hospital_id: hospitalId,
      patient_id: patientId,
      patient_name: p?.full_name ?? '',
      patient_age: p?.age ?? null,
      patient_gender: p?.gender ?? null,
      patient_phone: p?.phone ?? null,
      arrival_mode: 'walk_in',
      arrival_time: new Date().toISOString(),
      chief_complaint: 'Marked as emergency from OPD consultation',
      triage_category: 'urgent',
      attending_doctor_id: doctorId,
      status: 'active',
      created_by: doctorId,
    } as never);
  },

  async updateAppointmentStatus(id: string, status: string): Promise<void> {
    const { error } = await supabase
      .from('appointments')
      .update({ status } as never)
      .eq('id', id);
    if (error) throw error;
  },
};

export default doctorQueueService;
