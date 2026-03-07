import { supabase } from '../lib/supabase';

export interface WeekAppointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  patient_name: string;
  patient_uhid: string;
  doctor_name: string;
  appointment_date: string;
  appointment_time: string;
  slot_duration_minutes: number;
  type: string;
  status: string;
  chief_complaint: string | null;
  token_number: number | null;
  visit_type: string | null;
  referral_type: string | null;
}

export interface DoctorOption {
  id: string;
  full_name: string;
  designation: string | null;
  department: string | null;
}

export interface DoctorScheduleSlot {
  id: string;
  doctor_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
  max_patients: number;
  is_active: boolean;
}

export interface CreateAppointmentData {
  hospital_id: string;
  patient_id: string;
  doctor_id: string;
  appointment_date: string;
  appointment_time: string;
  slot_duration_minutes?: number;
  type: string;
  status: string;
  chief_complaint?: string;
  visit_type?: string;
  referral_type?: string;
  referral_doctor?: string;
  custom_field_values?: Record<string, unknown>;
  created_by?: string;
}

export interface VisitTypeRule {
  id: string;
  hospital_id: string;
  visit_type_name: string;
  days_threshold: number;
  is_default: boolean;
  is_active: boolean;
}

export interface OPDBill {
  id: string;
  hospital_id: string;
  appointment_id: string | null;
  patient_id: string;
  doctor_id: string | null;
  bill_number: string;
  amount: number;
  gst_percent: number;
  gst_amount: number;
  discount: number;
  total_amount: number;
  payment_mode: string;
  status: string;
  visit_type: string | null;
  created_at: string;
}

export interface DoctorFeeInfo {
  consultation: number;
  follow_up: number;
}

function mapRow(row: Record<string, unknown>): WeekAppointment {
  return {
    id: row.id as string,
    patient_id: row.patient_id as string,
    doctor_id: row.doctor_id as string,
    patient_name: ((row.patients as Record<string, unknown>)?.full_name as string) ?? '',
    patient_uhid: ((row.patients as Record<string, unknown>)?.uhid as string) ?? '',
    doctor_name: ((row.profiles as Record<string, unknown>)?.full_name as string) ?? '',
    appointment_date: row.appointment_date as string,
    appointment_time: row.appointment_time as string,
    slot_duration_minutes: (row.slot_duration_minutes as number) ?? 15,
    type: row.type as string,
    status: row.status as string,
    chief_complaint: row.chief_complaint as string | null,
    token_number: row.token_number as number | null,
    visit_type: row.visit_type as string | null,
    referral_type: row.referral_type as string | null,
  };
}

const SELECT_FIELDS = `
  id, patient_id, doctor_id, appointment_date, appointment_time,
  slot_duration_minutes, type, status, chief_complaint, token_number,
  visit_type, referral_type,
  patients!inner(full_name, uhid),
  profiles!inner(full_name)
`;

const appointmentsService = {
  async getWeekAppointments(
    hospitalId: string,
    weekStart: string,
    weekEnd: string,
    doctorIds?: string[]
  ): Promise<WeekAppointment[]> {
    let query = supabase
      .from('appointments')
      .select(SELECT_FIELDS)
      .eq('hospital_id', hospitalId)
      .gte('appointment_date', weekStart)
      .lte('appointment_date', weekEnd)
      .order('appointment_time', { ascending: true });

    if (doctorIds && doctorIds.length > 0) {
      query = query.in('doctor_id', doctorIds) as typeof query;
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map((r: Record<string, unknown>) => mapRow(r));
  },

  async getDoctors(hospitalId: string): Promise<DoctorOption[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, designation, department')
      .eq('hospital_id', hospitalId)
      .eq('role', 'doctor')
      .order('full_name');

    if (error) throw error;
    return (data ?? []) as DoctorOption[];
  },

  async getDoctorSchedules(doctorIds?: string[]): Promise<DoctorScheduleSlot[]> {
    let query = supabase
      .from('doctor_schedules')
      .select('*')
      .eq('is_active', true);

    if (doctorIds && doctorIds.length > 0) {
      query = query.in('doctor_id', doctorIds) as typeof query;
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as DoctorScheduleSlot[];
  },

  async createAppointment(apptData: CreateAppointmentData): Promise<WeekAppointment> {
    const { data: tokenData } = await supabase.rpc('generate_doctor_token' as never, {
      p_hospital_id: apptData.hospital_id,
      p_doctor_id: apptData.doctor_id,
      p_date: apptData.appointment_date,
    } as never);
    const token = (tokenData as unknown as number) ?? 1;

    const { data, error } = await supabase
      .from('appointments')
      .insert({
        ...apptData,
        token_number: token,
        slot_duration_minutes: apptData.slot_duration_minutes ?? 15,
      } as never)
      .select(SELECT_FIELDS)
      .single();

    if (error) throw error;

    const appointment = mapRow(data as Record<string, unknown>);

    const fees = await this.getDoctorFees(apptData.doctor_id);
    const visitType = apptData.visit_type || 'First Visit';
    const amount = visitType.toLowerCase().includes('follow') ? fees.follow_up : fees.consultation;

    if (amount > 0) {
      try {
        await this.createOPDBill({
          hospital_id: apptData.hospital_id,
          appointment_id: appointment.id,
          patient_id: apptData.patient_id,
          doctor_id: apptData.doctor_id,
          amount,
          gst_percent: 0,
          discount: 0,
          payment_mode: 'pending',
          visit_type: visitType,
          created_by: apptData.created_by,
        });
      } catch {
        // Silent fail - bill can be created manually later
      }
    }

    return appointment;
  },

  async updateStatus(appointmentId: string, status: string): Promise<void> {
    const { error } = await supabase
      .from('appointments')
      .update({ status } as never)
      .eq('id', appointmentId);
    if (error) throw error;
  },

  async searchPatients(hospitalId: string, search: string) {
    const { data, error } = await supabase
      .from('patients')
      .select('id, full_name, uhid, phone, gender, date_of_birth')
      .eq('hospital_id', hospitalId)
      .or(`full_name.ilike.%${search}%,uhid.ilike.%${search}%,phone.ilike.%${search}%`)
      .limit(10);
    if (error) throw error;
    return data ?? [];
  },

  async getVisitTypeRules(hospitalId: string): Promise<VisitTypeRule[]> {
    const { data, error } = await supabase
      .from('visit_type_rules')
      .select('*')
      .eq('hospital_id', hospitalId)
      .eq('is_active', true)
      .order('days_threshold', { ascending: true });
    if (error) throw error;
    return (data ?? []) as VisitTypeRule[];
  },

  async detectVisitType(
    hospitalId: string,
    patientId: string,
    doctorId: string
  ): Promise<{ visitType: string; daysSinceLastVisit: number | null }> {
    const rules = await this.getVisitTypeRules(hospitalId);
    if (rules.length === 0) {
      return { visitType: 'First Visit', daysSinceLastVisit: null };
    }

    const { data: lastAppt } = await supabase
      .from('appointments')
      .select('appointment_date')
      .eq('patient_id', patientId)
      .eq('doctor_id', doctorId)
      .neq('status', 'cancelled')
      .order('appointment_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!lastAppt) {
      const defaultRule = rules.find(r => r.is_default) ?? rules[rules.length - 1];
      return { visitType: defaultRule.visit_type_name, daysSinceLastVisit: null };
    }

    const lastDate = new Date((lastAppt as { appointment_date: string }).appointment_date);
    const today = new Date();
    const daysDiff = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

    for (const rule of rules) {
      if (!rule.is_default && daysDiff <= rule.days_threshold) {
        return { visitType: rule.visit_type_name, daysSinceLastVisit: daysDiff };
      }
    }

    const defaultRule = rules.find(r => r.is_default) ?? rules[rules.length - 1];
    return { visitType: defaultRule.visit_type_name, daysSinceLastVisit: daysDiff };
  },

  async getDoctorFees(doctorId: string): Promise<DoctorFeeInfo> {
    const { data } = await supabase
      .from('doctor_fees')
      .select('fee_type, amount')
      .eq('doctor_id', doctorId)
      .eq('is_active', true)
      .in('fee_type', ['consultation', 'follow_up']);

    const fees: DoctorFeeInfo = { consultation: 0, follow_up: 0 };
    for (const row of (data ?? []) as { fee_type: string; amount: number }[]) {
      if (row.fee_type === 'consultation') fees.consultation = Number(row.amount);
      if (row.fee_type === 'follow_up') fees.follow_up = Number(row.amount);
    }
    return fees;
  },

  async createOPDBill(billData: {
    hospital_id: string;
    appointment_id: string;
    patient_id: string;
    doctor_id: string;
    amount: number;
    gst_percent?: number;
    discount?: number;
    payment_mode: string;
    visit_type: string;
    created_by?: string;
  }): Promise<OPDBill> {
    const { data: billNumber } = await supabase.rpc('generate_opd_bill_number' as never, {
      p_hospital_id: billData.hospital_id,
    } as never);

    const gstPct = billData.gst_percent ?? 0;
    const gstAmt = (billData.amount * gstPct) / 100;
    const discount = billData.discount ?? 0;
    const total = billData.amount + gstAmt - discount;

    const { data, error } = await supabase
      .from('opd_bills')
      .insert({
        hospital_id: billData.hospital_id,
        appointment_id: billData.appointment_id,
        patient_id: billData.patient_id,
        doctor_id: billData.doctor_id,
        bill_number: (billNumber as unknown as string) ?? `OPD-${Date.now()}`,
        amount: billData.amount,
        gst_percent: gstPct,
        gst_amount: gstAmt,
        discount,
        total_amount: total,
        payment_mode: billData.payment_mode,
        status: 'paid',
        visit_type: billData.visit_type,
        created_by: billData.created_by,
      } as never)
      .select()
      .single();

    if (error) throw error;
    return data as OPDBill;
  },

  async saveVisitTypeRule(rule: Omit<VisitTypeRule, 'id'>): Promise<VisitTypeRule> {
    const { data, error } = await supabase
      .from('visit_type_rules')
      .insert(rule as never)
      .select()
      .single();
    if (error) throw error;
    return data as VisitTypeRule;
  },

  async updateVisitTypeRule(id: string, updates: Partial<VisitTypeRule>): Promise<void> {
    const { error } = await supabase
      .from('visit_type_rules')
      .update(updates as never)
      .eq('id', id);
    if (error) throw error;
  },

  async deleteVisitTypeRule(id: string): Promise<void> {
    const { error } = await supabase
      .from('visit_type_rules')
      .update({ is_active: false } as never)
      .eq('id', id);
    if (error) throw error;
  },

  async getCustomFieldsConfig(hospitalId: string, formName = 'appointment') {
    const { data, error } = await supabase
      .from('custom_fields_config')
      .select('*')
      .eq('hospital_id', hospitalId)
      .eq('form_name', formName)
      .eq('is_active', true)
      .order('sort_order');
    if (error) throw error;
    return (data ?? []) as Array<{
      id: string;
      field_label: string;
      field_type: 'text' | 'date' | 'dropdown' | 'toggle';
      is_mandatory: boolean;
      options: string[];
      sort_order: number;
    }>;
  },
};

export default appointmentsService;
