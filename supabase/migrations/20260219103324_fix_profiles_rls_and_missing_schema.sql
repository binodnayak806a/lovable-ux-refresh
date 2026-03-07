/*
  # Fix Profiles RLS Infinite Recursion and Missing Schema Elements
  
  1. Problem Fixed
    - The "Admins can view hospital profiles" policy had a subquery referencing the profiles 
      table itself, causing infinite recursion when Supabase evaluated the policy
    - Missing columns: symptoms.usage_count, patients.registration_type
    - Missing table: investigations
  
  2. Security Changes
    - Drop the recursive policy
    - Replace with a non-recursive policy using auth.jwt() to check role
    
  3. Schema Changes
    - Add usage_count column to symptoms table
    - Add registration_type column to patients table
    - Create investigations table with proper structure and RLS
*/

-- ============================================
-- 1. FIX PROFILES RLS INFINITE RECURSION
-- ============================================

-- Drop the problematic policy
DROP POLICY IF EXISTS "Admins can view hospital profiles" ON profiles;

-- Create a safe replacement that doesn't query profiles recursively
-- Uses auth.jwt() to check role from the JWT token directly
CREATE POLICY "Admins can view hospital profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id
    OR (
      hospital_id IS NOT NULL
      AND hospital_id = (auth.jwt() -> 'user_metadata' ->> 'hospital_id')::uuid
      AND (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'superadmin')
    )
  );

-- ============================================
-- 2. ADD MISSING COLUMNS
-- ============================================

-- Add usage_count to symptoms table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'symptoms' AND column_name = 'usage_count'
  ) THEN
    ALTER TABLE symptoms ADD COLUMN usage_count integer DEFAULT 0;
  END IF;
END $$;

-- Add registration_type to patients table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'patients' AND column_name = 'registration_type'
  ) THEN
    ALTER TABLE patients ADD COLUMN registration_type text DEFAULT 'general' 
      CHECK (registration_type IN ('general', 'emergency', 'referral', 'walk-in', 'appointment'));
  END IF;
END $$;

-- Add usage_count to diagnoses table if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'diagnoses' AND column_name = 'usage_count'
  ) THEN
    ALTER TABLE diagnoses ADD COLUMN usage_count integer DEFAULT 0;
  END IF;
END $$;

-- ============================================
-- 3. CREATE INVESTIGATIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS investigations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  description text,
  normal_range text,
  unit text,
  price numeric(10,2) DEFAULT 0,
  is_active boolean DEFAULT true,
  usage_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE investigations ENABLE ROW LEVEL SECURITY;

-- RLS Policy for investigations (reference data, readable by all authenticated users)
CREATE POLICY "Investigations are viewable by authenticated users"
  ON investigations
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Seed some common investigations
INSERT INTO investigations (name, category, description, normal_range, unit, price) VALUES
  ('Complete Blood Count (CBC)', 'Hematology', 'Complete blood cell analysis', 'Varies by component', '', 350),
  ('Hemoglobin', 'Hematology', 'Hemoglobin level test', '12-17 g/dL', 'g/dL', 150),
  ('Blood Glucose Fasting', 'Biochemistry', 'Fasting blood sugar', '70-100 mg/dL', 'mg/dL', 100),
  ('Blood Glucose PP', 'Biochemistry', 'Post-prandial blood sugar', '<140 mg/dL', 'mg/dL', 100),
  ('HbA1c', 'Biochemistry', 'Glycated hemoglobin', '<5.7%', '%', 550),
  ('Lipid Profile', 'Biochemistry', 'Cholesterol and triglycerides', 'Varies', '', 450),
  ('Liver Function Test (LFT)', 'Biochemistry', 'Liver enzyme panel', 'Varies', '', 500),
  ('Kidney Function Test (KFT)', 'Biochemistry', 'Renal function panel', 'Varies', '', 500),
  ('Thyroid Profile (T3, T4, TSH)', 'Endocrinology', 'Thyroid hormone levels', 'Varies', '', 600),
  ('Urine Routine', 'Urinalysis', 'Complete urine analysis', 'Normal', '', 150),
  ('Urine Culture', 'Microbiology', 'Bacterial culture of urine', 'No growth', '', 350),
  ('Chest X-Ray', 'Radiology', 'Chest radiograph', 'Normal', '', 300),
  ('ECG', 'Cardiology', 'Electrocardiogram', 'Normal sinus rhythm', '', 250),
  ('Echocardiogram', 'Cardiology', '2D Echo with Doppler', 'Normal', '', 1500),
  ('Ultrasound Abdomen', 'Radiology', 'Abdominal ultrasound', 'Normal', '', 800),
  ('CT Scan Head', 'Radiology', 'Computed tomography of head', 'Normal', '', 3000),
  ('MRI Brain', 'Radiology', 'Magnetic resonance imaging of brain', 'Normal', '', 5000),
  ('Serum Creatinine', 'Biochemistry', 'Kidney function marker', '0.7-1.3 mg/dL', 'mg/dL', 150),
  ('Blood Urea', 'Biochemistry', 'Urea nitrogen level', '7-20 mg/dL', 'mg/dL', 150),
  ('Serum Electrolytes', 'Biochemistry', 'Sodium, Potassium, Chloride', 'Varies', '', 350)
ON CONFLICT DO NOTHING;

-- ============================================
-- 4. FIX OTHER TABLES WITH POTENTIAL RLS ISSUES
-- ============================================

-- Check and fix policies on other tables that might reference profiles
-- For patients table
DROP POLICY IF EXISTS "Hospital staff can view patients" ON patients;

CREATE POLICY "Hospital staff can view patients"
  ON patients
  FOR SELECT
  TO authenticated
  USING (
    hospital_id IN (
      SELECT hospital_id FROM profiles WHERE id = auth.uid()
    )
    OR hospital_id = '11111111-1111-1111-1111-111111111111'::uuid
  );

-- For wards table
DROP POLICY IF EXISTS "Hospital staff can view wards" ON wards;

CREATE POLICY "Hospital staff can view wards"
  ON wards
  FOR SELECT
  TO authenticated
  USING (
    hospital_id IN (
      SELECT hospital_id FROM profiles WHERE id = auth.uid()
    )
    OR hospital_id = '11111111-1111-1111-1111-111111111111'::uuid
  );

-- For payments table
DROP POLICY IF EXISTS "Hospital staff can view payments" ON payments;

CREATE POLICY "Hospital staff can view payments"
  ON payments
  FOR SELECT
  TO authenticated
  USING (
    hospital_id IN (
      SELECT hospital_id FROM profiles WHERE id = auth.uid()
    )
    OR hospital_id = '11111111-1111-1111-1111-111111111111'::uuid
  );

-- For appointments table
DROP POLICY IF EXISTS "Hospital staff can view appointments" ON appointments;

CREATE POLICY "Hospital staff can view appointments"
  ON appointments
  FOR SELECT
  TO authenticated
  USING (
    hospital_id IN (
      SELECT hospital_id FROM profiles WHERE id = auth.uid()
    )
    OR hospital_id = '11111111-1111-1111-1111-111111111111'::uuid
  );