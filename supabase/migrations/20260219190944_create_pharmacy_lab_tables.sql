/*
  # Pharmacy and Lab Module Tables

  1. New Tables
    - `pharmacy_inventory` - Medication stock by batch with expiry tracking
    - `pharmacy_transactions` - All pharmacy movements
    - `lab_tests` - Master list of available lab tests
    - `lab_orders` - Lab test orders per patient
    - `lab_order_items` - Individual tests within an order

  2. Security
    - RLS enabled on all tables
    - Hospital-scoped access
*/

-- PHARMACY INVENTORY TABLE
CREATE TABLE IF NOT EXISTS pharmacy_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id uuid REFERENCES hospitals(id),
  medication_id uuid REFERENCES medications(id),
  medication_name text NOT NULL,
  batch_number text NOT NULL,
  manufacturer text,
  expiry_date date NOT NULL,
  manufacture_date date,
  quantity_in_stock integer DEFAULT 0,
  reorder_level integer DEFAULT 10,
  purchase_price numeric DEFAULT 0,
  selling_price numeric DEFAULT 0,
  mrp numeric DEFAULT 0,
  hsn_code text,
  gst_percent numeric DEFAULT 0,
  rack_number text,
  location text,
  supplier_name text,
  last_updated timestamptz DEFAULT now(),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE pharmacy_inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hospital staff can view pharmacy inventory"
  ON pharmacy_inventory FOR SELECT TO authenticated
  USING (hospital_id = (SELECT hospital_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Pharmacy staff can insert inventory"
  ON pharmacy_inventory FOR INSERT TO authenticated
  WITH CHECK (hospital_id = (SELECT hospital_id FROM profiles WHERE id = auth.uid())
    AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin','superadmin','pharmacist'));

CREATE POLICY "Pharmacy staff can update inventory"
  ON pharmacy_inventory FOR UPDATE TO authenticated
  USING (hospital_id = (SELECT hospital_id FROM profiles WHERE id = auth.uid())
    AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin','superadmin','pharmacist'))
  WITH CHECK (hospital_id = (SELECT hospital_id FROM profiles WHERE id = auth.uid())
    AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin','superadmin','pharmacist'));

-- PHARMACY TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS pharmacy_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id uuid REFERENCES hospitals(id),
  inventory_id uuid REFERENCES pharmacy_inventory(id),
  medication_id uuid REFERENCES medications(id),
  medication_name text NOT NULL,
  batch_number text,
  transaction_type text NOT NULL CHECK (transaction_type IN ('purchase','sale','return','adjustment','dispensing','expired','transfer')),
  quantity integer NOT NULL,
  unit_price numeric DEFAULT 0,
  total_amount numeric DEFAULT 0,
  patient_id uuid REFERENCES patients(id) ON DELETE SET NULL,
  prescription_id uuid REFERENCES prescriptions(id) ON DELETE SET NULL,
  reference_number text,
  vendor_name text,
  notes text,
  transaction_date date DEFAULT CURRENT_DATE,
  performed_by uuid REFERENCES profiles(id),
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE pharmacy_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hospital staff can view pharmacy transactions"
  ON pharmacy_transactions FOR SELECT TO authenticated
  USING (hospital_id = (SELECT hospital_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Pharmacy staff can insert transactions"
  ON pharmacy_transactions FOR INSERT TO authenticated
  WITH CHECK (hospital_id = (SELECT hospital_id FROM profiles WHERE id = auth.uid()));

-- LAB TESTS MASTER TABLE
CREATE TABLE IF NOT EXISTS lab_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id uuid REFERENCES hospitals(id),
  name text NOT NULL,
  test_name text,
  code text,
  test_code text,
  category text DEFAULT 'general',
  test_category text,
  sample_type text DEFAULT 'blood',
  tat_hours integer DEFAULT 24,
  turnaround_time_hours integer,
  price numeric DEFAULT 0,
  test_price numeric DEFAULT 0,
  normal_range text,
  normal_range_male text,
  normal_range_female text,
  unit text,
  method text,
  instructions text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE lab_tests ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'lab_tests' AND policyname = 'Authenticated users can view lab tests') THEN
    CREATE POLICY "Authenticated users can view lab tests"
      ON lab_tests FOR SELECT TO authenticated USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'lab_tests' AND policyname = 'Lab staff can insert lab tests') THEN
    CREATE POLICY "Lab staff can insert lab tests"
      ON lab_tests FOR INSERT TO authenticated
      WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin','superadmin','lab_technician'));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'lab_tests' AND policyname = 'Lab staff can update lab tests') THEN
    CREATE POLICY "Lab staff can update lab tests"
      ON lab_tests FOR UPDATE TO authenticated
      USING ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin','superadmin','lab_technician'))
      WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin','superadmin','lab_technician'));
  END IF;
END $$;

-- LAB ORDERS TABLE
CREATE TABLE IF NOT EXISTS lab_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text NOT NULL,
  hospital_id uuid REFERENCES hospitals(id),
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id uuid REFERENCES profiles(id),
  appointment_id uuid REFERENCES appointments(id) ON DELETE SET NULL,
  admission_id uuid REFERENCES admissions(id) ON DELETE SET NULL,
  order_date date DEFAULT CURRENT_DATE,
  priority text DEFAULT 'routine' CHECK (priority IN ('routine','urgent','stat','emergency')),
  clinical_notes text,
  sample_collected_at timestamptz,
  sample_collected_by uuid REFERENCES profiles(id),
  status text DEFAULT 'ordered' CHECK (status IN ('ordered','sample_collected','processing','completed','reported','cancelled')),
  reported_at timestamptz,
  reported_by uuid REFERENCES profiles(id),
  total_amount numeric DEFAULT 0,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE lab_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hospital staff can view lab orders"
  ON lab_orders FOR SELECT TO authenticated
  USING (hospital_id = (SELECT hospital_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Clinical staff can insert lab orders"
  ON lab_orders FOR INSERT TO authenticated
  WITH CHECK (hospital_id = (SELECT hospital_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Clinical staff can update lab orders"
  ON lab_orders FOR UPDATE TO authenticated
  USING (hospital_id = (SELECT hospital_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (hospital_id = (SELECT hospital_id FROM profiles WHERE id = auth.uid()));

-- LAB ORDER ITEMS TABLE
CREATE TABLE IF NOT EXISTS lab_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES lab_orders(id) ON DELETE CASCADE,
  test_id uuid REFERENCES lab_tests(id),
  test_name text NOT NULL,
  test_code text,
  test_price numeric DEFAULT 0,
  normal_range text,
  status text DEFAULT 'pending' CHECK (status IN ('pending','sample_collected','processing','completed','cancelled')),
  result_value text,
  result_unit text,
  is_abnormal boolean DEFAULT false,
  result_notes text,
  remarks text,
  entered_by uuid REFERENCES profiles(id),
  entered_at timestamptz,
  completed_at timestamptz,
  completed_by uuid REFERENCES profiles(id),
  price numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE lab_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hospital staff can view lab order items"
  ON lab_order_items FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM lab_orders lo
    WHERE lo.id = lab_order_items.order_id
    AND lo.hospital_id = (SELECT hospital_id FROM profiles WHERE id = auth.uid())
  ));

CREATE POLICY "Lab staff can insert lab order items"
  ON lab_order_items FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM lab_orders lo
    WHERE lo.id = lab_order_items.order_id
    AND lo.hospital_id = (SELECT hospital_id FROM profiles WHERE id = auth.uid())
  ));

CREATE POLICY "Lab staff can update lab order items"
  ON lab_order_items FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM lab_orders lo
    WHERE lo.id = lab_order_items.order_id
    AND lo.hospital_id = (SELECT hospital_id FROM profiles WHERE id = auth.uid())
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM lab_orders lo
    WHERE lo.id = lab_order_items.order_id
    AND lo.hospital_id = (SELECT hospital_id FROM profiles WHERE id = auth.uid())
  ));

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_pharmacy_inventory_hospital ON pharmacy_inventory(hospital_id);
CREATE INDEX IF NOT EXISTS idx_pharmacy_inventory_medication ON pharmacy_inventory(medication_id);
CREATE INDEX IF NOT EXISTS idx_pharmacy_inventory_expiry ON pharmacy_inventory(expiry_date);
CREATE INDEX IF NOT EXISTS idx_pharmacy_transactions_hospital ON pharmacy_transactions(hospital_id);
CREATE INDEX IF NOT EXISTS idx_pharmacy_transactions_date ON pharmacy_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_lab_tests_hospital ON lab_tests(hospital_id);
CREATE INDEX IF NOT EXISTS idx_lab_orders_hospital ON lab_orders(hospital_id);
CREATE INDEX IF NOT EXISTS idx_lab_orders_patient ON lab_orders(patient_id);
CREATE INDEX IF NOT EXISTS idx_lab_orders_date ON lab_orders(order_date);
CREATE INDEX IF NOT EXISTS idx_lab_order_items_order ON lab_order_items(order_id);
