-- ============================================================================
-- STEP 1: CLEAN SLATE — drop existing business tables
-- ============================================================================
DROP TABLE IF EXISTS public.insurance_claims CASCADE;
DROP TABLE IF EXISTS public.pre_authorizations CASCADE;
DROP TABLE IF EXISTS public.insurance_providers CASCADE;
-- keep user_roles for now; we'll recreate cleanly
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP FUNCTION IF EXISTS public.has_role(uuid, app_role) CASCADE;
DROP TYPE IF EXISTS public.app_role CASCADE;

-- ============================================================================
-- STEP 2: ENUMS
-- ============================================================================
CREATE TYPE public.app_role AS ENUM (
  'superadmin','admin','doctor','nurse','billing','pharmacist','lab_technician','receptionist'
);

CREATE TYPE public.appointment_status AS ENUM (
  'scheduled','arrived','in_consultation','completed','cancelled','no_show'
);

CREATE TYPE public.visit_status AS ENUM (
  'waiting','in_consultation','completed','cancelled'
);

CREATE TYPE public.bed_status AS ENUM (
  'available','occupied','reserved','maintenance','cleaning'
);

CREATE TYPE public.admission_status AS ENUM (
  'admitted','discharged','transferred','expired','dama'
);

CREATE TYPE public.payment_status AS ENUM (
  'unpaid','partial','paid','refunded','cancelled'
);

CREATE TYPE public.lab_order_status AS ENUM (
  'pending','collected','processing','completed','cancelled'
);

CREATE TYPE public.ot_status AS ENUM (
  'scheduled','in_progress','completed','cancelled','postponed'
);

-- ============================================================================
-- STEP 3: TIMESTAMP TRIGGER FUNCTION
-- ============================================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- ============================================================================
-- STEP 4: FOUNDATION TABLES
-- ============================================================================
CREATE TABLE public.hospitals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  registration_number TEXT UNIQUE,
  address TEXT, city TEXT, state TEXT, pincode TEXT, country TEXT DEFAULT 'India',
  phone TEXT, email TEXT, website TEXT, logo_url TEXT,
  bed_count INTEGER DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  hospital_id UUID REFERENCES public.hospitals(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  designation TEXT,
  department TEXT,
  avatar_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  hospital_id UUID REFERENCES public.hospitals(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role, hospital_id)
);

CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID REFERENCES public.hospitals(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(hospital_id, key)
);

-- ============================================================================
-- STEP 5: SECURITY DEFINER HELPERS (avoid RLS recursion)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.get_user_hospital_id(_user_id UUID)
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT hospital_id FROM public.profiles WHERE id = _user_id LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.is_superadmin(_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'superadmin')
$$;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- STEP 6: MASTER DATA
-- ============================================================================
CREATE TABLE public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  name TEXT NOT NULL, code TEXT NOT NULL,
  description TEXT, head_doctor_id UUID,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(hospital_id, code)
);

CREATE TABLE public.doctors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  registration_number TEXT,
  specialization TEXT, qualification TEXT, designation TEXT,
  experience_years INTEGER DEFAULT 0,
  consultation_fee NUMERIC(10,2) DEFAULT 0,
  follow_up_fee NUMERIC(10,2) DEFAULT 0,
  phone TEXT, email TEXT, signature_url TEXT,
  is_available BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.departments
  ADD CONSTRAINT departments_head_doctor_fk
  FOREIGN KEY (head_doctor_id) REFERENCES public.doctors(id) ON DELETE SET NULL;

CREATE TABLE public.wards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  name TEXT NOT NULL, code TEXT,
  category TEXT NOT NULL,
  floor TEXT, gender TEXT,
  total_beds INTEGER DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.beds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  ward_id UUID NOT NULL REFERENCES public.wards(id) ON DELETE CASCADE,
  bed_number TEXT NOT NULL,
  status bed_status NOT NULL DEFAULT 'available',
  daily_charge NUMERIC(10,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(ward_id, bed_number)
);

CREATE TABLE public.service_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  name TEXT NOT NULL, description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.service_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  group_id UUID REFERENCES public.service_groups(id) ON DELETE SET NULL,
  name TEXT NOT NULL, code TEXT,
  service_type TEXT NOT NULL DEFAULT 'BOTH',
  opd_price NUMERIC(10,2) DEFAULT 0,
  ipd_price NUMERIC(10,2) DEFAULT 0,
  tax_percentage NUMERIC(5,2) DEFAULT 0,
  hsn_code TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.medications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  name TEXT NOT NULL, generic_name TEXT, brand TEXT,
  manufacturer TEXT, category TEXT,
  unit TEXT NOT NULL DEFAULT 'tablet',
  strength TEXT, form TEXT,
  hsn_code TEXT, gst_percentage NUMERIC(5,2) DEFAULT 0,
  mrp NUMERIC(10,2) DEFAULT 0, sale_price NUMERIC(10,2) DEFAULT 0,
  reorder_level INTEGER DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.lab_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  name TEXT NOT NULL, code TEXT,
  category TEXT, sample_type TEXT,
  normal_range TEXT, units TEXT,
  price NUMERIC(10,2) DEFAULT 0,
  turnaround_hours INTEGER DEFAULT 24,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.symptoms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  name TEXT NOT NULL, category TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.diagnoses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  name TEXT NOT NULL, icd_code TEXT, category TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.investigations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  name TEXT NOT NULL, category TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.insurance_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  name TEXT NOT NULL, provider_type TEXT NOT NULL DEFAULT 'insurance',
  contact_person TEXT, phone TEXT, email TEXT, address TEXT,
  pan_number TEXT, gst_number TEXT,
  settlement_period_days INTEGER DEFAULT 30,
  discount_percentage NUMERIC(5,2) DEFAULT 0,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- STEP 7: PATIENTS & VISITS
-- ============================================================================
CREATE TABLE public.patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  uhid TEXT NOT NULL,
  first_name TEXT NOT NULL, middle_name TEXT, last_name TEXT,
  full_name TEXT NOT NULL,
  date_of_birth DATE, age INTEGER, gender TEXT,
  blood_group TEXT, marital_status TEXT,
  phone TEXT NOT NULL, alt_phone TEXT, email TEXT,
  aadhar_number TEXT,
  address TEXT, city TEXT, state TEXT, pincode TEXT,
  guardian_name TEXT, guardian_phone TEXT, guardian_relation TEXT,
  emergency_contact_name TEXT, emergency_contact_phone TEXT,
  allergies TEXT[], pre_existing_conditions TEXT[],
  current_medications TEXT,
  billing_category TEXT DEFAULT 'cash',
  insurance_provider_id UUID REFERENCES public.insurance_providers(id) ON DELETE SET NULL,
  policy_number TEXT, member_id TEXT,
  registration_type TEXT DEFAULT 'walk-in',
  photo_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(hospital_id, uhid)
);

CREATE INDEX idx_patients_hospital_phone ON public.patients(hospital_id, phone);
CREATE INDEX idx_patients_hospital_name ON public.patients(hospital_id, full_name);

CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE RESTRICT,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  type TEXT NOT NULL DEFAULT 'opd',
  status appointment_status NOT NULL DEFAULT 'scheduled',
  chief_complaint TEXT, notes TEXT,
  referred_by TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_appointments_hospital_date ON public.appointments(hospital_id, appointment_date);
CREATE INDEX idx_appointments_doctor_date ON public.appointments(doctor_id, appointment_date);

CREATE TABLE public.opd_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  visit_number TEXT NOT NULL,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE RESTRICT,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  visit_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status visit_status NOT NULL DEFAULT 'waiting',
  chief_complaint TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(hospital_id, visit_number)
);

CREATE TABLE public.vitals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  visit_id UUID REFERENCES public.opd_visits(id) ON DELETE CASCADE,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  bp_systolic INTEGER, bp_diastolic INTEGER,
  pulse INTEGER, temperature NUMERIC(4,1),
  respiratory_rate INTEGER, spo2 INTEGER,
  weight NUMERIC(5,2), height NUMERIC(5,2), bmi NUMERIC(5,2),
  blood_sugar NUMERIC(5,1),
  notes TEXT,
  recorded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.consultations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  visit_id UUID REFERENCES public.opd_visits(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE RESTRICT,
  consultation_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  chief_complaint TEXT,
  history_of_present_illness TEXT,
  past_history TEXT, family_history TEXT,
  examination JSONB, diagnosis JSONB,
  advice TEXT, follow_up_date DATE, follow_up_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  consultation_id UUID REFERENCES public.consultations(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE RESTRICT,
  prescription_number TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.prescription_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id UUID NOT NULL REFERENCES public.prescriptions(id) ON DELETE CASCADE,
  medication_id UUID REFERENCES public.medications(id) ON DELETE SET NULL,
  drug_name TEXT NOT NULL,
  dose TEXT, frequency TEXT, duration TEXT,
  route TEXT, instructions TEXT, quantity INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- STEP 8: IPD
-- ============================================================================
CREATE TABLE public.admissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  admission_number TEXT NOT NULL,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE RESTRICT,
  admitting_doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
  ward_id UUID REFERENCES public.wards(id) ON DELETE SET NULL,
  bed_id UUID REFERENCES public.beds(id) ON DELETE SET NULL,
  admission_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  discharge_date TIMESTAMPTZ,
  status admission_status NOT NULL DEFAULT 'admitted',
  diagnosis TEXT, chief_complaint TEXT,
  discharge_summary TEXT, discharge_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(hospital_id, admission_number)
);

CREATE TABLE public.nursing_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admission_id UUID NOT NULL REFERENCES public.admissions(id) ON DELETE CASCADE,
  shift TEXT, note TEXT NOT NULL,
  recorded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.doctor_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admission_id UUID NOT NULL REFERENCES public.admissions(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
  round_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT, plan TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.ipd_vitals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admission_id UUID NOT NULL REFERENCES public.admissions(id) ON DELETE CASCADE,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  bp_systolic INTEGER, bp_diastolic INTEGER,
  pulse INTEGER, temperature NUMERIC(4,1),
  respiratory_rate INTEGER, spo2 INTEGER,
  intake_ml INTEGER, output_ml INTEGER,
  notes TEXT,
  recorded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE TABLE public.nursing_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admission_id UUID NOT NULL REFERENCES public.admissions(id) ON DELETE CASCADE,
  task TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- STEP 9: BILLING
-- ============================================================================
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  bill_number TEXT NOT NULL,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE RESTRICT,
  consultation_id UUID REFERENCES public.consultations(id) ON DELETE SET NULL,
  admission_id UUID REFERENCES public.admissions(id) ON DELETE SET NULL,
  bill_type TEXT NOT NULL DEFAULT 'OPD',
  bill_date DATE NOT NULL DEFAULT CURRENT_DATE,
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount_percentage NUMERIC(5,2) DEFAULT 0,
  discount_amount NUMERIC(12,2) DEFAULT 0,
  tax_percentage NUMERIC(5,2) DEFAULT 0,
  tax_amount NUMERIC(12,2) DEFAULT 0,
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  amount_paid NUMERIC(12,2) NOT NULL DEFAULT 0,
  payment_status payment_status NOT NULL DEFAULT 'unpaid',
  payment_mode TEXT, payment_reference TEXT, notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(hospital_id, bill_number)
);

CREATE TABLE public.invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  service_item_id UUID REFERENCES public.service_items(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  quantity NUMERIC(10,2) NOT NULL DEFAULT 1,
  unit_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount NUMERIC(10,2) DEFAULT 0,
  tax_amount NUMERIC(10,2) DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
  amount NUMERIC(12,2) NOT NULL,
  payment_mode TEXT NOT NULL,
  reference TEXT, notes TEXT,
  payment_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  received_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- STEP 10: PHARMACY
-- ============================================================================
CREATE TABLE public.pharmacy_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  purchase_number TEXT NOT NULL,
  supplier_name TEXT NOT NULL,
  invoice_number TEXT, invoice_date DATE,
  subtotal NUMERIC(12,2) DEFAULT 0,
  tax_amount NUMERIC(12,2) DEFAULT 0,
  total_amount NUMERIC(12,2) DEFAULT 0,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.pharmacy_purchase_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id UUID NOT NULL REFERENCES public.pharmacy_purchases(id) ON DELETE CASCADE,
  medication_id UUID NOT NULL REFERENCES public.medications(id) ON DELETE RESTRICT,
  batch_number TEXT, expiry_date DATE,
  quantity INTEGER NOT NULL,
  cost_price NUMERIC(10,2) NOT NULL,
  mrp NUMERIC(10,2),
  total NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.pharmacy_stock (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  medication_id UUID NOT NULL REFERENCES public.medications(id) ON DELETE CASCADE,
  batch_number TEXT, expiry_date DATE,
  quantity INTEGER NOT NULL DEFAULT 0,
  cost_price NUMERIC(10,2), mrp NUMERIC(10,2),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_pharmacy_stock_hospital_med ON public.pharmacy_stock(hospital_id, medication_id);

CREATE TABLE public.pharmacy_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  sale_number TEXT NOT NULL,
  patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
  prescription_id UUID REFERENCES public.prescriptions(id) ON DELETE SET NULL,
  sale_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  subtotal NUMERIC(12,2) DEFAULT 0,
  discount NUMERIC(12,2) DEFAULT 0,
  tax_amount NUMERIC(12,2) DEFAULT 0,
  total_amount NUMERIC(12,2) DEFAULT 0,
  payment_mode TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(hospital_id, sale_number)
);

CREATE TABLE public.pharmacy_sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES public.pharmacy_sales(id) ON DELETE CASCADE,
  medication_id UUID NOT NULL REFERENCES public.medications(id) ON DELETE RESTRICT,
  batch_number TEXT,
  quantity INTEGER NOT NULL,
  unit_price NUMERIC(10,2) NOT NULL,
  total NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- STEP 11: LAB
-- ============================================================================
CREATE TABLE public.lab_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  order_number TEXT NOT NULL,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE RESTRICT,
  doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
  consultation_id UUID REFERENCES public.consultations(id) ON DELETE SET NULL,
  order_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  status lab_order_status NOT NULL DEFAULT 'pending',
  priority TEXT DEFAULT 'normal',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(hospital_id, order_number)
);

CREATE TABLE public.lab_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.lab_orders(id) ON DELETE CASCADE,
  test_id UUID REFERENCES public.lab_tests(id) ON DELETE SET NULL,
  test_name TEXT NOT NULL,
  sample_collected_at TIMESTAMPTZ,
  result TEXT, normal_range TEXT, units TEXT,
  is_abnormal BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- STEP 12: OT
-- ============================================================================
CREATE TABLE public.ot_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE RESTRICT,
  surgery_name TEXT NOT NULL,
  theatre_name TEXT,
  primary_surgeon_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
  anaesthetist_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
  scheduled_start TIMESTAMPTZ NOT NULL,
  scheduled_end TIMESTAMPTZ,
  actual_start TIMESTAMPTZ, actual_end TIMESTAMPTZ,
  status ot_status NOT NULL DEFAULT 'scheduled',
  pre_op_checklist JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.ot_team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.ot_bookings(id) ON DELETE CASCADE,
  staff_name TEXT NOT NULL, role TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- STEP 13: AMBULANCE / EMERGENCY
-- ============================================================================
CREATE TABLE public.ambulance_vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  vehicle_number TEXT NOT NULL,
  vehicle_type TEXT, status TEXT DEFAULT 'available',
  driver_name TEXT, driver_phone TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.ambulance_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  patient_name TEXT, patient_phone TEXT,
  pickup_location TEXT NOT NULL, drop_location TEXT,
  vehicle_id UUID REFERENCES public.ambulance_vehicles(id) ON DELETE SET NULL,
  pickup_time TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'pending',
  charge NUMERIC(10,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.emergency_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  case_number TEXT NOT NULL,
  patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
  patient_name TEXT, patient_phone TEXT,
  triage_level TEXT,
  chief_complaint TEXT,
  arrival_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT DEFAULT 'active',
  attending_doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(hospital_id, case_number)
);

-- ============================================================================
-- STEP 14: HRMS
-- ============================================================================
CREATE TABLE public.staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  employee_id TEXT NOT NULL,
  first_name TEXT NOT NULL, last_name TEXT,
  email TEXT, phone TEXT,
  date_of_birth DATE, gender TEXT, address TEXT, city TEXT,
  designation TEXT, department TEXT,
  date_of_joining DATE NOT NULL,
  employment_type TEXT DEFAULT 'full_time',
  salary NUMERIC(12,2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(hospital_id, employee_id)
);

CREATE TABLE public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  check_in TIMESTAMPTZ, check_out TIMESTAMPTZ,
  status TEXT DEFAULT 'present',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(staff_id, date)
);

CREATE TABLE public.leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  leave_type TEXT NOT NULL,
  from_date DATE NOT NULL, to_date DATE NOT NULL,
  total_days INTEGER NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'pending',
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- STEP 15: CASH & BANK
-- ============================================================================
CREATE TABLE public.bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  account_name TEXT NOT NULL,
  account_type TEXT NOT NULL DEFAULT 'bank',
  account_number TEXT, ifsc TEXT, bank_name TEXT,
  opening_balance NUMERIC(14,2) DEFAULT 0,
  current_balance NUMERIC(14,2) DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.cash_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.bank_accounts(id) ON DELETE RESTRICT,
  transaction_type TEXT NOT NULL,
  amount NUMERIC(14,2) NOT NULL,
  reference_type TEXT, reference_id UUID,
  description TEXT, mode TEXT,
  transaction_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- STEP 16: INSURANCE CLAIMS (recreate with FKs)
-- ============================================================================
CREATE TABLE public.insurance_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  claim_number TEXT NOT NULL,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE RESTRICT,
  provider_id UUID REFERENCES public.insurance_providers(id) ON DELETE SET NULL,
  admission_id UUID REFERENCES public.admissions(id) ON DELETE SET NULL,
  bill_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  claim_type TEXT NOT NULL DEFAULT 'cashless',
  status TEXT NOT NULL DEFAULT 'draft',
  policy_number TEXT, member_id TEXT,
  claimed_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  approved_amount NUMERIC(12,2) DEFAULT 0,
  settled_amount NUMERIC(12,2) DEFAULT 0,
  deduction_amount NUMERIC(12,2) DEFAULT 0,
  deduction_reason TEXT,
  diagnosis TEXT, treatment_summary TEXT,
  admission_date DATE, discharge_date DATE,
  submitted_at TIMESTAMPTZ, approved_at TIMESTAMPTZ, settled_at TIMESTAMPTZ,
  rejection_reason TEXT, query_details TEXT, query_response TEXT,
  remarks TEXT, documents JSONB DEFAULT '[]'::jsonb,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(hospital_id, claim_number)
);

CREATE TABLE public.pre_authorizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  auth_number TEXT NOT NULL,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE RESTRICT,
  provider_id UUID REFERENCES public.insurance_providers(id) ON DELETE SET NULL,
  policy_number TEXT, member_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  requested_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  approved_amount NUMERIC(12,2) DEFAULT 0,
  planned_procedure TEXT, diagnosis TEXT,
  expected_los_days INTEGER,
  admission_date DATE, valid_until DATE,
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT, remarks TEXT,
  documents JSONB DEFAULT '[]'::jsonb,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(hospital_id, auth_number)
);

-- ============================================================================
-- STEP 17: UPDATED_AT TRIGGERS
-- ============================================================================
DO $$
DECLARE t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'hospitals','profiles','departments','doctors','wards','beds',
    'service_items','medications','insurance_providers','patients',
    'appointments','opd_visits','consultations','admissions','invoices',
    'lab_orders','ot_bookings','staff','insurance_claims','pre_authorizations'
  ]) LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS trg_%I_updated_at ON public.%I;
       CREATE TRIGGER trg_%I_updated_at BEFORE UPDATE ON public.%I
       FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();', t, t, t, t);
  END LOOP;
END $$;

-- ============================================================================
-- STEP 18: ENABLE RLS ON ALL TABLES
-- ============================================================================
DO $$
DECLARE t TEXT;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname='public' LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
  END LOOP;
END $$;

-- ============================================================================
-- STEP 19: RLS POLICIES
-- ============================================================================

-- Hospitals: superadmins see all; users see their own hospital
CREATE POLICY "Superadmins manage hospitals" ON public.hospitals
  FOR ALL TO authenticated
  USING (public.is_superadmin(auth.uid()))
  WITH CHECK (public.is_superadmin(auth.uid()));

CREATE POLICY "Users view own hospital" ON public.hospitals
  FOR SELECT TO authenticated
  USING (id = public.get_user_hospital_id(auth.uid()));

-- Profiles
CREATE POLICY "Users view profiles in their hospital" ON public.profiles
  FOR SELECT TO authenticated
  USING (hospital_id = public.get_user_hospital_id(auth.uid()) OR id = auth.uid());

CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY "Admins manage profiles in hospital" ON public.profiles
  FOR ALL TO authenticated
  USING ((public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'superadmin'))
         AND hospital_id = public.get_user_hospital_id(auth.uid()))
  WITH CHECK ((public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'superadmin'))
              AND hospital_id = public.get_user_hospital_id(auth.uid()));

-- User roles
CREATE POLICY "Users read own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Admins read hospital roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'superadmin'));

CREATE POLICY "Superadmins manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.is_superadmin(auth.uid())) WITH CHECK (public.is_superadmin(auth.uid()));

-- Audit logs
CREATE POLICY "Admins read audit in hospital" ON public.audit_logs
  FOR SELECT TO authenticated
  USING (hospital_id = public.get_user_hospital_id(auth.uid())
         AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'superadmin')));

CREATE POLICY "Authenticated insert audit" ON public.audit_logs
  FOR INSERT TO authenticated WITH CHECK (hospital_id = public.get_user_hospital_id(auth.uid()));

-- Generic hospital-scoped policy generator for the rest
DO $$
DECLARE t TEXT;
DECLARE tables TEXT[] := ARRAY[
  'system_settings','departments','doctors','wards','beds',
  'service_groups','service_items','medications','lab_tests',
  'symptoms','diagnoses','investigations','insurance_providers',
  'patients','appointments','opd_visits','vitals','consultations',
  'prescriptions','admissions','invoices','payments',
  'pharmacy_purchases','pharmacy_stock','pharmacy_sales',
  'lab_orders','ot_bookings','ambulance_vehicles','ambulance_bookings',
  'emergency_cases','staff','bank_accounts','cash_transactions',
  'insurance_claims','pre_authorizations'
];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('CREATE POLICY "hospital_select_%I" ON public.%I
      FOR SELECT TO authenticated
      USING (hospital_id = public.get_user_hospital_id(auth.uid())
             OR public.is_superadmin(auth.uid()))', t, t);
    EXECUTE format('CREATE POLICY "hospital_insert_%I" ON public.%I
      FOR INSERT TO authenticated
      WITH CHECK (hospital_id = public.get_user_hospital_id(auth.uid())
                  OR public.is_superadmin(auth.uid()))', t, t);
    EXECUTE format('CREATE POLICY "hospital_update_%I" ON public.%I
      FOR UPDATE TO authenticated
      USING (hospital_id = public.get_user_hospital_id(auth.uid())
             OR public.is_superadmin(auth.uid()))
      WITH CHECK (hospital_id = public.get_user_hospital_id(auth.uid())
                  OR public.is_superadmin(auth.uid()))', t, t);
    EXECUTE format('CREATE POLICY "hospital_delete_%I" ON public.%I
      FOR DELETE TO authenticated
      USING ((hospital_id = public.get_user_hospital_id(auth.uid()) AND
              (public.has_role(auth.uid(),''admin'') OR public.has_role(auth.uid(),''superadmin'')))
             OR public.is_superadmin(auth.uid()))', t, t);
  END LOOP;
END $$;

-- Child tables (no hospital_id directly) — inherit via parent
CREATE POLICY "child_prescription_items" ON public.prescription_items
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.prescriptions p
                 WHERE p.id = prescription_id
                   AND (p.hospital_id = public.get_user_hospital_id(auth.uid())
                        OR public.is_superadmin(auth.uid()))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.prescriptions p
                      WHERE p.id = prescription_id
                        AND (p.hospital_id = public.get_user_hospital_id(auth.uid())
                             OR public.is_superadmin(auth.uid()))));

CREATE POLICY "child_invoice_items" ON public.invoice_items
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.invoices i
                 WHERE i.id = invoice_id
                   AND (i.hospital_id = public.get_user_hospital_id(auth.uid())
                        OR public.is_superadmin(auth.uid()))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.invoices i
                      WHERE i.id = invoice_id
                        AND (i.hospital_id = public.get_user_hospital_id(auth.uid())
                             OR public.is_superadmin(auth.uid()))));

CREATE POLICY "child_pharmacy_purchase_items" ON public.pharmacy_purchase_items
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.pharmacy_purchases pp
                 WHERE pp.id = purchase_id
                   AND (pp.hospital_id = public.get_user_hospital_id(auth.uid())
                        OR public.is_superadmin(auth.uid()))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.pharmacy_purchases pp
                      WHERE pp.id = purchase_id
                        AND (pp.hospital_id = public.get_user_hospital_id(auth.uid())
                             OR public.is_superadmin(auth.uid()))));

CREATE POLICY "child_pharmacy_sale_items" ON public.pharmacy_sale_items
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.pharmacy_sales ps
                 WHERE ps.id = sale_id
                   AND (ps.hospital_id = public.get_user_hospital_id(auth.uid())
                        OR public.is_superadmin(auth.uid()))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.pharmacy_sales ps
                      WHERE ps.id = sale_id
                        AND (ps.hospital_id = public.get_user_hospital_id(auth.uid())
                             OR public.is_superadmin(auth.uid()))));

CREATE POLICY "child_lab_order_items" ON public.lab_order_items
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.lab_orders lo
                 WHERE lo.id = order_id
                   AND (lo.hospital_id = public.get_user_hospital_id(auth.uid())
                        OR public.is_superadmin(auth.uid()))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.lab_orders lo
                      WHERE lo.id = order_id
                        AND (lo.hospital_id = public.get_user_hospital_id(auth.uid())
                             OR public.is_superadmin(auth.uid()))));

CREATE POLICY "child_nursing_notes" ON public.nursing_notes
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admissions a
                 WHERE a.id = admission_id
                   AND (a.hospital_id = public.get_user_hospital_id(auth.uid())
                        OR public.is_superadmin(auth.uid()))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admissions a
                      WHERE a.id = admission_id
                        AND (a.hospital_id = public.get_user_hospital_id(auth.uid())
                             OR public.is_superadmin(auth.uid()))));

CREATE POLICY "child_doctor_rounds" ON public.doctor_rounds
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admissions a
                 WHERE a.id = admission_id
                   AND (a.hospital_id = public.get_user_hospital_id(auth.uid())
                        OR public.is_superadmin(auth.uid()))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admissions a
                      WHERE a.id = admission_id
                        AND (a.hospital_id = public.get_user_hospital_id(auth.uid())
                             OR public.is_superadmin(auth.uid()))));

CREATE POLICY "child_ipd_vitals" ON public.ipd_vitals
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admissions a
                 WHERE a.id = admission_id
                   AND (a.hospital_id = public.get_user_hospital_id(auth.uid())
                        OR public.is_superadmin(auth.uid()))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admissions a
                      WHERE a.id = admission_id
                        AND (a.hospital_id = public.get_user_hospital_id(auth.uid())
                             OR public.is_superadmin(auth.uid()))));

CREATE POLICY "child_nursing_tasks" ON public.nursing_tasks
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admissions a
                 WHERE a.id = admission_id
                   AND (a.hospital_id = public.get_user_hospital_id(auth.uid())
                        OR public.is_superadmin(auth.uid()))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admissions a
                      WHERE a.id = admission_id
                        AND (a.hospital_id = public.get_user_hospital_id(auth.uid())
                             OR public.is_superadmin(auth.uid()))));

CREATE POLICY "child_ot_team_members" ON public.ot_team_members
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.ot_bookings o
                 WHERE o.id = booking_id
                   AND (o.hospital_id = public.get_user_hospital_id(auth.uid())
                        OR public.is_superadmin(auth.uid()))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.ot_bookings o
                      WHERE o.id = booking_id
                        AND (o.hospital_id = public.get_user_hospital_id(auth.uid())
                             OR public.is_superadmin(auth.uid()))));

CREATE POLICY "child_attendance" ON public.attendance
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.staff s
                 WHERE s.id = staff_id
                   AND (s.hospital_id = public.get_user_hospital_id(auth.uid())
                        OR public.is_superadmin(auth.uid()))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.staff s
                      WHERE s.id = staff_id
                        AND (s.hospital_id = public.get_user_hospital_id(auth.uid())
                             OR public.is_superadmin(auth.uid()))));

CREATE POLICY "child_leave_requests" ON public.leave_requests
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.staff s
                 WHERE s.id = staff_id
                   AND (s.hospital_id = public.get_user_hospital_id(auth.uid())
                        OR public.is_superadmin(auth.uid()))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.staff s
                      WHERE s.id = staff_id
                        AND (s.hospital_id = public.get_user_hospital_id(auth.uid())
                             OR public.is_superadmin(auth.uid()))));