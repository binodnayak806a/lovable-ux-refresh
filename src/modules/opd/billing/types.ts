export interface BillItem {
  id: string;
  itemType: 'consultation' | 'procedure' | 'medication' | 'lab' | 'room' | 'other';
  itemName: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface SplitPaymentEntry {
  id: string;
  mode: PaymentMode;
  amount: number;
  reference: string;
}

export interface BillFormData {
  discountPercentage: number;
  taxPercentage: number;
  paymentMode: PaymentMode;
  paymentReference: string;
  notes: string;
  isSplitPayment: boolean;
  splitEntries: SplitPaymentEntry[];
}

export interface BillRecord {
  id: string;
  hospital_id: string | null;
  bill_number: string;
  patient_id: string;
  consultation_id: string | null;
  prescription_id: string | null;
  bill_type: string;
  bill_date: string;
  subtotal: number;
  discount_percentage: number;
  discount_amount: number;
  tax_percentage: number;
  tax_amount: number;
  total_amount: number;
  amount_paid: number;
  payment_status: PaymentStatus;
  payment_mode: PaymentMode | null;
  payment_reference: string | null;
  notes: string | null;
}

export type PaymentMode = 'cash' | 'card' | 'upi' | 'online' | 'insurance' | 'rtgs';
export type PaymentStatus = 'pending' | 'paid' | 'partial' | 'cancelled';
export type ItemType = 'consultation' | 'procedure' | 'medication' | 'lab' | 'room' | 'other';

export const EMPTY_BILL_FORM: BillFormData = {
  discountPercentage: 0,
  taxPercentage: 18,
  paymentMode: 'cash',
  paymentReference: '',
  notes: '',
  isSplitPayment: false,
  splitEntries: [],
};

export const createEmptyBillItem = (type: ItemType = 'other'): BillItem => ({
  id: crypto.randomUUID(),
  itemType: type,
  itemName: '',
  description: '',
  quantity: 1,
  unitPrice: 0,
  totalPrice: 0,
});

export const createEmptySplitEntry = (mode: PaymentMode = 'cash'): SplitPaymentEntry => ({
  id: crypto.randomUUID(),
  mode,
  amount: 0,
  reference: '',
});

export const PAYMENT_MODES: Array<{ value: PaymentMode; label: string; icon: string }> = [
  { value: 'cash', label: 'Cash', icon: 'Banknote' },
  { value: 'card', label: 'Card', icon: 'CreditCard' },
  { value: 'upi', label: 'UPI', icon: 'Smartphone' },
  { value: 'online', label: 'Online Transfer', icon: 'Globe' },
  { value: 'rtgs', label: 'RTGS/NEFT', icon: 'Building2' },
  { value: 'insurance', label: 'Insurance', icon: 'Shield' },
];

export const ITEM_TYPES: Array<{ value: ItemType; label: string }> = [
  { value: 'consultation', label: 'Consultation' },
  { value: 'procedure', label: 'Procedure' },
  { value: 'medication', label: 'Medication' },
  { value: 'lab', label: 'Lab Test' },
  { value: 'room', label: 'Room Charges' },
  { value: 'other', label: 'Other' },
];

export const COMMON_SERVICES: Array<{ name: string; type: ItemType; price: number }> = [
  { name: 'Doctor Consultation', type: 'consultation', price: 500 },
  { name: 'Follow-up Consultation', type: 'consultation', price: 300 },
  { name: 'Specialist Consultation', type: 'consultation', price: 800 },
  { name: 'ECG', type: 'procedure', price: 350 },
  { name: 'X-Ray', type: 'procedure', price: 450 },
  { name: 'Blood Test (CBC)', type: 'lab', price: 250 },
  { name: 'Blood Test (LFT)', type: 'lab', price: 600 },
  { name: 'Blood Test (KFT)', type: 'lab', price: 550 },
  { name: 'Urine Test', type: 'lab', price: 150 },
  { name: 'Dressing', type: 'procedure', price: 200 },
  { name: 'Injection Charges', type: 'procedure', price: 100 },
  { name: 'Registration Fee', type: 'other', price: 50 },
];
