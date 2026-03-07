export interface DateRange {
  from: Date;
  to: Date;
}

export interface DailyOPDRow {
  token_number: number;
  patient_name: string;
  uhid: string;
  doctor_name: string;
  department_name: string;
  visit_type: string;
  amount: number;
  payment_mode: string;
  status: string;
  appointment_time: string;
}

export interface RevenueRow {
  group_key: string;
  opd_revenue: number;
  ipd_revenue: number;
  lab_revenue: number;
  pharmacy_revenue: number;
  total_revenue: number;
  gst_collected: number;
  total_paid: number;
  total_pending: number;
}

export interface BedOccupancyRow {
  ward_name: string;
  ward_type: string;
  total_beds: number;
  occupied_beds: number;
  vacant_beds: number;
  occupancy_pct: number;
}

export interface CollectionRow {
  payment_mode: string;
  transaction_count: number;
  total_amount: number;
  percentage: number;
}

export interface DoctorOPDRow {
  doctor_id: string;
  doctor_name: string;
  department_name: string;
  patient_count: number;
  first_visit_count: number;
  followup_count: number;
  total_revenue: number;
  avg_revenue_per_patient: number;
}

export interface IPDCensusRow {
  total_admissions: number;
  total_discharges: number;
  current_inpatients: number;
  bed_occupancy_pct: number;
  ward_breakdown: Array<{
    ward: string;
    admitted: number;
    discharged: number;
    current: number;
    total_beds: number;
    occupancy_pct: number;
  }>;
  daily: Array<{
    date: string;
    admissions: number;
    discharges: number;
  }>;
}

export interface SavedReport {
  id: string;
  hospital_id: string;
  created_by: string;
  name: string;
  data_source: string;
  columns: string[];
  filters: Record<string, string>;
  created_at: string;
  updated_at: string;
}

export const DATA_SOURCES: Record<string, { label: string; table: string; columns: Array<{ key: string; label: string }> }> = {
  patients: {
    label: 'Patients',
    table: 'patients',
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'uhid', label: 'UHID' },
      { key: 'full_name', label: 'Name' },
      { key: 'gender', label: 'Gender' },
      { key: 'age', label: 'Age' },
      { key: 'phone', label: 'Phone' },
      { key: 'email', label: 'Email' },
      { key: 'blood_group', label: 'Blood Group' },
      { key: 'created_at', label: 'Registered' },
    ],
  },
  appointments: {
    label: 'Appointments (OPD)',
    table: 'appointments',
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'token_number', label: 'Token' },
      { key: 'patient_id', label: 'Patient ID' },
      { key: 'doctor_id', label: 'Doctor ID' },
      { key: 'department_id', label: 'Department ID' },
      { key: 'appointment_date', label: 'Date' },
      { key: 'appointment_time', label: 'Time' },
      { key: 'visit_type', label: 'Visit Type' },
      { key: 'status', label: 'Status' },
      { key: 'created_at', label: 'Created' },
    ],
  },
  admissions: {
    label: 'Admissions (IPD)',
    table: 'admissions',
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'patient_id', label: 'Patient ID' },
      { key: 'doctor_id', label: 'Doctor ID' },
      { key: 'ward_id', label: 'Ward ID' },
      { key: 'bed_id', label: 'Bed ID' },
      { key: 'admission_date', label: 'Admission Date' },
      { key: 'discharge_date', label: 'Discharge Date' },
      { key: 'status', label: 'Status' },
      { key: 'created_at', label: 'Created' },
    ],
  },
  bills: {
    label: 'Billing',
    table: 'bills',
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'bill_number', label: 'Bill Number' },
      { key: 'patient_id', label: 'Patient ID' },
      { key: 'bill_type', label: 'Type' },
      { key: 'bill_date', label: 'Date' },
      { key: 'total_amount', label: 'Total' },
      { key: 'paid_amount', label: 'Paid' },
      { key: 'balance_due', label: 'Balance' },
      { key: 'tax_amount', label: 'Tax' },
      { key: 'payment_mode', label: 'Payment Mode' },
      { key: 'status', label: 'Status' },
    ],
  },
  prescriptions: {
    label: 'Prescriptions',
    table: 'prescriptions',
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'patient_id', label: 'Patient ID' },
      { key: 'doctor_id', label: 'Doctor ID' },
      { key: 'status', label: 'Status' },
      { key: 'notes', label: 'Notes' },
      { key: 'created_at', label: 'Created' },
    ],
  },
};
