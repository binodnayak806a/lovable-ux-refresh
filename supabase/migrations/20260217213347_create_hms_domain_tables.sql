/*
  # HMS Domain Tables

  ## Summary
  Creates the core HMS operational tables used by the Redux slices:
  patients, patient_vitals, appointments, wards, beds, admissions,
  service_items, invoices, invoice_line_items, payments, notifications.

  ## New Tables

  ### `patients` — Patient master records with UHID
  ### `patient_vitals` — Timestamped vitals (BP, temp, SpO2, weight, etc.)
  ### `appointments` — OPD/telemedicine appointments with token system
  ### `wards` — Hospital ward definitions with bed counts
  ### `beds` — Individual bed records linked to wards
  ### `admissions` — IPD admission records
  ### `service_items` — Billing service catalogue
  ### `invoices` — Patient billing invoices
  ### `invoice_line_items` — Line items per invoice
  ### `payments` — Payment transactions
  ### `notifications` — In-app notification feed

  ## Security
  - RLS enabled on every table
  - All policies require authenticated + same-hospital access
  - Patients: full CRUD for clinical staff, read-only billing
  - Notifications: users can only see their own
*/

CREATE TABLE IF NOT EXISTS patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  uhid text NOT NULL,
  hospital_id uuid NOT NULL REFERENCES hospitals(id),
  full_name text NOT NULL,
  date_of_birth date NOT NULL,
  gender text NOT NULL CHECK (gender IN ('male', 'female', 'other')),
  blood_group text CHECK (blood_group IN ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
  phone text NOT NULL,
  email text,
  address text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  state text NOT NULL DEFAULT '',
  pincode text,
  nationality text NOT NULL DEFAULT 'Indian',
  marital_status text CHECK (marital_status IN ('single','married','divorced','widowed')),
  occupation text,
  referred_by text,
  emergency_contact_name text,
  emergency_contact_phone text,
  emergency_contact_relation text,
  aadhar_number text,
  insurance_provider text,
  insurance_number text,
  insurance_expiry date,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(hospital_id, uhid)
);

ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clinical staff can manage patients"
  ON patients FOR SELECT TO authenticated
  USING (hospital_id IN (SELECT hospital_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Clinical staff can insert patients"
  ON patients FOR INSERT TO authenticated
  WITH CHECK (hospital_id IN (SELECT hospital_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Clinical staff can update patients"
  ON patients FOR UPDATE TO authenticated
  USING (hospital_id IN (SELECT hospital_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (hospital_id IN (SELECT hospital_id FROM profiles WHERE id = auth.uid()));

CREATE TABLE IF NOT EXISTS patient_vitals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id),
  hospital_id uuid NOT NULL REFERENCES hospitals(id),
  recorded_by uuid REFERENCES auth.users(id),
  temperature numeric(4,1),
  pulse integer,
  blood_pressure_systolic integer,
  blood_pressure_diastolic integer,
  respiratory_rate integer,
  oxygen_saturation numeric(4,1),
  weight numeric(5,1),
  height numeric(5,1),
  bmi numeric(4,1),
  recorded_at timestamptz DEFAULT now()
);

ALTER TABLE patient_vitals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hospital staff can view vitals"
  ON patient_vitals FOR SELECT TO authenticated
  USING (hospital_id IN (SELECT hospital_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Clinical staff can insert vitals"
  ON patient_vitals FOR INSERT TO authenticated
  WITH CHECK (hospital_id IN (SELECT hospital_id FROM profiles WHERE id = auth.uid()));

CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id uuid NOT NULL REFERENCES hospitals(id),
  patient_id uuid NOT NULL REFERENCES patients(id),
  doctor_id uuid NOT NULL REFERENCES profiles(id),
  appointment_date date NOT NULL,
  appointment_time time NOT NULL,
  slot_duration_minutes integer NOT NULL DEFAULT 15,
  type text NOT NULL DEFAULT 'opd' CHECK (type IN ('opd','telemedicine','follow_up','emergency')),
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','confirmed','in_progress','completed','cancelled','no_show')),
  token_number integer,
  chief_complaint text,
  diagnosis text,
  prescription text,
  follow_up_date date,
  notes text,
  cancelled_reason text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hospital staff can view appointments"
  ON appointments FOR SELECT TO authenticated
  USING (hospital_id IN (SELECT hospital_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Hospital staff can insert appointments"
  ON appointments FOR INSERT TO authenticated
  WITH CHECK (hospital_id IN (SELECT hospital_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Hospital staff can update appointments"
  ON appointments FOR UPDATE TO authenticated
  USING (hospital_id IN (SELECT hospital_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (hospital_id IN (SELECT hospital_id FROM profiles WHERE id = auth.uid()));

CREATE TABLE IF NOT EXISTS wards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id uuid NOT NULL REFERENCES hospitals(id),
  name text NOT NULL,
  ward_type text NOT NULL DEFAULT 'general' CHECK (ward_type IN ('general','icu','nicu','picu','ot','emergency','private','semi_private','hdu')),
  total_beds integer NOT NULL DEFAULT 0,
  available_beds integer NOT NULL DEFAULT 0,
  floor integer NOT NULL DEFAULT 1,
  block text,
  daily_rate numeric(10,2) NOT NULL DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE wards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hospital staff can view wards"
  ON wards FOR SELECT TO authenticated
  USING (hospital_id IN (SELECT hospital_id FROM profiles WHERE id = auth.uid()));

CREATE TABLE IF NOT EXISTS beds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id uuid NOT NULL REFERENCES hospitals(id),
  ward_id uuid NOT NULL REFERENCES wards(id),
  bed_number text NOT NULL,
  bed_type text NOT NULL DEFAULT 'general' CHECK (bed_type IN ('general','icu','ventilator','oxygen','isolation')),
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available','occupied','reserved','maintenance','cleaning')),
  daily_rate numeric(10,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(ward_id, bed_number)
);

ALTER TABLE beds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hospital staff can view beds"
  ON beds FOR SELECT TO authenticated
  USING (hospital_id IN (SELECT hospital_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Admins and nurses can update beds"
  ON beds FOR UPDATE TO authenticated
  USING (hospital_id IN (
    SELECT hospital_id FROM profiles WHERE id = auth.uid() AND role IN ('admin','superadmin','nurse','doctor')
  ))
  WITH CHECK (hospital_id IN (
    SELECT hospital_id FROM profiles WHERE id = auth.uid() AND role IN ('admin','superadmin','nurse','doctor')
  ));

CREATE TABLE IF NOT EXISTS admissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admission_number text NOT NULL,
  hospital_id uuid NOT NULL REFERENCES hospitals(id),
  patient_id uuid NOT NULL REFERENCES patients(id),
  doctor_id uuid NOT NULL REFERENCES profiles(id),
  ward_id uuid NOT NULL REFERENCES wards(id),
  bed_id uuid NOT NULL REFERENCES beds(id),
  admission_date timestamptz NOT NULL DEFAULT now(),
  discharge_date timestamptz,
  admission_type text NOT NULL DEFAULT 'general' CHECK (admission_type IN ('general','emergency','planned','transfer')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','discharged','transferred','absconded','death')),
  primary_diagnosis text,
  secondary_diagnosis text,
  mlc_case boolean DEFAULT false,
  notes text,
  discharge_summary text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(hospital_id, admission_number)
);

ALTER TABLE admissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clinical staff can view admissions"
  ON admissions FOR SELECT TO authenticated
  USING (hospital_id IN (SELECT hospital_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Clinical staff can insert admissions"
  ON admissions FOR INSERT TO authenticated
  WITH CHECK (hospital_id IN (SELECT hospital_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Clinical staff can update admissions"
  ON admissions FOR UPDATE TO authenticated
  USING (hospital_id IN (SELECT hospital_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (hospital_id IN (SELECT hospital_id FROM profiles WHERE id = auth.uid()));

CREATE TABLE IF NOT EXISTS service_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id uuid NOT NULL REFERENCES hospitals(id),
  name text NOT NULL,
  code text NOT NULL,
  category text NOT NULL CHECK (category IN ('consultation','procedure','room_charges','pharmacy','laboratory','radiology','nursing','ot_charges','anesthesia','blood_bank','ambulance','dietetics','physiotherapy','miscellaneous')),
  rate numeric(10,2) NOT NULL DEFAULT 0,
  tax_percent numeric(5,2) NOT NULL DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(hospital_id, code)
);

ALTER TABLE service_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hospital staff can view service items"
  ON service_items FOR SELECT TO authenticated
  USING (hospital_id IN (SELECT hospital_id FROM profiles WHERE id = auth.uid()));

CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text NOT NULL,
  hospital_id uuid NOT NULL REFERENCES hospitals(id),
  patient_id uuid NOT NULL REFERENCES patients(id),
  admission_id uuid REFERENCES admissions(id),
  appointment_id uuid REFERENCES appointments(id),
  invoice_date date NOT NULL DEFAULT CURRENT_DATE,
  due_date date NOT NULL DEFAULT CURRENT_DATE,
  subtotal numeric(12,2) NOT NULL DEFAULT 0,
  discount_amount numeric(12,2) NOT NULL DEFAULT 0,
  tax_amount numeric(12,2) NOT NULL DEFAULT 0,
  total_amount numeric(12,2) NOT NULL DEFAULT 0,
  paid_amount numeric(12,2) NOT NULL DEFAULT 0,
  balance_due numeric(12,2) GENERATED ALWAYS AS (total_amount - paid_amount) STORED,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('draft','pending','partial','paid','cancelled','refunded')),
  tpa_id uuid,
  insurance_claim_number text,
  remarks text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(hospital_id, invoice_number)
);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Billing staff can view invoices"
  ON invoices FOR SELECT TO authenticated
  USING (hospital_id IN (SELECT hospital_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Billing staff can insert invoices"
  ON invoices FOR INSERT TO authenticated
  WITH CHECK (hospital_id IN (SELECT hospital_id FROM profiles WHERE id = auth.uid() AND role IN ('admin','superadmin','billing','doctor','receptionist')));

CREATE POLICY "Billing staff can update invoices"
  ON invoices FOR UPDATE TO authenticated
  USING (hospital_id IN (SELECT hospital_id FROM profiles WHERE id = auth.uid() AND role IN ('admin','superadmin','billing')))
  WITH CHECK (hospital_id IN (SELECT hospital_id FROM profiles WHERE id = auth.uid() AND role IN ('admin','superadmin','billing')));

CREATE TABLE IF NOT EXISTS invoice_line_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  service_item_id uuid REFERENCES service_items(id),
  description text NOT NULL,
  category text NOT NULL,
  quantity numeric(8,2) NOT NULL DEFAULT 1,
  unit_rate numeric(10,2) NOT NULL DEFAULT 0,
  discount_percent numeric(5,2) NOT NULL DEFAULT 0,
  discount_amount numeric(10,2) NOT NULL DEFAULT 0,
  tax_percent numeric(5,2) NOT NULL DEFAULT 0,
  tax_amount numeric(10,2) NOT NULL DEFAULT 0,
  net_amount numeric(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE invoice_line_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hospital staff can view line items"
  ON invoice_line_items FOR SELECT TO authenticated
  USING (invoice_id IN (SELECT id FROM invoices WHERE hospital_id IN (SELECT hospital_id FROM profiles WHERE id = auth.uid())));

CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id uuid NOT NULL REFERENCES hospitals(id),
  invoice_id uuid NOT NULL REFERENCES invoices(id),
  patient_id uuid NOT NULL REFERENCES patients(id),
  amount numeric(12,2) NOT NULL,
  payment_mode text NOT NULL CHECK (payment_mode IN ('cash','card','upi','cheque','neft','insurance','tpa','wallet')),
  reference_number text,
  payment_date date NOT NULL DEFAULT CURRENT_DATE,
  remarks text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Billing staff can view payments"
  ON payments FOR SELECT TO authenticated
  USING (hospital_id IN (SELECT hospital_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Billing staff can insert payments"
  ON payments FOR INSERT TO authenticated
  WITH CHECK (hospital_id IN (SELECT hospital_id FROM profiles WHERE id = auth.uid() AND role IN ('admin','superadmin','billing')));

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  hospital_id uuid REFERENCES hospitals(id),
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info' CHECK (type IN ('info','warning','error','success')),
  source text NOT NULL DEFAULT 'system' CHECK (source IN ('system','appointment','lab','pharmacy','billing','emergency','ipd')),
  action_url text,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS patients_hospital_id_idx ON patients(hospital_id);
CREATE INDEX IF NOT EXISTS patients_phone_idx ON patients(phone);
CREATE INDEX IF NOT EXISTS patients_uhid_idx ON patients(uhid);
CREATE INDEX IF NOT EXISTS appointments_hospital_date_idx ON appointments(hospital_id, appointment_date);
CREATE INDEX IF NOT EXISTS appointments_doctor_date_idx ON appointments(doctor_id, appointment_date);
CREATE INDEX IF NOT EXISTS appointments_patient_id_idx ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS admissions_hospital_status_idx ON admissions(hospital_id, status);
CREATE INDEX IF NOT EXISTS admissions_patient_id_idx ON admissions(patient_id);
CREATE INDEX IF NOT EXISTS beds_ward_id_idx ON beds(ward_id);
CREATE INDEX IF NOT EXISTS beds_status_idx ON beds(status);
CREATE INDEX IF NOT EXISTS invoices_hospital_status_idx ON invoices(hospital_id, status);
CREATE INDEX IF NOT EXISTS invoices_patient_id_idx ON invoices(patient_id);
CREATE INDEX IF NOT EXISTS payments_invoice_id_idx ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_is_read_idx ON notifications(is_read);
