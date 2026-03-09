export interface InsuranceProvider {
  id: string;
  hospital_id: string;
  name: string;
  provider_type: 'insurance' | 'tpa' | 'corporate';
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  pan_number: string | null;
  gst_number: string | null;
  settlement_period_days: number;
  discount_percentage: number;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type ClaimStatus = 'draft' | 'submitted' | 'under_review' | 'query_raised' | 'approved' | 'partially_approved' | 'rejected' | 'settled' | 'closed';
export type ClaimType = 'cashless' | 'reimbursement';

export interface InsuranceClaim {
  id: string;
  hospital_id: string;
  claim_number: string;
  patient_id: string;
  patient_name: string | null;
  provider_id: string | null;
  provider_name: string | null;
  policy_number: string | null;
  member_id: string | null;
  admission_id: string | null;
  bill_id: string | null;
  claim_type: ClaimType;
  status: ClaimStatus;
  claimed_amount: number;
  approved_amount: number;
  settled_amount: number;
  deduction_amount: number;
  deduction_reason: string | null;
  diagnosis: string | null;
  treatment_summary: string | null;
  admission_date: string | null;
  discharge_date: string | null;
  submitted_at: string | null;
  approved_at: string | null;
  settled_at: string | null;
  rejection_reason: string | null;
  query_details: string | null;
  query_response: string | null;
  documents: unknown[];
  remarks: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type PreAuthStatus = 'pending' | 'approved' | 'partially_approved' | 'rejected' | 'expired' | 'cancelled';

export interface PreAuthorization {
  id: string;
  hospital_id: string;
  auth_number: string;
  patient_id: string;
  patient_name: string | null;
  provider_id: string | null;
  provider_name: string | null;
  policy_number: string | null;
  member_id: string | null;
  status: PreAuthStatus;
  requested_amount: number;
  approved_amount: number;
  planned_procedure: string | null;
  diagnosis: string | null;
  expected_los_days: number | null;
  admission_date: string | null;
  valid_until: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  documents: unknown[];
  remarks: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}
