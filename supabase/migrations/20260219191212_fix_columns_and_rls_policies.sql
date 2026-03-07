/*
  # Fix missing columns and RLS policies on existing tables

  1. Schema Changes
    - Add missing columns to departments, wards, service_items tables
    - Add department_id to appointments table for analytics

  2. Security Changes
    - Fix profiles RLS to prevent infinite recursion
    - Update policies on patients, wards, payments, appointments for demo hospital access
*/

-- Add missing columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'departments' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE departments ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wards' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE wards ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wards' AND column_name = 'description'
  ) THEN
    ALTER TABLE wards ADD COLUMN description text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_items' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE service_items ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments' AND column_name = 'department_id'
  ) THEN
    ALTER TABLE appointments ADD COLUMN department_id uuid REFERENCES departments(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments' AND column_name = 'consultation_id'
  ) THEN
    ALTER TABLE appointments ADD COLUMN consultation_id uuid;
  END IF;
END $$;

-- Fix profiles RLS
DROP POLICY IF EXISTS "Admins can view hospital profiles" ON profiles;

CREATE POLICY "Admins can view hospital profiles"
  ON profiles FOR SELECT TO authenticated
  USING (
    auth.uid() = id
    OR (
      hospital_id IS NOT NULL
      AND hospital_id = (auth.jwt() -> 'user_metadata' ->> 'hospital_id')::uuid
      AND (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'superadmin')
    )
  );

-- Fix policies on key tables for demo hospital
DROP POLICY IF EXISTS "Hospital staff can view patients" ON patients;
CREATE POLICY "Hospital staff can view patients"
  ON patients FOR SELECT TO authenticated
  USING (
    hospital_id IN (SELECT hospital_id FROM profiles WHERE id = auth.uid())
    OR hospital_id = '11111111-1111-1111-1111-111111111111'::uuid
  );

DROP POLICY IF EXISTS "Hospital staff can view wards" ON wards;
CREATE POLICY "Hospital staff can view wards"
  ON wards FOR SELECT TO authenticated
  USING (
    hospital_id IN (SELECT hospital_id FROM profiles WHERE id = auth.uid())
    OR hospital_id = '11111111-1111-1111-1111-111111111111'::uuid
  );

DROP POLICY IF EXISTS "Hospital staff can view payments" ON payments;
CREATE POLICY "Hospital staff can view payments"
  ON payments FOR SELECT TO authenticated
  USING (
    hospital_id IN (SELECT hospital_id FROM profiles WHERE id = auth.uid())
    OR hospital_id = '11111111-1111-1111-1111-111111111111'::uuid
  );

DROP POLICY IF EXISTS "Hospital staff can view appointments" ON appointments;
CREATE POLICY "Hospital staff can view appointments"
  ON appointments FOR SELECT TO authenticated
  USING (
    hospital_id IN (SELECT hospital_id FROM profiles WHERE id = auth.uid())
    OR hospital_id = '11111111-1111-1111-1111-111111111111'::uuid
  );
