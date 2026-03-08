import { mockStore } from '../lib/mockStore';

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

const HOSPITAL_ID = '11111111-1111-1111-1111-111111111111';

function enrichAppointment(appt: ReturnType<typeof mockStore.getAppointments>[0]): WeekAppointment {
  const patient = mockStore.getPatientById(appt.patient_id);
  return {
    id: appt.id,
    patient_id: appt.patient_id,
    doctor_id: appt.doctor_id,
    patient_name: patient?.full_name ?? 'Unknown',
    patient_uhid: patient?.uhid ?? '',
    doctor_name: mockStore.getDoctorName(appt.doctor_id),
    appointment_date: appt.appointment_date,
    appointment_time: appt.appointment_time,
    slot_duration_minutes: 15,
    type: appt.type,
    status: appt.status,
    chief_complaint: appt.chief_complaint,
    token_number: null,
    visit_type: appt.type === 'follow_up' ? 'Follow-up' : 'First Visit',
    referral_type: null,
  };
}

const appointmentsService = {
  async getWeekAppointments(
    hospitalId: string,
    weekStart: string,
    weekEnd: string,
    doctorIds?: string[]
  ): Promise<WeekAppointment[]> {
    const store = mockStore.get();
    let appts = store.appointments.filter(a =>
      a.hospital_id === hospitalId &&
      a.appointment_date >= weekStart &&
      a.appointment_date <= weekEnd
    );
    if (doctorIds && doctorIds.length > 0) {
      appts = appts.filter(a => doctorIds.includes(a.doctor_id));
    }
    return appts.sort((a, b) => a.appointment_time.localeCompare(b.appointment_time)).map(enrichAppointment);
  },

  async getDoctors(hospitalId: string): Promise<DoctorOption[]> {
    return mockStore.getDoctors(hospitalId).map(d => ({
      id: d.id,
      full_name: d.full_name,
      designation: d.designation,
      department: d.department,
    }));
  },

  async getDoctorSchedules(_doctorIds?: string[]): Promise<DoctorScheduleSlot[]> {
    return [];
  },

  async createAppointment(apptData: CreateAppointmentData): Promise<WeekAppointment> {
    const appt = mockStore.addAppointment({
      id: mockStore.uuid(),
      hospital_id: apptData.hospital_id,
      patient_id: apptData.patient_id,
      doctor_id: apptData.doctor_id,
      appointment_date: apptData.appointment_date,
      appointment_time: apptData.appointment_time,
      type: apptData.type,
      status: apptData.status || 'scheduled',
      chief_complaint: apptData.chief_complaint || null,
      created_at: new Date().toISOString(),
    });
    return enrichAppointment(appt);
  },

  async updateStatus(appointmentId: string, status: string): Promise<void> {
    mockStore.updateAppointmentStatus(appointmentId, status);
  },

  async searchPatients(hospitalId: string, search: string) {
    return mockStore.getPatients(hospitalId, search).map(p => ({
      id: p.id,
      full_name: p.full_name,
      uhid: p.uhid,
      phone: p.phone,
      gender: p.gender,
      date_of_birth: p.date_of_birth,
    }));
  },

  async getVisitTypeRules(_hospitalId: string): Promise<VisitTypeRule[]> {
    return [
      { id: '1', hospital_id: HOSPITAL_ID, visit_type_name: 'Follow-up', days_threshold: 7, is_default: false, is_active: true },
      { id: '2', hospital_id: HOSPITAL_ID, visit_type_name: 'First Visit', days_threshold: 999, is_default: true, is_active: true },
    ];
  },

  async detectVisitType(
    _hospitalId: string,
    patientId: string,
    doctorId: string
  ): Promise<{ visitType: string; daysSinceLastVisit: number | null }> {
    const store = mockStore.get();
    const lastAppt = store.appointments
      .filter(a => a.patient_id === patientId && a.doctor_id === doctorId && a.status !== 'cancelled')
      .sort((a, b) => b.appointment_date.localeCompare(a.appointment_date))[0];

    if (!lastAppt) return { visitType: 'First Visit', daysSinceLastVisit: null };

    const days = Math.floor((Date.now() - new Date(lastAppt.appointment_date).getTime()) / 86400000);
    return { visitType: days <= 7 ? 'Follow-up' : 'First Visit', daysSinceLastVisit: days };
  },

  async getDoctorFees(_doctorId: string): Promise<DoctorFeeInfo> {
    return { consultation: 500, follow_up: 300 };
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
    const gstPct = billData.gst_percent ?? 0;
    const gstAmt = (billData.amount * gstPct) / 100;
    const discount = billData.discount ?? 0;
    const total = billData.amount + gstAmt - discount;
    const billNumber = mockStore.generateBillNumber();

    const bill: OPDBill = {
      id: mockStore.uuid(),
      hospital_id: billData.hospital_id,
      appointment_id: billData.appointment_id,
      patient_id: billData.patient_id,
      doctor_id: billData.doctor_id,
      bill_number: billNumber,
      amount: billData.amount,
      gst_percent: gstPct,
      gst_amount: gstAmt,
      discount,
      total_amount: total,
      payment_mode: billData.payment_mode,
      status: 'paid',
      visit_type: billData.visit_type,
      created_at: new Date().toISOString(),
    };

    mockStore.addBill({
      id: bill.id,
      bill_number: bill.bill_number,
      patient_id: bill.patient_id,
      consultation_id: null,
      bill_type: 'OPD',
      subtotal: bill.amount,
      discount_amount: discount,
      tax_amount: gstAmt,
      total_amount: total,
      amount_paid: total,
      payment_status: 'paid',
      payment_mode: bill.payment_mode,
      notes: null,
      bill_date: new Date().toISOString().split('T')[0],
      created_at: bill.created_at,
    });

    return bill;
  },

  async saveVisitTypeRule(_rule: Omit<VisitTypeRule, 'id'>): Promise<VisitTypeRule> {
    return { id: mockStore.uuid(), ..._rule } as VisitTypeRule;
  },

  async updateVisitTypeRule(_id: string, _updates: Partial<VisitTypeRule>): Promise<void> {},
  async deleteVisitTypeRule(_id: string): Promise<void> {},

  async getCustomFieldsConfig(_hospitalId: string, _formName = 'appointment') {
    return [] as Array<{
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
