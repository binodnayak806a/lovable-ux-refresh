export type InvoiceStatus = 'draft' | 'pending' | 'partial' | 'paid' | 'cancelled' | 'refunded';
export type PaymentMode = 'cash' | 'card' | 'upi' | 'cheque' | 'neft' | 'insurance' | 'tpa' | 'wallet';
export type ServiceCategory =
  | 'consultation'
  | 'procedure'
  | 'room_charges'
  | 'pharmacy'
  | 'laboratory'
  | 'radiology'
  | 'nursing'
  | 'ot_charges'
  | 'anesthesia'
  | 'blood_bank'
  | 'ambulance'
  | 'dietetics'
  | 'physiotherapy'
  | 'miscellaneous';

export interface ServiceItem {
  id: string;
  hospital_id: string;
  name: string;
  code: string;
  category: ServiceCategory;
  rate: number;
  tax_percent: number;
  is_active: boolean;
}

export interface InvoiceLineItem {
  id: string;
  invoice_id: string;
  service_item_id: string | null;
  description: string;
  category: ServiceCategory;
  quantity: number;
  unit_rate: number;
  discount_percent: number;
  discount_amount: number;
  tax_percent: number;
  tax_amount: number;
  net_amount: number;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  hospital_id: string;
  patient_id: string;
  admission_id: string | null;
  appointment_id: string | null;
  invoice_date: string;
  due_date: string;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  paid_amount: number;
  balance_due: number;
  status: InvoiceStatus;
  tpa_id: string | null;
  insurance_claim_number: string | null;
  remarks: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  line_items?: InvoiceLineItem[];
  payments?: Payment[];
}

export interface Payment {
  id: string;
  hospital_id: string;
  invoice_id: string;
  patient_id: string;
  amount: number;
  payment_mode: PaymentMode;
  reference_number: string | null;
  payment_date: string;
  remarks: string | null;
  created_by: string;
  created_at: string;
}

export interface TPA {
  id: string;
  hospital_id: string;
  name: string;
  code: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  is_active: boolean;
}

export interface DashboardMetrics {
  totalAppointments: number;
  newPatients: number;
  occupiedBeds: number;
  availableBeds: number;
  todayRevenue: number;
  pendingBills: number;
  activeAdmissions: number;
  todayDischarges: number;
}
