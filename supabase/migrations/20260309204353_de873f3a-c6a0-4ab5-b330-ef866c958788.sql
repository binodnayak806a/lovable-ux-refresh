
-- Insurance Providers / TPA companies
CREATE TABLE public.insurance_providers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hospital_id UUID NOT NULL,
  name TEXT NOT NULL,
  provider_type TEXT NOT NULL DEFAULT 'insurance' CHECK (provider_type IN ('insurance', 'tpa', 'corporate')),
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  pan_number TEXT,
  gst_number TEXT,
  settlement_period_days INTEGER DEFAULT 30,
  discount_percentage NUMERIC(5,2) DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insurance Claims
CREATE TABLE public.insurance_claims (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hospital_id UUID NOT NULL,
  claim_number TEXT NOT NULL,
  patient_id UUID NOT NULL,
  patient_name TEXT,
  provider_id UUID REFERENCES public.insurance_providers(id),
  provider_name TEXT,
  policy_number TEXT,
  member_id TEXT,
  admission_id UUID,
  bill_id UUID,
  claim_type TEXT NOT NULL DEFAULT 'cashless' CHECK (claim_type IN ('cashless', 'reimbursement')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'under_review', 'query_raised', 'approved', 'partially_approved', 'rejected', 'settled', 'closed')),
  claimed_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  approved_amount NUMERIC(12,2) DEFAULT 0,
  settled_amount NUMERIC(12,2) DEFAULT 0,
  deduction_amount NUMERIC(12,2) DEFAULT 0,
  deduction_reason TEXT,
  diagnosis TEXT,
  treatment_summary TEXT,
  admission_date DATE,
  discharge_date DATE,
  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  settled_at TIMESTAMPTZ,
  rejection_reason TEXT,
  query_details TEXT,
  query_response TEXT,
  documents JSONB DEFAULT '[]',
  remarks TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Pre-Authorization Requests
CREATE TABLE public.pre_authorizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hospital_id UUID NOT NULL,
  auth_number TEXT NOT NULL,
  patient_id UUID NOT NULL,
  patient_name TEXT,
  provider_id UUID REFERENCES public.insurance_providers(id),
  provider_name TEXT,
  policy_number TEXT,
  member_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'partially_approved', 'rejected', 'expired', 'cancelled')),
  requested_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  approved_amount NUMERIC(12,2) DEFAULT 0,
  planned_procedure TEXT,
  diagnosis TEXT,
  expected_los_days INTEGER,
  admission_date DATE,
  valid_until DATE,
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  documents JSONB DEFAULT '[]',
  remarks TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.insurance_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurance_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pre_authorizations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for insurance_providers
CREATE POLICY "Authenticated users can read providers" ON public.insurance_providers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage providers" ON public.insurance_providers FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'superadmin')) WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'superadmin'));

-- RLS Policies for insurance_claims
CREATE POLICY "Authenticated users can read claims" ON public.insurance_claims FOR SELECT TO authenticated USING (true);
CREATE POLICY "Billing and admin can manage claims" ON public.insurance_claims FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'superadmin') OR has_role(auth.uid(), 'billing')) WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'superadmin') OR has_role(auth.uid(), 'billing'));

-- RLS Policies for pre_authorizations
CREATE POLICY "Authenticated users can read pre-auths" ON public.pre_authorizations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Billing and admin can manage pre-auths" ON public.pre_authorizations FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'superadmin') OR has_role(auth.uid(), 'billing')) WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'superadmin') OR has_role(auth.uid(), 'billing'));

-- Indexes
CREATE INDEX idx_insurance_claims_hospital ON public.insurance_claims(hospital_id);
CREATE INDEX idx_insurance_claims_status ON public.insurance_claims(status);
CREATE INDEX idx_insurance_claims_provider ON public.insurance_claims(provider_id);
CREATE INDEX idx_pre_authorizations_hospital ON public.pre_authorizations(hospital_id);
CREATE INDEX idx_pre_authorizations_status ON public.pre_authorizations(status);
CREATE INDEX idx_insurance_providers_hospital ON public.insurance_providers(hospital_id);
