/*
  # Create Prescription Module Tables

  ## Summary
  Creates the prescription and medication tables for the OPD prescription workflow,
  including medication master data, prescriptions, and prescription line items.

  ## New Tables
  1. `medications`
    - `id` (uuid, primary key)
    - `generic_name` (text, generic/INN name)
    - `brand_name` (text, trade name)
    - `manufacturer` (text)
    - `category` (text, therapeutic category)
    - `dosage_form` (text: Tablet, Capsule, Syrup, etc.)
    - `strength` (text: 500mg, 10ml, etc.)
    - `unit_price` (numeric)
    - `usage_count` (integer, for sorting by popularity)
    - `is_active` (boolean)

  2. `prescriptions`
    - `id` (uuid, primary key)
    - `consultation_id` (uuid, FK → consultations, nullable)
    - `patient_id` (uuid, FK → patients)
    - `doctor_id` (uuid, FK → auth.users)
    - `prescription_number` (text, unique)
    - `prescription_date` (timestamptz)
    - `diagnosis` (text, summary from consultation)
    - `general_advice` (text)
    - `dietary_instructions` (text)
    - `follow_up_date` (date)
    - `is_dispensed` (boolean)

  3. `prescription_items`
    - `id` (uuid, primary key)
    - `prescription_id` (uuid, FK → prescriptions)
    - `medication_id` (uuid, FK → medications, nullable for manual entry)
    - `drug_name` (text)
    - `dosage_form` (text)
    - `strength` (text)
    - `quantity` (integer)
    - `dosage` (text)
    - `frequency` (text)
    - `duration_days` (integer)
    - `route` (text)
    - `timing` (text)
    - `special_instructions` (text)

  ## Security
  - RLS enabled on all tables
  - Hospital-scoped access for clinical staff
*/

-- Medications master table
CREATE TABLE IF NOT EXISTS medications (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  generic_name  text NOT NULL,
  brand_name    text,
  manufacturer  text,
  category      text NOT NULL DEFAULT 'General',
  dosage_form   text NOT NULL DEFAULT 'Tablet',
  strength      text,
  unit_price    numeric(10,2),
  usage_count   integer DEFAULT 0,
  is_active     boolean DEFAULT true,
  created_at    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS medications_generic_idx ON medications(generic_name);
CREATE INDEX IF NOT EXISTS medications_brand_idx ON medications(brand_name);
CREATE INDEX IF NOT EXISTS medications_category_idx ON medications(category);

ALTER TABLE medications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view medications"
  ON medications FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Prescriptions table
CREATE TABLE IF NOT EXISTS prescriptions (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id       uuid REFERENCES consultations(id) ON DELETE SET NULL,
  patient_id            uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id             uuid REFERENCES auth.users(id),
  prescription_number   text UNIQUE NOT NULL,
  prescription_date     timestamptz DEFAULT now(),
  diagnosis             text,
  general_advice        text,
  dietary_instructions  text,
  follow_up_date        date,
  is_dispensed          boolean DEFAULT false,
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS prescriptions_patient_idx ON prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS prescriptions_doctor_idx ON prescriptions(doctor_id);
CREATE INDEX IF NOT EXISTS prescriptions_consultation_idx ON prescriptions(consultation_id);
CREATE INDEX IF NOT EXISTS prescriptions_number_idx ON prescriptions(prescription_number);
CREATE INDEX IF NOT EXISTS prescriptions_date_idx ON prescriptions(prescription_date DESC);

ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clinical staff can view prescriptions"
  ON prescriptions FOR SELECT
  TO authenticated
  USING (
    patient_id IN (
      SELECT id FROM patients WHERE hospital_id IN (
        SELECT hospital_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Clinical staff can insert prescriptions"
  ON prescriptions FOR INSERT
  TO authenticated
  WITH CHECK (
    patient_id IN (
      SELECT id FROM patients WHERE hospital_id IN (
        SELECT hospital_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Clinical staff can update prescriptions"
  ON prescriptions FOR UPDATE
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

-- Prescription items table
CREATE TABLE IF NOT EXISTS prescription_items (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id      uuid NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
  medication_id        uuid REFERENCES medications(id) ON DELETE SET NULL,
  drug_name            text NOT NULL,
  dosage_form          text,
  strength             text,
  quantity             integer NOT NULL DEFAULT 1,
  dosage               text,
  frequency            text,
  duration_days        integer,
  route                text DEFAULT 'Oral',
  timing               text,
  special_instructions text,
  sort_order           integer DEFAULT 0,
  created_at           timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS prescription_items_prescription_idx ON prescription_items(prescription_id);
CREATE INDEX IF NOT EXISTS prescription_items_medication_idx ON prescription_items(medication_id);

ALTER TABLE prescription_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clinical staff can view prescription items"
  ON prescription_items FOR SELECT
  TO authenticated
  USING (
    prescription_id IN (
      SELECT id FROM prescriptions WHERE patient_id IN (
        SELECT id FROM patients WHERE hospital_id IN (
          SELECT hospital_id FROM profiles WHERE id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Clinical staff can insert prescription items"
  ON prescription_items FOR INSERT
  TO authenticated
  WITH CHECK (
    prescription_id IN (
      SELECT id FROM prescriptions WHERE patient_id IN (
        SELECT id FROM patients WHERE hospital_id IN (
          SELECT hospital_id FROM profiles WHERE id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Clinical staff can delete prescription items"
  ON prescription_items FOR DELETE
  TO authenticated
  USING (
    prescription_id IN (
      SELECT id FROM prescriptions WHERE patient_id IN (
        SELECT id FROM patients WHERE hospital_id IN (
          SELECT hospital_id FROM profiles WHERE id = auth.uid()
        )
      )
    )
  );

-- Function to generate prescription number
CREATE OR REPLACE FUNCTION generate_prescription_number()
RETURNS text AS $$
DECLARE
  today_count integer;
  new_number text;
BEGIN
  SELECT COUNT(*) + 1 INTO today_count
  FROM prescriptions
  WHERE DATE(prescription_date) = CURRENT_DATE;
  
  new_number := 'RX' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(today_count::text, 4, '0');
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;
