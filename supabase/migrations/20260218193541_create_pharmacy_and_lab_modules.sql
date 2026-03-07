/*
  # Pharmacy and Laboratory Modules

  1. New Tables
    - `pharmacy_inventory` - Track medication stock levels by batch
      - `id` (uuid, primary key)
      - `hospital_id` (uuid, references hospitals)
      - `medication_id` (uuid, references medications)
      - `batch_number` (text)
      - `expiry_date` (date, not null)
      - `quantity_in_stock` (integer, default 0)
      - `reorder_level` (integer, default 10)
      - `supplier_name` (text)
      - `purchase_price` (numeric)
      - `selling_price` (numeric)
      - `last_updated` (timestamp)

    - `pharmacy_transactions` - Track all pharmacy transactions
      - `id` (uuid, primary key)
      - `hospital_id` (uuid)
      - `transaction_type` (text) - purchase, sale, return, wastage, adjustment
      - `medication_id` (uuid)
      - `batch_number` (text)
      - `quantity` (integer)
      - `unit_price` (numeric)
      - `total_amount` (numeric)
      - `patient_id` (uuid, optional)
      - `prescription_id` (uuid, optional)
      - `notes` (text)
      - `transaction_date` (timestamp)
      - `performed_by` (uuid)

    - `lab_tests` - Master list of available lab tests
      - `id` (uuid, primary key)
      - `hospital_id` (uuid)
      - `test_code` (text, unique per hospital)
      - `test_name` (text)
      - `test_category` (text) - Hematology, Biochemistry, etc.
      - `test_price` (numeric)
      - `sample_type` (text) - Blood, Urine, etc.
      - `normal_range` (text)
      - `turnaround_time_hours` (integer)
      - `is_active` (boolean)

    - `lab_orders` - Lab test orders
      - `id` (uuid, primary key)
      - `hospital_id` (uuid)
      - `order_number` (text, unique)
      - `patient_id` (uuid)
      - `doctor_id` (uuid)
      - `order_date` (timestamp)
      - `priority` (text) - routine, urgent, stat
      - `clinical_notes` (text)
      - `status` (text) - pending, sample_collected, processing, completed, cancelled
      - `sample_collected_at` (timestamp)
      - `sample_collected_by` (uuid)
      - `reported_at` (timestamp)
      - `reported_by` (uuid)

    - `lab_order_items` - Individual tests within an order
      - `id` (uuid, primary key)
      - `order_id` (uuid)
      - `test_id` (uuid)
      - `result_value` (text)
      - `result_unit` (text)
      - `normal_range` (text)
      - `is_abnormal` (boolean)
      - `remarks` (text)
      - `status` (text)

  2. Security
    - Enable RLS on all tables
    - Create policies for authenticated hospital staff

  3. Seed Data
    - Sample lab tests for common categories
*/

-- Pharmacy Inventory
CREATE TABLE IF NOT EXISTS pharmacy_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  medication_id UUID NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
  batch_number TEXT NOT NULL,
  expiry_date DATE NOT NULL,
  quantity_in_stock INTEGER NOT NULL DEFAULT 0 CHECK (quantity_in_stock >= 0),
  reorder_level INTEGER NOT NULL DEFAULT 10 CHECK (reorder_level >= 0),
  supplier_name TEXT,
  purchase_price NUMERIC(10,2) DEFAULT 0 CHECK (purchase_price >= 0),
  selling_price NUMERIC(10,2) DEFAULT 0 CHECK (selling_price >= 0),
  last_updated TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(hospital_id, medication_id, batch_number)
);

-- Pharmacy Transactions
CREATE TABLE IF NOT EXISTS pharmacy_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('purchase', 'sale', 'return', 'wastage', 'adjustment')),
  medication_id UUID NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
  batch_number TEXT,
  quantity INTEGER NOT NULL CHECK (quantity != 0),
  unit_price NUMERIC(10,2) DEFAULT 0,
  total_amount NUMERIC(10,2) DEFAULT 0,
  patient_id UUID REFERENCES patients(id),
  prescription_id UUID REFERENCES prescriptions(id),
  notes TEXT,
  transaction_date TIMESTAMPTZ DEFAULT now(),
  performed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Lab Tests Master
CREATE TABLE IF NOT EXISTS lab_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  test_code TEXT NOT NULL,
  test_name TEXT NOT NULL,
  test_category TEXT NOT NULL DEFAULT 'General',
  test_price NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (test_price >= 0),
  sample_type TEXT NOT NULL DEFAULT 'Blood',
  normal_range TEXT,
  turnaround_time_hours INTEGER DEFAULT 24,
  instructions TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(hospital_id, test_code)
);

-- Lab Orders
CREATE TABLE IF NOT EXISTS lab_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  order_number TEXT NOT NULL,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES profiles(id),
  order_date TIMESTAMPTZ DEFAULT now(),
  priority TEXT NOT NULL DEFAULT 'routine' CHECK (priority IN ('routine', 'urgent', 'stat')),
  clinical_notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sample_collected', 'processing', 'completed', 'cancelled')),
  sample_collected_at TIMESTAMPTZ,
  sample_collected_by UUID REFERENCES auth.users(id),
  reported_at TIMESTAMPTZ,
  reported_by UUID REFERENCES auth.users(id),
  total_amount NUMERIC(10,2) DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(hospital_id, order_number)
);

-- Lab Order Items
CREATE TABLE IF NOT EXISTS lab_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES lab_orders(id) ON DELETE CASCADE,
  test_id UUID NOT NULL REFERENCES lab_tests(id) ON DELETE CASCADE,
  test_name TEXT NOT NULL,
  test_price NUMERIC(10,2) DEFAULT 0,
  result_value TEXT,
  result_unit TEXT,
  normal_range TEXT,
  is_abnormal BOOLEAN DEFAULT false,
  remarks TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed')),
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE pharmacy_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacy_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_order_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pharmacy_inventory
CREATE POLICY "Hospital staff can view pharmacy inventory"
  ON pharmacy_inventory FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.hospital_id = pharmacy_inventory.hospital_id
    )
  );

CREATE POLICY "Hospital staff can manage pharmacy inventory"
  ON pharmacy_inventory FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.hospital_id = pharmacy_inventory.hospital_id
    )
  );

CREATE POLICY "Hospital staff can update pharmacy inventory"
  ON pharmacy_inventory FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.hospital_id = pharmacy_inventory.hospital_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.hospital_id = pharmacy_inventory.hospital_id
    )
  );

CREATE POLICY "Hospital staff can delete pharmacy inventory"
  ON pharmacy_inventory FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.hospital_id = pharmacy_inventory.hospital_id
    )
  );

-- RLS Policies for pharmacy_transactions
CREATE POLICY "Hospital staff can view pharmacy transactions"
  ON pharmacy_transactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.hospital_id = pharmacy_transactions.hospital_id
    )
  );

CREATE POLICY "Hospital staff can insert pharmacy transactions"
  ON pharmacy_transactions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.hospital_id = pharmacy_transactions.hospital_id
    )
  );

-- RLS Policies for lab_tests
CREATE POLICY "Hospital staff can view lab tests"
  ON lab_tests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.hospital_id = lab_tests.hospital_id
    )
  );

CREATE POLICY "Hospital staff can manage lab tests"
  ON lab_tests FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.hospital_id = lab_tests.hospital_id
    )
  );

CREATE POLICY "Hospital staff can update lab tests"
  ON lab_tests FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.hospital_id = lab_tests.hospital_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.hospital_id = lab_tests.hospital_id
    )
  );

-- RLS Policies for lab_orders
CREATE POLICY "Hospital staff can view lab orders"
  ON lab_orders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.hospital_id = lab_orders.hospital_id
    )
  );

CREATE POLICY "Hospital staff can create lab orders"
  ON lab_orders FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.hospital_id = lab_orders.hospital_id
    )
  );

CREATE POLICY "Hospital staff can update lab orders"
  ON lab_orders FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.hospital_id = lab_orders.hospital_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.hospital_id = lab_orders.hospital_id
    )
  );

-- RLS Policies for lab_order_items
CREATE POLICY "Hospital staff can view lab order items"
  ON lab_order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM lab_orders lo
      JOIN profiles p ON p.hospital_id = lo.hospital_id
      WHERE lo.id = lab_order_items.order_id
      AND p.id = auth.uid()
    )
  );

CREATE POLICY "Hospital staff can manage lab order items"
  ON lab_order_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM lab_orders lo
      JOIN profiles p ON p.hospital_id = lo.hospital_id
      WHERE lo.id = lab_order_items.order_id
      AND p.id = auth.uid()
    )
  );

CREATE POLICY "Hospital staff can update lab order items"
  ON lab_order_items FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM lab_orders lo
      JOIN profiles p ON p.hospital_id = lo.hospital_id
      WHERE lo.id = lab_order_items.order_id
      AND p.id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM lab_orders lo
      JOIN profiles p ON p.hospital_id = lo.hospital_id
      WHERE lo.id = lab_order_items.order_id
      AND p.id = auth.uid()
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_pharmacy_inventory_hospital ON pharmacy_inventory(hospital_id);
CREATE INDEX IF NOT EXISTS idx_pharmacy_inventory_medication ON pharmacy_inventory(medication_id);
CREATE INDEX IF NOT EXISTS idx_pharmacy_inventory_expiry ON pharmacy_inventory(expiry_date);
CREATE INDEX IF NOT EXISTS idx_pharmacy_transactions_hospital ON pharmacy_transactions(hospital_id);
CREATE INDEX IF NOT EXISTS idx_pharmacy_transactions_date ON pharmacy_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_lab_tests_hospital ON lab_tests(hospital_id);
CREATE INDEX IF NOT EXISTS idx_lab_tests_category ON lab_tests(test_category);
CREATE INDEX IF NOT EXISTS idx_lab_orders_hospital ON lab_orders(hospital_id);
CREATE INDEX IF NOT EXISTS idx_lab_orders_patient ON lab_orders(patient_id);
CREATE INDEX IF NOT EXISTS idx_lab_orders_status ON lab_orders(status);
CREATE INDEX IF NOT EXISTS idx_lab_orders_date ON lab_orders(order_date);
CREATE INDEX IF NOT EXISTS idx_lab_order_items_order ON lab_order_items(order_id);

-- Seed lab tests
INSERT INTO lab_tests (hospital_id, test_code, test_name, test_category, test_price, sample_type, normal_range, turnaround_time_hours)
SELECT 
  h.id,
  t.test_code,
  t.test_name,
  t.test_category,
  t.test_price,
  t.sample_type,
  t.normal_range,
  t.turnaround_time_hours
FROM hospitals h
CROSS JOIN (VALUES
  ('CBC', 'Complete Blood Count', 'Hematology', 500, 'Blood', 'WBC: 4000-11000/uL, RBC: 4.5-5.5 M/uL, Hb: 13-17 g/dL, Platelets: 150000-400000/uL', 4),
  ('HB', 'Hemoglobin', 'Hematology', 150, 'Blood', 'Male: 13-17 g/dL, Female: 12-16 g/dL', 2),
  ('ESR', 'Erythrocyte Sedimentation Rate', 'Hematology', 100, 'Blood', 'Male: 0-15 mm/hr, Female: 0-20 mm/hr', 2),
  ('BT-CT', 'Bleeding Time & Clotting Time', 'Hematology', 200, 'Blood', 'BT: 2-7 min, CT: 4-9 min', 1),
  ('PT-INR', 'Prothrombin Time with INR', 'Hematology', 400, 'Blood', 'PT: 11-13.5 sec, INR: 0.8-1.2', 4),
  ('FBS', 'Fasting Blood Sugar', 'Biochemistry', 100, 'Blood', '70-100 mg/dL', 2),
  ('PPBS', 'Post Prandial Blood Sugar', 'Biochemistry', 100, 'Blood', '<140 mg/dL', 2),
  ('RBS', 'Random Blood Sugar', 'Biochemistry', 100, 'Blood', '70-140 mg/dL', 1),
  ('HBA1C', 'Glycated Hemoglobin', 'Biochemistry', 600, 'Blood', '4.0-5.6% (Normal), 5.7-6.4% (Prediabetes)', 24),
  ('LFT', 'Liver Function Test', 'Biochemistry', 800, 'Blood', 'Bilirubin: 0.1-1.2 mg/dL, SGPT: 7-56 U/L, SGOT: 10-40 U/L', 6),
  ('RFT', 'Renal Function Test', 'Biochemistry', 700, 'Blood', 'Urea: 7-20 mg/dL, Creatinine: 0.6-1.2 mg/dL, Uric Acid: 3.5-7.2 mg/dL', 6),
  ('LIPID', 'Lipid Profile', 'Biochemistry', 600, 'Blood', 'Total Cholesterol: <200, LDL: <100, HDL: >40, Triglycerides: <150 mg/dL', 6),
  ('TFT', 'Thyroid Function Test', 'Biochemistry', 800, 'Blood', 'TSH: 0.4-4.0 mIU/L, T3: 80-200 ng/dL, T4: 5-12 ug/dL', 24),
  ('URINE', 'Urine Routine & Microscopy', 'Clinical Pathology', 150, 'Urine', 'pH: 4.5-8.0, Specific Gravity: 1.005-1.030', 2),
  ('STOOL', 'Stool Routine & Microscopy', 'Clinical Pathology', 150, 'Stool', 'No ova, cyst, or parasites', 2),
  ('WIDAL', 'Widal Test', 'Serology', 300, 'Blood', 'Negative (<1:80)', 4),
  ('DENGUE', 'Dengue NS1 Antigen', 'Serology', 800, 'Blood', 'Negative', 2),
  ('MALARIA', 'Malaria Parasite (MP)', 'Microbiology', 200, 'Blood', 'Not detected', 2),
  ('COVID-RTPCR', 'COVID-19 RT-PCR', 'Molecular', 500, 'Nasal Swab', 'Not detected', 24),
  ('XRAY-CHEST', 'X-Ray Chest PA View', 'Radiology', 400, 'N/A', 'Normal study', 2),
  ('USG-ABDOMEN', 'USG Whole Abdomen', 'Radiology', 1200, 'N/A', 'Normal study', 1),
  ('ECG', 'Electrocardiogram', 'Cardiology', 300, 'N/A', 'Normal sinus rhythm', 1)
) AS t(test_code, test_name, test_category, test_price, sample_type, normal_range, turnaround_time_hours)
ON CONFLICT (hospital_id, test_code) DO NOTHING;
