/*
  # Enhance Patients Module - UHID, Aadhaar Upload, Custom Fields

  1. Altered Tables
    - `patients`
      - `aadhaar_url` (text, nullable) - URL to uploaded Aadhaar card image in storage
      - `custom_field_values` (jsonb, nullable) - Stores values for admin-configurable custom fields
      - `age` (integer, nullable) - Computed/stored age for quick display

  2. New Tables
    - `custom_fields_config`
      - `id` (uuid, primary key)
      - `hospital_id` (uuid, references hospitals) - Scoped per hospital
      - `form_name` (text) - Which form this field belongs to (e.g., 'patient')
      - `field_label` (text) - Display label for the field
      - `field_type` (text) - Type: text, date, dropdown, toggle
      - `is_mandatory` (bool) - Whether this field is required
      - `options` (jsonb) - Dropdown options or other config
      - `sort_order` (int) - Display ordering
      - `is_active` (bool) - Soft delete flag
      - `created_at` (timestamptz)

  3. New Functions
    - `generate_uhid()` - Generates UHID in format UHID-YYYYMMDD-NNNN, auto-incrementing daily

  4. Security
    - Enable RLS on `custom_fields_config` table
    - Authenticated users in same hospital can read custom fields
    - Only authenticated users can manage their hospital's custom fields

  5. Storage
    - Creates 'patient-docs' bucket for Aadhaar uploads
*/

-- Add new columns to patients table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'patients' AND column_name = 'aadhaar_url'
  ) THEN
    ALTER TABLE patients ADD COLUMN aadhaar_url text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'patients' AND column_name = 'custom_field_values'
  ) THEN
    ALTER TABLE patients ADD COLUMN custom_field_values jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'patients' AND column_name = 'age'
  ) THEN
    ALTER TABLE patients ADD COLUMN age integer;
  END IF;
END $$;

-- Create custom_fields_config table
CREATE TABLE IF NOT EXISTS custom_fields_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id uuid NOT NULL REFERENCES hospitals(id),
  form_name text NOT NULL DEFAULT 'patient',
  field_label text NOT NULL,
  field_type text NOT NULL DEFAULT 'text' CHECK (field_type IN ('text', 'date', 'dropdown', 'toggle')),
  is_mandatory boolean NOT NULL DEFAULT false,
  options jsonb DEFAULT '[]'::jsonb,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE custom_fields_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read custom fields for their hospital"
  ON custom_fields_config
  FOR SELECT
  TO authenticated
  USING (
    hospital_id IN (
      SELECT hospital_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can insert custom fields for their hospital"
  ON custom_fields_config
  FOR INSERT
  TO authenticated
  WITH CHECK (
    hospital_id IN (
      SELECT hospital_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can update custom fields for their hospital"
  ON custom_fields_config
  FOR UPDATE
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

CREATE POLICY "Authenticated users can delete custom fields for their hospital"
  ON custom_fields_config
  FOR DELETE
  TO authenticated
  USING (
    hospital_id IN (
      SELECT hospital_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Create UHID generation function
CREATE OR REPLACE FUNCTION generate_uhid(p_hospital_id uuid)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  today_str text;
  next_seq int;
  new_uhid text;
BEGIN
  today_str := to_char(CURRENT_DATE, 'YYYYMMDD');
  
  SELECT COALESCE(MAX(
    CAST(
      NULLIF(split_part(uhid, '-', 3), '') AS integer
    )
  ), 0) + 1
  INTO next_seq
  FROM patients
  WHERE hospital_id = p_hospital_id
    AND uhid LIKE 'UHID-' || today_str || '-%';
  
  new_uhid := 'UHID-' || today_str || '-' || lpad(next_seq::text, 4, '0');
  
  RETURN new_uhid;
END;
$$;

-- Create storage bucket for patient documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'patient-docs',
  'patient-docs',
  false,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for patient-docs bucket
CREATE POLICY "Authenticated users can upload patient docs"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'patient-docs');

CREATE POLICY "Authenticated users can read patient docs"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'patient-docs');

CREATE POLICY "Authenticated users can update patient docs"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'patient-docs')
  WITH CHECK (bucket_id = 'patient-docs');

CREATE POLICY "Authenticated users can delete patient docs"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'patient-docs');