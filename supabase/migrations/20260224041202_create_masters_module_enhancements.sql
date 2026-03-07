/*
  # Masters Module Enhancements

  1. New Tables
    - `user_roles` - Custom role definitions with per-module permission toggles
      - `id` (uuid, primary key)
      - `hospital_id` (uuid, FK to hospitals)
      - `user_id` (uuid, FK to auth.users)
      - `role_name` (text) - e.g. Super Admin, Admin, Doctor, Custom
      - `permissions` (jsonb) - per-module access toggles
      - `is_active` (boolean)

  2. Modified Tables
    - `doctors` - Add schedule jsonb, first_visit_fee, followup_fee columns
    - `medications` - Add shortcut column for quick code
    - `symptoms` - Add shortcut column for quick code
    - `hospitals` - Add gst_number, state_code, gst_mode columns
    - `custom_fields_config` - Add updated_at column

  3. Security
    - Enable RLS on user_roles
    - Policies for authenticated access scoped to hospital
*/

-- 1. user_roles table
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id uuid REFERENCES hospitals(id) ON DELETE CASCADE,
  user_id uuid,
  role_name text NOT NULL DEFAULT 'Custom',
  permissions jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view user_roles for their hospital"
  ON user_roles FOR SELECT
  TO authenticated
  USING (
    hospital_id IN (
      SELECT hospital_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can insert user_roles for their hospital"
  ON user_roles FOR INSERT
  TO authenticated
  WITH CHECK (
    hospital_id IN (
      SELECT hospital_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can update user_roles for their hospital"
  ON user_roles FOR UPDATE
  TO authenticated
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

CREATE POLICY "Authenticated users can delete user_roles for their hospital"
  ON user_roles FOR DELETE
  TO authenticated
  USING (
    hospital_id IN (
      SELECT hospital_id FROM profiles WHERE id = auth.uid()
    )
  );

-- 2. Add missing columns to doctors
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='doctors' AND column_name='schedule') THEN
    ALTER TABLE doctors ADD COLUMN schedule jsonb DEFAULT '{}'::jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='doctors' AND column_name='first_visit_fee') THEN
    ALTER TABLE doctors ADD COLUMN first_visit_fee numeric DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='doctors' AND column_name='followup_fee') THEN
    ALTER TABLE doctors ADD COLUMN followup_fee numeric DEFAULT 0;
  END IF;
END $$;

-- 3. Add shortcut to medications
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='medications' AND column_name='shortcut') THEN
    ALTER TABLE medications ADD COLUMN shortcut text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='medications' AND column_name='hospital_id') THEN
    ALTER TABLE medications ADD COLUMN hospital_id uuid REFERENCES hospitals(id);
  END IF;
END $$;

-- 4. Add shortcut to symptoms
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='symptoms' AND column_name='shortcut') THEN
    ALTER TABLE symptoms ADD COLUMN shortcut text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='symptoms' AND column_name='hospital_id') THEN
    ALTER TABLE symptoms ADD COLUMN hospital_id uuid REFERENCES hospitals(id);
  END IF;
END $$;

-- 5. Add GST fields to hospitals
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='hospitals' AND column_name='gst_number') THEN
    ALTER TABLE hospitals ADD COLUMN gst_number text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='hospitals' AND column_name='state_code') THEN
    ALTER TABLE hospitals ADD COLUMN state_code text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='hospitals' AND column_name='gst_mode') THEN
    ALTER TABLE hospitals ADD COLUMN gst_mode text DEFAULT 'cgst_sgst';
  END IF;
END $$;

-- 6. Add updated_at to custom_fields_config if missing
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='custom_fields_config' AND column_name='updated_at') THEN
    ALTER TABLE custom_fields_config ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- 7. Add description to visit_type_rules if missing
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='visit_type_rules' AND column_name='description') THEN
    ALTER TABLE visit_type_rules ADD COLUMN description text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='visit_type_rules' AND column_name='fee_multiplier') THEN
    ALTER TABLE visit_type_rules ADD COLUMN fee_multiplier numeric DEFAULT 1.0;
  END IF;
END $$;
