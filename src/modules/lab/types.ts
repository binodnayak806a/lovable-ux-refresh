export interface LabTest {
  id: string;
  hospital_id: string;
  test_code: string;
  test_name: string;
  test_category: TestCategory;
  test_price: number;
  sample_type: SampleType;
  normal_range: string | null;
  turnaround_time_hours: number;
  instructions: string | null;
  is_active: boolean;
  created_at: string;
}

export interface LabOrder {
  id: string;
  hospital_id: string;
  order_number: string;
  patient_id: string;
  doctor_id: string | null;
  order_date: string;
  priority: OrderPriority;
  clinical_notes: string | null;
  status: OrderStatus;
  sample_collected_at: string | null;
  sample_collected_by: string | null;
  reported_at: string | null;
  reported_by: string | null;
  total_amount: number;
  created_by: string | null;
  created_at: string;
  patient?: { full_name: string; uhid: string; phone: string; gender: string };
  doctor?: { full_name: string };
  items?: LabOrderItem[];
}

export interface LabOrderItem {
  id: string;
  order_id: string;
  test_id: string;
  test_name: string;
  test_price: number;
  result_value: string | null;
  result_unit: string | null;
  normal_range: string | null;
  is_abnormal: boolean;
  remarks: string | null;
  status: ItemStatus;
  completed_at: string | null;
  completed_by: string | null;
  created_at: string;
  test?: LabTest;
}

export type TestCategory =
  | 'Hematology'
  | 'Biochemistry'
  | 'Clinical Pathology'
  | 'Serology'
  | 'Microbiology'
  | 'Molecular'
  | 'Radiology'
  | 'Cardiology'
  | 'General';

export type SampleType = 'Blood' | 'Urine' | 'Stool' | 'Sputum' | 'Swab' | 'Nasal Swab' | 'CSF' | 'N/A' | 'Other';

export type OrderPriority = 'routine' | 'urgent' | 'stat';
export type OrderStatus = 'pending' | 'sample_collected' | 'processing' | 'completed' | 'cancelled';
export type ItemStatus = 'pending' | 'processing' | 'completed';

export interface LabOrderFormData {
  patient_id: string;
  doctor_id: string;
  priority: OrderPriority;
  clinical_notes: string;
  test_ids: string[];
}

export interface ResultEntryData {
  result_value: string;
  result_unit: string;
  is_abnormal: boolean;
  remarks: string;
}

export interface LabStats {
  totalOrders: number;
  pendingOrders: number;
  completedToday: number;
  avgTurnaround: number;
}

export const TEST_CATEGORY_CONFIG: Record<TestCategory, { label: string; color: string; icon: string }> = {
  Hematology: { label: 'Hematology', color: 'bg-red-100 text-red-700', icon: 'Droplet' },
  Biochemistry: { label: 'Biochemistry', color: 'bg-blue-100 text-blue-700', icon: 'FlaskConical' },
  'Clinical Pathology': { label: 'Clinical Pathology', color: 'bg-amber-100 text-amber-700', icon: 'Microscope' },
  Serology: { label: 'Serology', color: 'bg-cyan-100 text-cyan-700', icon: 'TestTube' },
  Microbiology: { label: 'Microbiology', color: 'bg-emerald-100 text-emerald-700', icon: 'Bug' },
  Molecular: { label: 'Molecular', color: 'bg-violet-100 text-violet-700', icon: 'Dna' },
  Radiology: { label: 'Radiology', color: 'bg-gray-100 text-gray-700', icon: 'Scan' },
  Cardiology: { label: 'Cardiology', color: 'bg-pink-100 text-pink-700', icon: 'HeartPulse' },
  General: { label: 'General', color: 'bg-slate-100 text-slate-700', icon: 'Clipboard' },
};

export const PRIORITY_CONFIG: Record<OrderPriority, { label: string; color: string }> = {
  routine: { label: 'Routine', color: 'bg-gray-100 text-gray-700' },
  urgent: { label: 'Urgent', color: 'bg-amber-100 text-amber-700' },
  stat: { label: 'STAT', color: 'bg-red-100 text-red-700' },
};

export const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'bg-gray-100 text-gray-700' },
  sample_collected: { label: 'Sample Collected', color: 'bg-blue-100 text-blue-700' },
  processing: { label: 'Processing', color: 'bg-amber-100 text-amber-700' },
  completed: { label: 'Completed', color: 'bg-emerald-100 text-emerald-700' },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700' },
};

export const SAMPLE_TYPE_CONFIG: Record<SampleType, { label: string; color: string }> = {
  Blood: { label: 'Blood', color: 'bg-red-50 text-red-600' },
  Urine: { label: 'Urine', color: 'bg-amber-50 text-amber-600' },
  Stool: { label: 'Stool', color: 'bg-yellow-50 text-yellow-700' },
  Sputum: { label: 'Sputum', color: 'bg-green-50 text-green-600' },
  Swab: { label: 'Swab', color: 'bg-blue-50 text-blue-600' },
  'Nasal Swab': { label: 'Nasal Swab', color: 'bg-cyan-50 text-cyan-600' },
  CSF: { label: 'CSF', color: 'bg-violet-50 text-violet-600' },
  'N/A': { label: 'N/A', color: 'bg-gray-50 text-gray-600' },
  Other: { label: 'Other', color: 'bg-slate-50 text-slate-600' },
};

export const EMPTY_ORDER_FORM: LabOrderFormData = {
  patient_id: '',
  doctor_id: '',
  priority: 'routine',
  clinical_notes: '',
  test_ids: [],
};
