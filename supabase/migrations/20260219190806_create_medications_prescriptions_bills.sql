/*
  # Medications, Prescriptions, and Billing Tables

  1. New Tables
    - `medications` - Master medication formulary with dosage info
    - `prescriptions` - Prescription header records
    - `prescription_items` - Individual medication line items
    - `bills` - OPD/quick billing records
    - `bill_items` - Line items for bills

  2. Security
    - RLS enabled on all tables
    - Hospital-scoped access for clinical records
    - Master data readable by all authenticated users
*/

-- MEDICATIONS MASTER TABLE
CREATE TABLE IF NOT EXISTS medications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  generic_name text,
  brand_name text,
  category text DEFAULT 'other',
  dosage_form text DEFAULT 'tablet',
  form text,
  strength text,
  unit text DEFAULT 'mg',
  manufacturer text,
  usage_count integer DEFAULT 0,
  is_active boolean DEFAULT true,
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE medications ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'medications' AND policyname = 'Authenticated users can view medications') THEN
    CREATE POLICY "Authenticated users can view medications"
      ON medications FOR SELECT TO authenticated USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'medications' AND policyname = 'Admins can manage medications') THEN
    CREATE POLICY "Admins can manage medications"
      ON medications FOR INSERT TO authenticated
      WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin','superadmin','pharmacist'));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'medications' AND policyname = 'Admins can update medications') THEN
    CREATE POLICY "Admins can update medications"
      ON medications FOR UPDATE TO authenticated
      USING ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin','superadmin','pharmacist'))
      WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin','superadmin','pharmacist'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_medications_name ON medications(name);

-- PRESCRIPTIONS TABLE
CREATE TABLE IF NOT EXISTS prescriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_number text NOT NULL,
  hospital_id uuid REFERENCES hospitals(id),
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id uuid REFERENCES profiles(id),
  consultation_id uuid REFERENCES consultations(id) ON DELETE SET NULL,
  appointment_id uuid REFERENCES appointments(id) ON DELETE SET NULL,
  prescription_date date DEFAULT CURRENT_DATE,
  diagnosis text,
  general_advice text,
  dietary_instructions text,
  notes text,
  advice text,
  follow_up_date date,
  is_dispensed boolean DEFAULT false,
  status text DEFAULT 'active' CHECK (status IN ('active','dispensed','cancelled','expired')),
  dispensed_at timestamptz,
  dispensed_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hospital staff can view prescriptions"
  ON prescriptions FOR SELECT TO authenticated
  USING (hospital_id = (SELECT hospital_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Clinical staff can insert prescriptions"
  ON prescriptions FOR INSERT TO authenticated
  WITH CHECK (hospital_id = (SELECT hospital_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Clinical staff can update prescriptions"
  ON prescriptions FOR UPDATE TO authenticated
  USING (hospital_id = (SELECT hospital_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (hospital_id = (SELECT hospital_id FROM profiles WHERE id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_prescriptions_patient ON prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_hospital ON prescriptions(hospital_id);

-- PRESCRIPTION ITEMS TABLE
CREATE TABLE IF NOT EXISTS prescription_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id uuid REFERENCES prescriptions(id) ON DELETE CASCADE,
  medication_id uuid REFERENCES medications(id),
  medication_name text NOT NULL,
  drug_name text,
  dosage_form text,
  dosage text,
  strength text,
  frequency text,
  duration text,
  duration_days integer,
  route text DEFAULT 'oral',
  timing text,
  instructions text,
  special_instructions text,
  quantity integer DEFAULT 1,
  sort_order integer DEFAULT 0,
  is_dispensed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE prescription_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hospital staff can view prescription items"
  ON prescription_items FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM prescriptions p
    WHERE p.id = prescription_items.prescription_id
    AND p.hospital_id = (SELECT hospital_id FROM profiles WHERE id = auth.uid())
  ));

CREATE POLICY "Clinical staff can insert prescription items"
  ON prescription_items FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM prescriptions p
    WHERE p.id = prescription_items.prescription_id
    AND p.hospital_id = (SELECT hospital_id FROM profiles WHERE id = auth.uid())
  ));

CREATE POLICY "Clinical staff can update prescription items"
  ON prescription_items FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM prescriptions p
    WHERE p.id = prescription_items.prescription_id
    AND p.hospital_id = (SELECT hospital_id FROM profiles WHERE id = auth.uid())
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM prescriptions p
    WHERE p.id = prescription_items.prescription_id
    AND p.hospital_id = (SELECT hospital_id FROM profiles WHERE id = auth.uid())
  ));

CREATE POLICY "Clinical staff can delete prescription items"
  ON prescription_items FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM prescriptions p
    WHERE p.id = prescription_items.prescription_id
    AND p.hospital_id = (SELECT hospital_id FROM profiles WHERE id = auth.uid())
  ));

-- BILLS TABLE
CREATE TABLE IF NOT EXISTS bills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_number text NOT NULL,
  hospital_id uuid REFERENCES hospitals(id),
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  consultation_id uuid REFERENCES consultations(id) ON DELETE SET NULL,
  prescription_id uuid REFERENCES prescriptions(id) ON DELETE SET NULL,
  appointment_id uuid REFERENCES appointments(id) ON DELETE SET NULL,
  bill_date date DEFAULT CURRENT_DATE,
  bill_type text DEFAULT 'opd' CHECK (bill_type IN ('opd','ipd','emergency','pharmacy','lab','other')),
  subtotal numeric DEFAULT 0,
  discount_percentage numeric DEFAULT 0,
  discount_amount numeric DEFAULT 0,
  tax_percentage numeric DEFAULT 0,
  tax_amount numeric DEFAULT 0,
  total_amount numeric DEFAULT 0,
  amount_paid numeric DEFAULT 0,
  paid_amount numeric DEFAULT 0,
  balance_due numeric GENERATED ALWAYS AS (total_amount - COALESCE(paid_amount, 0)) STORED,
  payment_mode text DEFAULT 'cash' CHECK (payment_mode IN ('cash','card','upi','cheque','insurance','tpa','wallet','credit')),
  payment_reference text,
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('draft','pending','paid','partial','cancelled','refunded')),
  status text DEFAULT 'draft',
  remarks text,
  notes text,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE bills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hospital staff can view bills"
  ON bills FOR SELECT TO authenticated
  USING (hospital_id = (SELECT hospital_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Billing staff can insert bills"
  ON bills FOR INSERT TO authenticated
  WITH CHECK (hospital_id = (SELECT hospital_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Billing staff can update bills"
  ON bills FOR UPDATE TO authenticated
  USING (hospital_id = (SELECT hospital_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (hospital_id = (SELECT hospital_id FROM profiles WHERE id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_bills_hospital ON bills(hospital_id);
CREATE INDEX IF NOT EXISTS idx_bills_patient ON bills(patient_id);
CREATE INDEX IF NOT EXISTS idx_bills_date ON bills(bill_date);

-- BILL ITEMS TABLE
CREATE TABLE IF NOT EXISTS bill_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id uuid REFERENCES bills(id) ON DELETE CASCADE,
  item_type text,
  item_name text,
  description text NOT NULL,
  category text DEFAULT 'miscellaneous',
  quantity numeric DEFAULT 1,
  unit_price numeric DEFAULT 0,
  unit_rate numeric DEFAULT 0,
  total_price numeric DEFAULT 0,
  discount_percent numeric DEFAULT 0,
  discount_amount numeric DEFAULT 0,
  tax_percent numeric DEFAULT 0,
  tax_amount numeric DEFAULT 0,
  net_amount numeric DEFAULT 0,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE bill_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hospital staff can view bill items"
  ON bill_items FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM bills b
    WHERE b.id = bill_items.bill_id
    AND b.hospital_id = (SELECT hospital_id FROM profiles WHERE id = auth.uid())
  ));

CREATE POLICY "Billing staff can insert bill items"
  ON bill_items FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM bills b
    WHERE b.id = bill_items.bill_id
    AND b.hospital_id = (SELECT hospital_id FROM profiles WHERE id = auth.uid())
  ));

CREATE POLICY "Billing staff can update bill items"
  ON bill_items FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM bills b
    WHERE b.id = bill_items.bill_id
    AND b.hospital_id = (SELECT hospital_id FROM profiles WHERE id = auth.uid())
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM bills b
    WHERE b.id = bill_items.bill_id
    AND b.hospital_id = (SELECT hospital_id FROM profiles WHERE id = auth.uid())
  ));

CREATE POLICY "Billing staff can delete bill items"
  ON bill_items FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM bills b
    WHERE b.id = bill_items.bill_id
    AND b.hospital_id = (SELECT hospital_id FROM profiles WHERE id = auth.uid())
  ));

CREATE INDEX IF NOT EXISTS idx_bill_items_bill ON bill_items(bill_id);
