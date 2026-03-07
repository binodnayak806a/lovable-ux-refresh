/*
  # IPD Enhancements: Beds Master, Billing, Discharge, Daily Notes

  1. New Tables
    - `services_master` - Hospital service catalog with GST info
      - `id`, `hospital_id`, `service_name`, `category`, `price`, `gst_rate`, `hsn_code`, `is_active`
    - `packages_master` - Bundled service packages
      - `id`, `hospital_id`, `package_name`, `description`, `services` (jsonb), `total_price`, `is_active`
    - `gst_master` - GST rate configuration per category
      - `id`, `hospital_id`, `category`, `gst_rate`, `hsn_code`, `cgst_rate`, `sgst_rate`, `igst_rate`
    - `ipd_payments` - Partial/advance payment tracking
      - `id`, `admission_id`, `hospital_id`, `amount`, `payment_mode`, `receipt_number`, `notes`, `created_by`, `created_at`
    - `ipd_daily_notes` - Doctor daily visit notes
      - `id`, `admission_id`, `doctor_id`, `note_date`, `observations`, `plan`, `vitals` (jsonb), `created_at`

  2. Modified Tables
    - `admissions` - Add `deposit_amount` column for advance deposit
    - `ipd_bill_items` - Add `service_id`, `category`, `gst_rate`, `gst_amount`, `hsn_code` columns

  3. Security
    - RLS enabled on all new tables
    - Policies scoped to hospital via admissions or direct hospital_id

  4. Seed Data
    - Sample services for demo hospital
    - Sample GST rates per category
    - Sample packages
*/

-- 1. Services Master
CREATE TABLE IF NOT EXISTS services_master (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id uuid NOT NULL,
  service_name text NOT NULL,
  category text NOT NULL DEFAULT 'General',
  price numeric(10,2) NOT NULL DEFAULT 0,
  gst_rate numeric(5,2) NOT NULL DEFAULT 0,
  hsn_code text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE services_master ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read own hospital services"
  ON services_master FOR SELECT
  TO authenticated
  USING (hospital_id IN (SELECT hospital_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Admins can insert services"
  ON services_master FOR INSERT
  TO authenticated
  WITH CHECK (hospital_id IN (SELECT hospital_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Admins can update services"
  ON services_master FOR UPDATE
  TO authenticated
  USING (hospital_id IN (SELECT hospital_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (hospital_id IN (SELECT hospital_id FROM profiles WHERE id = auth.uid()));

-- 2. Packages Master
CREATE TABLE IF NOT EXISTS packages_master (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id uuid NOT NULL,
  package_name text NOT NULL,
  description text,
  services jsonb NOT NULL DEFAULT '[]'::jsonb,
  total_price numeric(10,2) NOT NULL DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE packages_master ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read own hospital packages"
  ON packages_master FOR SELECT
  TO authenticated
  USING (hospital_id IN (SELECT hospital_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Admins can insert packages"
  ON packages_master FOR INSERT
  TO authenticated
  WITH CHECK (hospital_id IN (SELECT hospital_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Admins can update packages"
  ON packages_master FOR UPDATE
  TO authenticated
  USING (hospital_id IN (SELECT hospital_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (hospital_id IN (SELECT hospital_id FROM profiles WHERE id = auth.uid()));

-- 3. GST Master
CREATE TABLE IF NOT EXISTS gst_master (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id uuid NOT NULL,
  category text NOT NULL,
  gst_rate numeric(5,2) NOT NULL DEFAULT 0,
  hsn_code text,
  cgst_rate numeric(5,2) NOT NULL DEFAULT 0,
  sgst_rate numeric(5,2) NOT NULL DEFAULT 0,
  igst_rate numeric(5,2) NOT NULL DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(hospital_id, category)
);

ALTER TABLE gst_master ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read own hospital gst rates"
  ON gst_master FOR SELECT
  TO authenticated
  USING (hospital_id IN (SELECT hospital_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Admins can manage gst rates"
  ON gst_master FOR INSERT
  TO authenticated
  WITH CHECK (hospital_id IN (SELECT hospital_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Admins can update gst rates"
  ON gst_master FOR UPDATE
  TO authenticated
  USING (hospital_id IN (SELECT hospital_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (hospital_id IN (SELECT hospital_id FROM profiles WHERE id = auth.uid()));

-- 4. IPD Payments
CREATE TABLE IF NOT EXISTS ipd_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admission_id uuid NOT NULL,
  hospital_id uuid NOT NULL,
  amount numeric(10,2) NOT NULL,
  payment_mode text NOT NULL DEFAULT 'Cash',
  receipt_number text,
  notes text,
  created_by uuid,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ipd_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read own hospital ipd payments"
  ON ipd_payments FOR SELECT
  TO authenticated
  USING (hospital_id IN (SELECT hospital_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Staff can insert ipd payments"
  ON ipd_payments FOR INSERT
  TO authenticated
  WITH CHECK (hospital_id IN (SELECT hospital_id FROM profiles WHERE id = auth.uid()));

-- 5. IPD Daily Notes
CREATE TABLE IF NOT EXISTS ipd_daily_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admission_id uuid NOT NULL,
  doctor_id uuid,
  note_date date NOT NULL DEFAULT CURRENT_DATE,
  observations text,
  plan text,
  vitals jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ipd_daily_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read daily notes via admission hospital"
  ON ipd_daily_notes FOR SELECT
  TO authenticated
  USING (
    admission_id IN (
      SELECT id FROM admissions WHERE hospital_id IN (
        SELECT hospital_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Doctors can insert daily notes"
  ON ipd_daily_notes FOR INSERT
  TO authenticated
  WITH CHECK (
    admission_id IN (
      SELECT id FROM admissions WHERE hospital_id IN (
        SELECT hospital_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

-- 6. Add deposit_amount to admissions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'admissions' AND column_name = 'deposit_amount'
  ) THEN
    ALTER TABLE admissions ADD COLUMN deposit_amount numeric(10,2) DEFAULT 0;
  END IF;
END $$;

-- 7. Add service/GST columns to ipd_bill_items
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ipd_bill_items' AND column_name = 'service_id'
  ) THEN
    ALTER TABLE ipd_bill_items ADD COLUMN service_id uuid;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ipd_bill_items' AND column_name = 'category'
  ) THEN
    ALTER TABLE ipd_bill_items ADD COLUMN category text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ipd_bill_items' AND column_name = 'gst_rate'
  ) THEN
    ALTER TABLE ipd_bill_items ADD COLUMN gst_rate numeric(5,2) DEFAULT 0;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ipd_bill_items' AND column_name = 'gst_amount'
  ) THEN
    ALTER TABLE ipd_bill_items ADD COLUMN gst_amount numeric(10,2) DEFAULT 0;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ipd_bill_items' AND column_name = 'hsn_code'
  ) THEN
    ALTER TABLE ipd_bill_items ADD COLUMN hsn_code text;
  END IF;
END $$;

-- 8. Indexes
CREATE INDEX IF NOT EXISTS idx_services_master_hospital ON services_master(hospital_id, is_active);
CREATE INDEX IF NOT EXISTS idx_packages_master_hospital ON packages_master(hospital_id, is_active);
CREATE INDEX IF NOT EXISTS idx_gst_master_hospital ON gst_master(hospital_id, category);
CREATE INDEX IF NOT EXISTS idx_ipd_payments_admission ON ipd_payments(admission_id);
CREATE INDEX IF NOT EXISTS idx_ipd_daily_notes_admission ON ipd_daily_notes(admission_id, note_date);

-- 9. Seed services for demo hospital
INSERT INTO services_master (hospital_id, service_name, category, price, gst_rate, hsn_code) VALUES
  ('11111111-1111-1111-1111-111111111111', 'General Consultation', 'Consultation', 500, 5, '9993'),
  ('11111111-1111-1111-1111-111111111111', 'Specialist Consultation', 'Consultation', 1000, 5, '9993'),
  ('11111111-1111-1111-1111-111111111111', 'ECG', 'Investigation', 300, 5, '9993'),
  ('11111111-1111-1111-1111-111111111111', 'X-Ray', 'Investigation', 500, 5, '9993'),
  ('11111111-1111-1111-1111-111111111111', 'CT Scan', 'Investigation', 5000, 5, '9993'),
  ('11111111-1111-1111-1111-111111111111', 'MRI', 'Investigation', 8000, 5, '9993'),
  ('11111111-1111-1111-1111-111111111111', 'Ultrasound', 'Investigation', 1500, 5, '9993'),
  ('11111111-1111-1111-1111-111111111111', 'Minor Dressing', 'Procedure', 200, 5, '9993'),
  ('11111111-1111-1111-1111-111111111111', 'Suturing', 'Procedure', 1000, 5, '9993'),
  ('11111111-1111-1111-1111-111111111111', 'Catheterization', 'Procedure', 800, 5, '9993'),
  ('11111111-1111-1111-1111-111111111111', 'Nebulization', 'Procedure', 150, 5, '9993'),
  ('11111111-1111-1111-1111-111111111111', 'IV Fluid Administration', 'Nursing', 300, 5, '9993'),
  ('11111111-1111-1111-1111-111111111111', 'Injection Charges', 'Nursing', 100, 5, '9993'),
  ('11111111-1111-1111-1111-111111111111', 'Oxygen Charges (per hour)', 'Nursing', 200, 5, '9993'),
  ('11111111-1111-1111-1111-111111111111', 'Physiotherapy Session', 'Therapy', 600, 18, '9993'),
  ('11111111-1111-1111-1111-111111111111', 'Dietitian Consultation', 'Therapy', 400, 18, '9993')
ON CONFLICT DO NOTHING;

-- 10. Seed GST rates
INSERT INTO gst_master (hospital_id, category, gst_rate, hsn_code, cgst_rate, sgst_rate, igst_rate) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Consultation', 5, '9993', 2.5, 2.5, 5),
  ('11111111-1111-1111-1111-111111111111', 'Investigation', 5, '9993', 2.5, 2.5, 5),
  ('11111111-1111-1111-1111-111111111111', 'Procedure', 5, '9993', 2.5, 2.5, 5),
  ('11111111-1111-1111-1111-111111111111', 'Nursing', 5, '9993', 2.5, 2.5, 5),
  ('11111111-1111-1111-1111-111111111111', 'Therapy', 18, '9993', 9, 9, 18),
  ('11111111-1111-1111-1111-111111111111', 'Bed Charges', 0, '9993', 0, 0, 0),
  ('11111111-1111-1111-1111-111111111111', 'Medication', 12, '3004', 6, 6, 12),
  ('11111111-1111-1111-1111-111111111111', 'General', 18, '9993', 9, 9, 18)
ON CONFLICT (hospital_id, category) DO NOTHING;

-- 11. Seed packages
INSERT INTO packages_master (hospital_id, package_name, description, services, total_price) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Normal Delivery Package', 'Standard normal delivery including room, nursing, doctor fees',
   '[{"name":"General Ward (3 days)","price":3000},{"name":"Delivery Charges","price":5000},{"name":"Doctor Fees","price":3000},{"name":"Nursing Charges","price":2000},{"name":"Medications","price":1500}]'::jsonb,
   14500),
  ('11111111-1111-1111-1111-111111111111', 'Appendectomy Package', 'Laparoscopic appendectomy with 2-day stay',
   '[{"name":"Private Room (2 days)","price":6000},{"name":"OT Charges","price":8000},{"name":"Surgeon Fees","price":10000},{"name":"Anaesthesia","price":3000},{"name":"Medications","price":2000}]'::jsonb,
   29000),
  ('11111111-1111-1111-1111-111111111111', 'Health Check-up Package', 'Comprehensive health check-up',
   '[{"name":"CBC","price":300},{"name":"Lipid Profile","price":500},{"name":"Liver Function","price":600},{"name":"Kidney Function","price":500},{"name":"Thyroid Profile","price":700},{"name":"ECG","price":300},{"name":"X-Ray Chest","price":500},{"name":"Consultation","price":500}]'::jsonb,
   3900)
ON CONFLICT DO NOTHING;
