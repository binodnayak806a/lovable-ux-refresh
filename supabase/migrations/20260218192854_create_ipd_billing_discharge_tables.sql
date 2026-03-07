/*
  # IPD Auto-Billing and Discharge Tables

  1. New Tables
    - `ipd_bill_items` - Auto-generated daily charges for IPD patients
      - `id` (uuid, primary key)
      - `admission_id` (uuid, references admissions)
      - `item_date` (date, not null)
      - `item_type` (text) - bed_charges, medication, procedure, investigation, consultation, nursing, misc
      - `item_name` (text, not null)
      - `item_description` (text, optional)
      - `quantity` (integer, default 1)
      - `unit_price` (numeric, not null)
      - `total_price` (numeric, not null)
      - `is_billable` (boolean, default true)
      - `created_by` (uuid, optional)
      - `created_at` (timestamp)

    - `discharge_summaries` - Comprehensive discharge documentation
      - `id` (uuid, primary key)
      - `admission_id` (uuid, references admissions, unique)
      - `discharge_date` (timestamp, not null)
      - `discharge_type` (text) - Normal, LAMA, Death, Transfer, Absconded
      - `final_diagnosis` (text, not null)
      - `treatment_summary` (text)
      - `procedures_performed` (text)
      - `medications_on_discharge` (text)
      - `follow_up_instructions` (text)
      - `follow_up_date` (date)
      - `diet_advice` (text)
      - `activity_restrictions` (text)
      - `condition_at_discharge` (text)
      - `created_by` (uuid)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Create policies for authenticated users to manage records

  3. Indexes
    - Index on admission_id for both tables
    - Index on item_date for ipd_bill_items
*/

-- Create ipd_bill_items table
CREATE TABLE IF NOT EXISTS ipd_bill_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admission_id UUID NOT NULL REFERENCES admissions(id) ON DELETE CASCADE,
  item_date DATE NOT NULL DEFAULT CURRENT_DATE,
  item_type TEXT NOT NULL DEFAULT 'misc' CHECK (item_type IN ('bed_charges', 'medication', 'procedure', 'investigation', 'consultation', 'nursing', 'misc')),
  item_name TEXT NOT NULL,
  item_description TEXT,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (unit_price >= 0),
  total_price NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (total_price >= 0),
  is_billable BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create discharge_summaries table
CREATE TABLE IF NOT EXISTS discharge_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admission_id UUID NOT NULL REFERENCES admissions(id) ON DELETE CASCADE UNIQUE,
  discharge_date TIMESTAMPTZ NOT NULL,
  discharge_type TEXT NOT NULL DEFAULT 'Normal' CHECK (discharge_type IN ('Normal', 'LAMA', 'Death', 'Transfer', 'Absconded')),
  final_diagnosis TEXT NOT NULL,
  treatment_summary TEXT,
  procedures_performed TEXT,
  medications_on_discharge TEXT,
  follow_up_instructions TEXT,
  follow_up_date DATE,
  diet_advice TEXT,
  activity_restrictions TEXT,
  condition_at_discharge TEXT DEFAULT 'Stable' CHECK (condition_at_discharge IN ('Stable', 'Improved', 'Unchanged', 'Deteriorated', 'Critical', 'Expired')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE ipd_bill_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE discharge_summaries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ipd_bill_items
CREATE POLICY "Authenticated users can view ipd_bill_items"
  ON ipd_bill_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admissions a
      JOIN profiles p ON p.hospital_id = a.hospital_id
      WHERE a.id = ipd_bill_items.admission_id
      AND p.id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can insert ipd_bill_items"
  ON ipd_bill_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admissions a
      JOIN profiles p ON p.hospital_id = a.hospital_id
      WHERE a.id = ipd_bill_items.admission_id
      AND p.id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can update ipd_bill_items"
  ON ipd_bill_items FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admissions a
      JOIN profiles p ON p.hospital_id = a.hospital_id
      WHERE a.id = ipd_bill_items.admission_id
      AND p.id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admissions a
      JOIN profiles p ON p.hospital_id = a.hospital_id
      WHERE a.id = ipd_bill_items.admission_id
      AND p.id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can delete ipd_bill_items"
  ON ipd_bill_items FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admissions a
      JOIN profiles p ON p.hospital_id = a.hospital_id
      WHERE a.id = ipd_bill_items.admission_id
      AND p.id = auth.uid()
    )
  );

-- RLS Policies for discharge_summaries
CREATE POLICY "Authenticated users can view discharge_summaries"
  ON discharge_summaries FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admissions a
      JOIN profiles p ON p.hospital_id = a.hospital_id
      WHERE a.id = discharge_summaries.admission_id
      AND p.id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can insert discharge_summaries"
  ON discharge_summaries FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admissions a
      JOIN profiles p ON p.hospital_id = a.hospital_id
      WHERE a.id = discharge_summaries.admission_id
      AND p.id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can update discharge_summaries"
  ON discharge_summaries FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admissions a
      JOIN profiles p ON p.hospital_id = a.hospital_id
      WHERE a.id = discharge_summaries.admission_id
      AND p.id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admissions a
      JOIN profiles p ON p.hospital_id = a.hospital_id
      WHERE a.id = discharge_summaries.admission_id
      AND p.id = auth.uid()
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ipd_bill_items_admission ON ipd_bill_items(admission_id);
CREATE INDEX IF NOT EXISTS idx_ipd_bill_items_date ON ipd_bill_items(item_date);
CREATE INDEX IF NOT EXISTS idx_ipd_bill_items_type ON ipd_bill_items(item_type);
CREATE INDEX IF NOT EXISTS idx_discharge_summaries_admission ON discharge_summaries(admission_id);
CREATE INDEX IF NOT EXISTS idx_discharge_summaries_date ON discharge_summaries(discharge_date);
