/*
  # OPD / Appointments Enhancements

  1. New Tables
    - `visit_type_rules`
      - `id` (uuid, primary key)
      - `hospital_id` (uuid, FK to hospitals)
      - `visit_type_name` (text) -- e.g. "First Visit", "Follow-up"
      - `days_threshold` (int) -- days since last visit to trigger this type
      - `is_default` (bool) -- default rule when no match
      - `is_active` (bool)
      - `created_at` (timestamptz)

    - `opd_bills`
      - `id` (uuid, primary key)
      - `hospital_id` (uuid)
      - `appointment_id` (uuid, FK to appointments)
      - `patient_id` (uuid, FK to patients)
      - `doctor_id` (uuid)
      - `bill_number` (text)
      - `amount`, `gst_percent`, `gst_amount`, `discount`, `total_amount` (decimal)
      - `payment_mode` (text)
      - `status` (text) -- pending, paid, cancelled
      - `visit_type` (text)
      - `created_by` (uuid)
      - `created_at` (timestamptz)

  2. Altered Tables
    - `appointments` -- add visit_type, referral_type, referral_doctor, custom_field_values

  3. Security
    - RLS enabled on both new tables
    - Policies for authenticated hospital staff

  4. Seed Data
    - Default visit type rules (First Visit, Follow-up) for demo hospital

  5. Functions
    - `generate_opd_bill_number` -- auto-generates OPD-YYYYMMDD-0001
    - `generate_doctor_token` -- per-doctor daily token
*/

-- 1. Visit Type Rules table
CREATE TABLE IF NOT EXISTS visit_type_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id uuid NOT NULL REFERENCES hospitals(id),
  visit_type_name text NOT NULL,
  days_threshold int NOT NULL DEFAULT 30,
  is_default boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE visit_type_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view visit type rules for their hospital"
  ON visit_type_rules FOR SELECT TO authenticated
  USING (
    hospital_id IN (
      SELECT hospital_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert visit type rules"
  ON visit_type_rules FOR INSERT TO authenticated
  WITH CHECK (
    hospital_id IN (
      SELECT hospital_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
    )
  );

CREATE POLICY "Admins can update visit type rules"
  ON visit_type_rules FOR UPDATE TO authenticated
  USING (
    hospital_id IN (
      SELECT hospital_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
    )
  )
  WITH CHECK (
    hospital_id IN (
      SELECT hospital_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
    )
  );

CREATE POLICY "Admins can delete visit type rules"
  ON visit_type_rules FOR DELETE TO authenticated
  USING (
    hospital_id IN (
      SELECT hospital_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
    )
  );

-- 2. OPD Bills table
CREATE TABLE IF NOT EXISTS opd_bills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id uuid NOT NULL REFERENCES hospitals(id),
  appointment_id uuid REFERENCES appointments(id),
  patient_id uuid NOT NULL REFERENCES patients(id),
  doctor_id uuid,
  bill_number text NOT NULL,
  amount decimal NOT NULL DEFAULT 0,
  gst_percent decimal NOT NULL DEFAULT 0,
  gst_amount decimal NOT NULL DEFAULT 0,
  discount decimal NOT NULL DEFAULT 0,
  total_amount decimal NOT NULL DEFAULT 0,
  payment_mode text NOT NULL DEFAULT 'cash',
  status text NOT NULL DEFAULT 'pending',
  visit_type text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE opd_bills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view opd bills for their hospital"
  ON opd_bills FOR SELECT TO authenticated
  USING (
    hospital_id IN (
      SELECT hospital_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Staff can create opd bills"
  ON opd_bills FOR INSERT TO authenticated
  WITH CHECK (
    hospital_id IN (
      SELECT hospital_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Staff can update opd bills for their hospital"
  ON opd_bills FOR UPDATE TO authenticated
  USING (
    hospital_id IN (
      SELECT hospital_id FROM profiles WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    hospital_id IN (
      SELECT hospital_id FROM profiles WHERE id = auth.uid()
    )
  );

-- 3. Add new columns to appointments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments' AND column_name = 'visit_type'
  ) THEN
    ALTER TABLE appointments ADD COLUMN visit_type text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments' AND column_name = 'referral_type'
  ) THEN
    ALTER TABLE appointments ADD COLUMN referral_type text DEFAULT 'none';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments' AND column_name = 'referral_doctor'
  ) THEN
    ALTER TABLE appointments ADD COLUMN referral_doctor text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments' AND column_name = 'custom_field_values'
  ) THEN
    ALTER TABLE appointments ADD COLUMN custom_field_values jsonb;
  END IF;
END $$;

-- 4. OPD bill number generator
CREATE OR REPLACE FUNCTION generate_opd_bill_number(p_hospital_id uuid)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  v_date_str text;
  v_seq int;
  v_bill_number text;
BEGIN
  v_date_str := to_char(CURRENT_DATE, 'YYYYMMDD');

  SELECT COALESCE(MAX(
    CAST(NULLIF(split_part(bill_number, '-', 3), '') AS int)
  ), 0) + 1
  INTO v_seq
  FROM opd_bills
  WHERE hospital_id = p_hospital_id
    AND bill_number LIKE 'OPD-' || v_date_str || '-%';

  v_bill_number := 'OPD-' || v_date_str || '-' || LPAD(v_seq::text, 4, '0');
  RETURN v_bill_number;
END;
$$;

-- 5. Token number generator (per-doctor, per-day)
CREATE OR REPLACE FUNCTION generate_doctor_token(p_hospital_id uuid, p_doctor_id uuid, p_date date)
RETURNS int
LANGUAGE plpgsql
AS $$
DECLARE
  v_token int;
BEGIN
  SELECT COALESCE(MAX(token_number), 0) + 1
  INTO v_token
  FROM appointments
  WHERE hospital_id = p_hospital_id
    AND doctor_id = p_doctor_id
    AND appointment_date = p_date;

  RETURN v_token;
END;
$$;

-- 6. Seed default visit type rules for demo hospital
INSERT INTO visit_type_rules (hospital_id, visit_type_name, days_threshold, is_default, is_active)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Follow-up', 30, false, true),
  ('11111111-1111-1111-1111-111111111111', 'First Visit', 9999, true, true)
ON CONFLICT DO NOTHING;

-- 7. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_opd_bills_hospital_date ON opd_bills (hospital_id, created_at);
CREATE INDEX IF NOT EXISTS idx_opd_bills_appointment ON opd_bills (appointment_id);
CREATE INDEX IF NOT EXISTS idx_visit_type_rules_hospital ON visit_type_rules (hospital_id, is_active);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_date ON appointments (patient_id, appointment_date);
