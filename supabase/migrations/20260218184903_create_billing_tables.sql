/*
  # Create Billing Module Tables

  ## Summary
  Creates the billing and bill items tables for the OPD billing workflow,
  including bill generation, item tracking, and payment processing.

  ## New Tables
  1. `bills`
    - `id` (uuid, primary key)
    - `hospital_id` (uuid, FK → hospitals, nullable for now)
    - `bill_number` (text, unique)
    - `patient_id` (uuid, FK → patients)
    - `consultation_id` (uuid, FK → consultations, nullable)
    - `prescription_id` (uuid, FK → prescriptions, nullable)
    - `bill_type` (text: OPD, IPD, Emergency, Pharmacy)
    - `bill_date` (timestamptz)
    - `subtotal` (numeric)
    - `discount_percentage` (numeric)
    - `discount_amount` (numeric)
    - `tax_percentage` (numeric, default 18 for GST)
    - `tax_amount` (numeric)
    - `total_amount` (numeric)
    - `payment_status` (text: pending, paid, partial, cancelled)
    - `payment_mode` (text: cash, card, upi, online, insurance)
    - `notes` (text)

  2. `bill_items`
    - `id` (uuid, primary key)
    - `bill_id` (uuid, FK → bills)
    - `item_type` (text: consultation, procedure, medication, lab, other)
    - `item_name` (text)
    - `description` (text)
    - `quantity` (integer)
    - `unit_price` (numeric)
    - `total_price` (numeric)
    - `sort_order` (integer)

  ## Security
  - RLS enabled on all tables
  - Hospital-scoped access for clinical/billing staff
*/

-- Bills table
CREATE TABLE IF NOT EXISTS bills (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id         uuid REFERENCES hospitals(id) ON DELETE SET NULL,
  bill_number         text UNIQUE NOT NULL,
  patient_id          uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  consultation_id     uuid REFERENCES consultations(id) ON DELETE SET NULL,
  prescription_id     uuid REFERENCES prescriptions(id) ON DELETE SET NULL,
  bill_type           text NOT NULL DEFAULT 'OPD' CHECK (bill_type IN ('OPD', 'IPD', 'Emergency', 'Pharmacy')),
  bill_date           timestamptz DEFAULT now(),
  subtotal            numeric(12,2) NOT NULL DEFAULT 0,
  discount_percentage numeric(5,2) DEFAULT 0,
  discount_amount     numeric(10,2) DEFAULT 0,
  tax_percentage      numeric(5,2) DEFAULT 18,
  tax_amount          numeric(10,2) DEFAULT 0,
  total_amount        numeric(12,2) NOT NULL DEFAULT 0,
  amount_paid         numeric(12,2) DEFAULT 0,
  payment_status      text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'partial', 'cancelled')),
  payment_mode        text CHECK (payment_mode IN ('cash', 'card', 'upi', 'online', 'insurance', NULL)),
  payment_reference   text,
  notes               text,
  created_by          uuid REFERENCES auth.users(id),
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS bills_patient_idx ON bills(patient_id);
CREATE INDEX IF NOT EXISTS bills_consultation_idx ON bills(consultation_id);
CREATE INDEX IF NOT EXISTS bills_number_idx ON bills(bill_number);
CREATE INDEX IF NOT EXISTS bills_date_idx ON bills(bill_date DESC);
CREATE INDEX IF NOT EXISTS bills_status_idx ON bills(payment_status);

ALTER TABLE bills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clinical staff can view bills"
  ON bills FOR SELECT
  TO authenticated
  USING (
    patient_id IN (
      SELECT id FROM patients WHERE hospital_id IN (
        SELECT hospital_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Clinical staff can insert bills"
  ON bills FOR INSERT
  TO authenticated
  WITH CHECK (
    patient_id IN (
      SELECT id FROM patients WHERE hospital_id IN (
        SELECT hospital_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Clinical staff can update bills"
  ON bills FOR UPDATE
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

-- Bill items table
CREATE TABLE IF NOT EXISTS bill_items (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id       uuid NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  item_type     text NOT NULL DEFAULT 'other' CHECK (item_type IN ('consultation', 'procedure', 'medication', 'lab', 'room', 'other')),
  item_name     text NOT NULL,
  description   text,
  quantity      integer NOT NULL DEFAULT 1,
  unit_price    numeric(10,2) NOT NULL DEFAULT 0,
  total_price   numeric(10,2) NOT NULL DEFAULT 0,
  sort_order    integer DEFAULT 0,
  created_at    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS bill_items_bill_idx ON bill_items(bill_id);

ALTER TABLE bill_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clinical staff can view bill items"
  ON bill_items FOR SELECT
  TO authenticated
  USING (
    bill_id IN (
      SELECT id FROM bills WHERE patient_id IN (
        SELECT id FROM patients WHERE hospital_id IN (
          SELECT hospital_id FROM profiles WHERE id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Clinical staff can insert bill items"
  ON bill_items FOR INSERT
  TO authenticated
  WITH CHECK (
    bill_id IN (
      SELECT id FROM bills WHERE patient_id IN (
        SELECT id FROM patients WHERE hospital_id IN (
          SELECT hospital_id FROM profiles WHERE id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Clinical staff can update bill items"
  ON bill_items FOR UPDATE
  TO authenticated
  USING (
    bill_id IN (
      SELECT id FROM bills WHERE patient_id IN (
        SELECT id FROM patients WHERE hospital_id IN (
          SELECT hospital_id FROM profiles WHERE id = auth.uid()
        )
      )
    )
  )
  WITH CHECK (
    bill_id IN (
      SELECT id FROM bills WHERE patient_id IN (
        SELECT id FROM patients WHERE hospital_id IN (
          SELECT hospital_id FROM profiles WHERE id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Clinical staff can delete bill items"
  ON bill_items FOR DELETE
  TO authenticated
  USING (
    bill_id IN (
      SELECT id FROM bills WHERE patient_id IN (
        SELECT id FROM patients WHERE hospital_id IN (
          SELECT hospital_id FROM profiles WHERE id = auth.uid()
        )
      )
    )
  );

-- Function to generate bill number
CREATE OR REPLACE FUNCTION generate_bill_number()
RETURNS text AS $$
DECLARE
  today_count integer;
  new_number text;
BEGIN
  SELECT COUNT(*) + 1 INTO today_count
  FROM bills
  WHERE DATE(bill_date) = CURRENT_DATE;
  
  new_number := 'INV' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(today_count::text, 4, '0');
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;
