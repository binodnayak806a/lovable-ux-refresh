/*
  # Seed Departments + Create medical_history table

  ## Changes
  1. Seed 20 common departments for the existing hospital (11111111-1111-1111-1111-111111111111)
  2. Create medical_history table for patient medical records
  3. Add missing columns to patients table: registration_type, created_by, guardian_*, billing_category

  ## Notes
  - Uses ON CONFLICT DO NOTHING to prevent duplicate seed errors
  - medical_history uses RLS tied to patient's hospital membership
*/

-- Add missing columns to patients if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'patients' AND column_name = 'registration_type'
  ) THEN
    ALTER TABLE patients ADD COLUMN registration_type text DEFAULT 'walk-in'
      CHECK (registration_type IN ('walk-in','scheduled','emergency','referred'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'patients' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE patients ADD COLUMN created_by uuid REFERENCES auth.users(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'patients' AND column_name = 'guardian_name'
  ) THEN
    ALTER TABLE patients ADD COLUMN guardian_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'patients' AND column_name = 'guardian_phone'
  ) THEN
    ALTER TABLE patients ADD COLUMN guardian_phone text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'patients' AND column_name = 'guardian_relation'
  ) THEN
    ALTER TABLE patients ADD COLUMN guardian_relation text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'patients' AND column_name = 'billing_category'
  ) THEN
    ALTER TABLE patients ADD COLUMN billing_category text DEFAULT 'cash'
      CHECK (billing_category IN ('cash','insurance','tpa'));
  END IF;
END $$;

-- Seed departments for the default hospital
INSERT INTO departments (hospital_id, name, code, description) VALUES
  ('11111111-1111-1111-1111-111111111111', 'General Medicine', 'GEN', 'General outpatient and inpatient medicine'),
  ('11111111-1111-1111-1111-111111111111', 'Surgery', 'SUR', 'General and specialty surgical services'),
  ('11111111-1111-1111-1111-111111111111', 'Orthopedics', 'ORT', 'Bone, joint and musculoskeletal care'),
  ('11111111-1111-1111-1111-111111111111', 'Pediatrics', 'PED', 'Child and adolescent healthcare'),
  ('11111111-1111-1111-1111-111111111111', 'Gynecology & Obstetrics', 'GYN', 'Women''s health and maternity services'),
  ('11111111-1111-1111-1111-111111111111', 'Cardiology', 'CAR', 'Heart and cardiovascular care'),
  ('11111111-1111-1111-1111-111111111111', 'Neurology', 'NEU', 'Brain and nervous system disorders'),
  ('11111111-1111-1111-1111-111111111111', 'Dermatology', 'DER', 'Skin, hair and nail conditions'),
  ('11111111-1111-1111-1111-111111111111', 'ENT', 'ENT', 'Ear, nose and throat care'),
  ('11111111-1111-1111-1111-111111111111', 'Ophthalmology', 'OPH', 'Eye care and vision services'),
  ('11111111-1111-1111-1111-111111111111', 'Psychiatry', 'PSY', 'Mental health and behavioural medicine'),
  ('11111111-1111-1111-1111-111111111111', 'Pulmonology', 'PUL', 'Lung and respiratory diseases'),
  ('11111111-1111-1111-1111-111111111111', 'Gastroenterology', 'GAS', 'Digestive system disorders'),
  ('11111111-1111-1111-1111-111111111111', 'Nephrology', 'NEP', 'Kidney and urinary tract care'),
  ('11111111-1111-1111-1111-111111111111', 'Endocrinology', 'END', 'Hormonal and metabolic disorders'),
  ('11111111-1111-1111-1111-111111111111', 'Oncology', 'ONC', 'Cancer diagnosis and treatment'),
  ('11111111-1111-1111-1111-111111111111', 'Urology', 'URO', 'Urological conditions and surgery'),
  ('11111111-1111-1111-1111-111111111111', 'Rheumatology', 'RHE', 'Autoimmune and joint disorders'),
  ('11111111-1111-1111-1111-111111111111', 'Emergency Medicine', 'EMR', 'Acute and emergency care'),
  ('11111111-1111-1111-1111-111111111111', 'Anesthesiology', 'ANE', 'Anesthesia and pain management')
ON CONFLICT DO NOTHING;

-- Medical history table
CREATE TABLE IF NOT EXISTS medical_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  history_type text NOT NULL CHECK (history_type IN ('past','family','personal','drug','allergy')),
  condition_name text NOT NULL,
  onset_date date,
  is_active boolean DEFAULT true,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE medical_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clinical staff can view medical history"
  ON medical_history FOR SELECT
  TO authenticated
  USING (
    patient_id IN (
      SELECT id FROM patients WHERE hospital_id IN (
        SELECT hospital_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Clinical staff can insert medical history"
  ON medical_history FOR INSERT
  TO authenticated
  WITH CHECK (
    patient_id IN (
      SELECT id FROM patients WHERE hospital_id IN (
        SELECT hospital_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Clinical staff can update medical history"
  ON medical_history FOR UPDATE
  TO authenticated
  USING (
    patient_id IN (
      SELECT id FROM patients WHERE hospital_id IN (
        SELECT hospital_id FROM profiles WHERE id = auth.uid()
      )
    )
  )
  WITH CHECK (
    patient_id IN (
      SELECT id FROM patients WHERE hospital_id IN (
        SELECT hospital_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE INDEX IF NOT EXISTS medical_history_patient_id_idx ON medical_history(patient_id);
CREATE INDEX IF NOT EXISTS medical_history_type_idx ON medical_history(history_type);
CREATE INDEX IF NOT EXISTS departments_hospital_idx ON departments(hospital_id);
