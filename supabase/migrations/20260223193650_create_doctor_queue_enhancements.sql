/*
  # Doctor Queue / Consultation Enhancements

  1. New Tables
    - `settings` - Hospital-level key/value settings (e.g., auto_print_prescription)
      - `id` (uuid, primary key)
      - `hospital_id` (uuid, references hospitals)
      - `key` (text) - setting key name
      - `value` (text) - setting value
      - Unique constraint on (hospital_id, key)

  2. Modified Tables
    - `appointments` - Add `emergency` boolean column (default false)
    - `lab_orders` - Add `consultation_id` column to link lab orders to consultations
    - `consultations` - Add `diagnosis` text column for free-text diagnosis

  3. Security
    - RLS enabled on `settings` table
    - Authenticated users in same hospital can read settings
    - Admin/superadmin can manage settings

  4. Seed Data
    - Default settings for demo hospital (auto_print_prescription = false)
*/

-- 1. Create settings table
CREATE TABLE IF NOT EXISTS settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id uuid NOT NULL,
  key text NOT NULL,
  value text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(hospital_id, key)
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read own hospital settings"
  ON settings FOR SELECT
  TO authenticated
  USING (
    hospital_id IN (
      SELECT hospital_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert settings"
  ON settings FOR INSERT
  TO authenticated
  WITH CHECK (
    hospital_id IN (
      SELECT hospital_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
    )
  );

CREATE POLICY "Admins can update settings"
  ON settings FOR UPDATE
  TO authenticated
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

-- 2. Add emergency column to appointments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments' AND column_name = 'emergency'
  ) THEN
    ALTER TABLE appointments ADD COLUMN emergency boolean DEFAULT false;
  END IF;
END $$;

-- 3. Add consultation_id to lab_orders
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lab_orders' AND column_name = 'consultation_id'
  ) THEN
    ALTER TABLE lab_orders ADD COLUMN consultation_id uuid REFERENCES consultations(id);
  END IF;
END $$;

-- 4. Add diagnosis text column to consultations (free-text, separate from structured diagnoses)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'consultations' AND column_name = 'diagnosis'
  ) THEN
    ALTER TABLE consultations ADD COLUMN diagnosis text;
  END IF;
END $$;

-- 5. Create indexes
CREATE INDEX IF NOT EXISTS idx_settings_hospital_key ON settings(hospital_id, key);
CREATE INDEX IF NOT EXISTS idx_appointments_emergency ON appointments(hospital_id, emergency) WHERE emergency = true;
CREATE INDEX IF NOT EXISTS idx_lab_orders_consultation ON lab_orders(consultation_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_date ON appointments(doctor_id, appointment_date);

-- 6. Seed default settings for demo hospital
INSERT INTO settings (hospital_id, key, value) VALUES
  ('11111111-1111-1111-1111-111111111111', 'auto_print_prescription', 'false'),
  ('11111111-1111-1111-1111-111111111111', 'hospital_name', 'HealthCare Hospital'),
  ('11111111-1111-1111-1111-111111111111', 'hospital_address', '123 Medical Lane, Healthcare City'),
  ('11111111-1111-1111-1111-111111111111', 'hospital_phone', '+91-1234567890')
ON CONFLICT (hospital_id, key) DO NOTHING;
