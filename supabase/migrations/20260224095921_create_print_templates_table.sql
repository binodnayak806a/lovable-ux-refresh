/*
  # Create Print Templates Table

  1. New Tables
    - `print_templates`
      - `id` (uuid, primary key)
      - `hospital_id` (uuid, references hospitals)
      - `document_type` (text, not null) - e.g. 'opd_bill', 'prescription', etc.
      - `template_name` (text, not null)
      - `canvas_json` (jsonb) - Fabric.js canvas serialization
      - `page_size` (text, default 'A4') - A4, A5, thermal_80mm, thermal_58mm, custom
      - `page_width_mm` (numeric) - custom width in mm
      - `page_height_mm` (numeric) - custom height in mm
      - `is_default` (boolean, default false) - one default per document_type per hospital
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `created_by` (uuid, references auth.users)

  2. Security
    - Enable RLS on `print_templates` table
    - Policies for authenticated users scoped to their hospital

  3. Indexes
    - Composite index on hospital_id + document_type for fast lookups
    - Partial index on defaults for quick default template retrieval
*/

CREATE TABLE IF NOT EXISTS print_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id uuid NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  document_type text NOT NULL,
  template_name text NOT NULL DEFAULT '',
  canvas_json jsonb DEFAULT '{}'::jsonb,
  page_size text NOT NULL DEFAULT 'A4',
  page_width_mm numeric DEFAULT 210,
  page_height_mm numeric DEFAULT 297,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE print_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view print templates for their hospital"
  ON print_templates FOR SELECT
  TO authenticated
  USING (
    hospital_id IN (
      SELECT hospital_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert print templates for their hospital"
  ON print_templates FOR INSERT
  TO authenticated
  WITH CHECK (
    hospital_id IN (
      SELECT hospital_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update print templates for their hospital"
  ON print_templates FOR UPDATE
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

CREATE POLICY "Users can delete print templates for their hospital"
  ON print_templates FOR DELETE
  TO authenticated
  USING (
    hospital_id IN (
      SELECT hospital_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_print_templates_hospital_type
  ON print_templates(hospital_id, document_type);

CREATE INDEX IF NOT EXISTS idx_print_templates_default
  ON print_templates(hospital_id, document_type, is_default)
  WHERE is_default = true;
