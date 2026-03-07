/*
  # Pharmacy, Lab, Ambulance, and Emergency Tables

  ## New Tables

  ### pharmacy_inventory
  - Medication stock by batch with expiry tracking

  ### pharmacy_transactions
  - All pharmacy movements (purchase, sale, return, adjustment, dispensing)

  ### lab_tests
  - Master list of available lab tests with reference ranges

  ### lab_orders
  - Lab test orders per patient/appointment

  ### lab_order_items
  - Individual tests within an order

  ### ambulances
  - Ambulance fleet master with vehicle details

  ### ambulance_requests
  - Dispatch requests with location and assignment tracking

  ### emergency_cases
  - Emergency department case records with triage

  ### emergency_treatments
  - Treatment actions taken in emergency

  ## Security
  - RLS enabled on all tables
  - Hospital-scoped access
*/

-- ============================================================
-- PHARMACY INVENTORY TABLE
-- ============================================================
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

-- ============================================================
-- PHARMACY TRANSACTIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS pharmacy_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id uuid REFERENCES hospitals(id),
  inventory_id uuid REFERENCES pharmacy_inventory(id),
  medication_name text NOT NULL,
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

-- ============================================================
-- LAB TESTS MASTER TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS lab_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id uuid REFERENCES hospitals(id),
  name text NOT NULL,
  code text,
  category text DEFAULT 'general' CHECK (category IN ('haematology','biochemistry','microbiology','serology','urine','stool','histopathology','radiology','other')),
  sample_type text DEFAULT 'blood' CHECK (sample_type IN ('blood','urine','stool','sputum','swab','biopsy','csf','fluid','other')),
  tat_hours integer DEFAULT 24,
  price numeric DEFAULT 0,
  normal_range_male text,
  normal_range_female text,
  unit text,
  method text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE lab_tests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view lab tests"
  ON lab_tests FOR SELECT TO authenticated USING (true);

CREATE POLICY "Lab staff can insert lab tests"
  ON lab_tests FOR INSERT TO authenticated
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin','superadmin','lab_technician'));

CREATE POLICY "Lab staff can update lab tests"
  ON lab_tests FOR UPDATE TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin','superadmin','lab_technician'))
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin','superadmin','lab_technician'));

-- ============================================================
-- LAB ORDERS TABLE
-- ============================================================
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

-- ============================================================
-- LAB ORDER ITEMS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS lab_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES lab_orders(id) ON DELETE CASCADE,
  test_id uuid REFERENCES lab_tests(id),
  test_name text NOT NULL,
  test_code text,
  status text DEFAULT 'pending' CHECK (status IN ('pending','sample_collected','processing','completed','cancelled')),
  result_value text,
  result_unit text,
  normal_range text,
  is_abnormal boolean DEFAULT false,
  result_notes text,
  entered_by uuid REFERENCES profiles(id),
  entered_at timestamptz,
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

-- ============================================================
-- AMBULANCES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS ambulances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id uuid REFERENCES hospitals(id),
  vehicle_number text NOT NULL,
  vehicle_type text DEFAULT 'basic' CHECK (vehicle_type IN ('basic','advanced','neonatal','cardiac','icu_on_wheels','bike')),
  make_model text,
  year_of_manufacture integer,
  chassis_number text,
  insurance_expiry date,
  fitness_expiry date,
  gps_device_id text,
  driver_name text,
  driver_phone text,
  current_status text DEFAULT 'available' CHECK (current_status IN ('available','dispatched','at_scene','returning','maintenance','offline')),
  last_service_date date,
  equipment_list text,
  notes text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE ambulances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hospital staff can view ambulances"
  ON ambulances FOR SELECT TO authenticated
  USING (hospital_id = (SELECT hospital_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Admins can insert ambulances"
  ON ambulances FOR INSERT TO authenticated
  WITH CHECK (hospital_id = (SELECT hospital_id FROM profiles WHERE id = auth.uid())
    AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin','superadmin'));

CREATE POLICY "Staff can update ambulances"
  ON ambulances FOR UPDATE TO authenticated
  USING (hospital_id = (SELECT hospital_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (hospital_id = (SELECT hospital_id FROM profiles WHERE id = auth.uid()));

-- ============================================================
-- AMBULANCE REQUESTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS ambulance_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_number text,
  hospital_id uuid REFERENCES hospitals(id),
  patient_id uuid REFERENCES patients(id) ON DELETE SET NULL,
  patient_name text,
  patient_phone text,
  pickup_address text NOT NULL,
  pickup_landmark text,
  pickup_latitude numeric,
  pickup_longitude numeric,
  destination text,
  request_type text DEFAULT 'emergency' CHECK (request_type IN ('emergency','scheduled','inter_facility_transfer','discharge')),
  priority text DEFAULT 'high' CHECK (priority IN ('low','medium','high','critical')),
  ambulance_id uuid REFERENCES ambulances(id) ON DELETE SET NULL,
  driver_name text,
  driver_phone text,
  status text DEFAULT 'pending' CHECK (status IN ('pending','assigned','dispatched','at_scene','transporting','completed','cancelled')),
  dispatched_at timestamptz,
  arrived_at_scene_at timestamptz,
  arrived_at_destination_at timestamptz,
  completed_at timestamptz,
  distance_km numeric,
  fare numeric DEFAULT 0,
  notes text,
  requested_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE ambulance_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hospital staff can view ambulance requests"
  ON ambulance_requests FOR SELECT TO authenticated
  USING (hospital_id = (SELECT hospital_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Hospital staff can insert ambulance requests"
  ON ambulance_requests FOR INSERT TO authenticated
  WITH CHECK (hospital_id = (SELECT hospital_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Hospital staff can update ambulance requests"
  ON ambulance_requests FOR UPDATE TO authenticated
  USING (hospital_id = (SELECT hospital_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (hospital_id = (SELECT hospital_id FROM profiles WHERE id = auth.uid()));

-- ============================================================
-- EMERGENCY CASES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS emergency_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_number text NOT NULL,
  hospital_id uuid REFERENCES hospitals(id),
  patient_id uuid REFERENCES patients(id) ON DELETE SET NULL,
  patient_name text,
  patient_age integer,
  patient_gender text,
  patient_phone text,
  arrival_mode text DEFAULT 'walk_in' CHECK (arrival_mode IN ('walk_in','ambulance','referred','police','brought_dead','other')),
  arrival_time timestamptz DEFAULT now(),
  chief_complaint text NOT NULL,
  triage_category text DEFAULT 'yellow' CHECK (triage_category IN ('red','orange','yellow','green','black')),
  triage_time timestamptz,
  triaged_by uuid REFERENCES profiles(id),
  attending_doctor_id uuid REFERENCES profiles(id),
  vital_signs jsonb,
  gcs_score integer,
  mlc_case boolean DEFAULT false,
  mlc_number text,
  referral_hospital text,
  referral_notes text,
  disposition text CHECK (disposition IN ('admitted','discharged','transferred','absconded','death','lwbs','observation')),
  disposition_time timestamptz,
  diagnosis text,
  treatment_summary text,
  status text DEFAULT 'active' CHECK (status IN ('active','observation','admitted','discharged','transferred','death','closed')),
  notes text,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE emergency_cases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hospital staff can view emergency cases"
  ON emergency_cases FOR SELECT TO authenticated
  USING (hospital_id = (SELECT hospital_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Hospital staff can insert emergency cases"
  ON emergency_cases FOR INSERT TO authenticated
  WITH CHECK (hospital_id = (SELECT hospital_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Hospital staff can update emergency cases"
  ON emergency_cases FOR UPDATE TO authenticated
  USING (hospital_id = (SELECT hospital_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (hospital_id = (SELECT hospital_id FROM profiles WHERE id = auth.uid()));

-- ============================================================
-- EMERGENCY TREATMENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS emergency_treatments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  emergency_case_id uuid REFERENCES emergency_cases(id) ON DELETE CASCADE,
  treatment_type text DEFAULT 'medication' CHECK (treatment_type IN ('medication','procedure','iv_fluid','oxygen','monitoring','investigation','other')),
  description text NOT NULL,
  dosage text,
  route text,
  given_at timestamptz DEFAULT now(),
  given_by uuid REFERENCES profiles(id),
  response text,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE emergency_treatments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hospital staff can view emergency treatments"
  ON emergency_treatments FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM emergency_cases ec
    WHERE ec.id = emergency_treatments.emergency_case_id
    AND ec.hospital_id = (SELECT hospital_id FROM profiles WHERE id = auth.uid())
  ));

CREATE POLICY "Clinical staff can insert emergency treatments"
  ON emergency_treatments FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM emergency_cases ec
    WHERE ec.id = emergency_treatments.emergency_case_id
    AND ec.hospital_id = (SELECT hospital_id FROM profiles WHERE id = auth.uid())
  ));

-- ============================================================
-- INDEXES
-- ============================================================
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
CREATE INDEX IF NOT EXISTS idx_ambulances_hospital ON ambulances(hospital_id);
CREATE INDEX IF NOT EXISTS idx_ambulance_requests_hospital ON ambulance_requests(hospital_id);
CREATE INDEX IF NOT EXISTS idx_emergency_cases_hospital ON emergency_cases(hospital_id);
CREATE INDEX IF NOT EXISTS idx_emergency_cases_status ON emergency_cases(status);
CREATE INDEX IF NOT EXISTS idx_emergency_cases_arrival ON emergency_cases(arrival_time);

-- ============================================================
-- SEED: LAB TESTS (common tests with reference ranges)
-- ============================================================
INSERT INTO lab_tests (name, code, category, sample_type, tat_hours, price, normal_range_male, normal_range_female, unit, method) VALUES
-- Haematology
('Complete Blood Count', 'CBC', 'haematology', 'blood', 4, 250, 'See individual parameters', 'See individual parameters', '-', 'Automated'),
('Haemoglobin', 'HB', 'haematology', 'blood', 2, 80, '13.5-17.5', '12.0-15.5', 'g/dL', 'Automated'),
('White Blood Cell Count', 'WBC', 'haematology', 'blood', 2, 80, '4.5-11.0', '4.5-11.0', '×10³/μL', 'Automated'),
('Platelet Count', 'PLT', 'haematology', 'blood', 2, 80, '150-400', '150-400', '×10³/μL', 'Automated'),
('ESR', 'ESR', 'haematology', 'blood', 2, 100, '0-15', '0-20', 'mm/hr', 'Westergren'),
('Peripheral Smear', 'PS', 'haematology', 'blood', 6, 150, '-', '-', '-', 'Microscopy'),
-- Biochemistry
('Blood Glucose — Fasting', 'FBS', 'biochemistry', 'blood', 2, 80, '70-100', '70-100', 'mg/dL', 'GOD-POD'),
('Blood Glucose — Random', 'RBS', 'biochemistry', 'blood', 2, 80, '<140', '<140', 'mg/dL', 'GOD-POD'),
('Blood Glucose — Post Prandial', 'PPBS', 'biochemistry', 'blood', 2, 80, '<140', '<140', 'mg/dL', 'GOD-POD'),
('HbA1c', 'HBA1C', 'biochemistry', 'blood', 6, 350, '<5.7', '<5.7', '%', 'HPLC'),
('Urea', 'UREA', 'biochemistry', 'blood', 3, 100, '15-45', '15-45', 'mg/dL', 'Urease-GLDH'),
('Creatinine', 'CREAT', 'biochemistry', 'blood', 3, 100, '0.7-1.2', '0.5-1.0', 'mg/dL', 'Jaffe'),
('Uric Acid', 'UA', 'biochemistry', 'blood', 3, 120, '3.5-7.2', '2.6-6.0', 'mg/dL', 'Uricase'),
('Sodium', 'NA', 'biochemistry', 'blood', 2, 100, '136-145', '136-145', 'mEq/L', 'ISE'),
('Potassium', 'K', 'biochemistry', 'blood', 2, 100, '3.5-5.1', '3.5-5.1', 'mEq/L', 'ISE'),
('Chloride', 'CL', 'biochemistry', 'blood', 2, 100, '98-107', '98-107', 'mEq/L', 'ISE'),
('Total Protein', 'TP', 'biochemistry', 'blood', 3, 120, '6.3-8.2', '6.3-8.2', 'g/dL', 'Biuret'),
('Albumin', 'ALB', 'biochemistry', 'blood', 3, 100, '3.5-5.0', '3.5-5.0', 'g/dL', 'BCG'),
('Total Bilirubin', 'TBIL', 'biochemistry', 'blood', 3, 120, '0.3-1.2', '0.3-1.2', 'mg/dL', 'Diazo'),
('Direct Bilirubin', 'DBIL', 'biochemistry', 'blood', 3, 120, '<0.3', '<0.3', 'mg/dL', 'Diazo'),
('SGOT (AST)', 'SGOT', 'biochemistry', 'blood', 3, 120, '10-40', '10-35', 'IU/L', 'UV-IFCC'),
('SGPT (ALT)', 'SGPT', 'biochemistry', 'blood', 3, 120, '10-40', '7-35', 'IU/L', 'UV-IFCC'),
('Alkaline Phosphatase', 'ALP', 'biochemistry', 'blood', 3, 120, '44-147', '44-147', 'IU/L', 'PNPP'),
('Calcium', 'CA', 'biochemistry', 'blood', 3, 100, '8.5-10.2', '8.5-10.2', 'mg/dL', 'Arsenazo III'),
('Phosphorus', 'PHOS', 'biochemistry', 'blood', 3, 100, '2.5-4.5', '2.5-4.5', 'mg/dL', 'UV'),
('Total Cholesterol', 'CHOL', 'biochemistry', 'blood', 3, 120, '<200', '<200', 'mg/dL', 'CHODPAPs'),
('Triglycerides', 'TG', 'biochemistry', 'blood', 3, 120, '<150', '<150', 'mg/dL', 'GPO-POD'),
('HDL Cholesterol', 'HDL', 'biochemistry', 'blood', 3, 120, '>40', '>50', 'mg/dL', 'Direct'),
('LDL Cholesterol', 'LDL', 'biochemistry', 'blood', 3, 120, '<100', '<100', 'mg/dL', 'Friedewald'),
-- Thyroid
('TSH', 'TSH', 'biochemistry', 'blood', 6, 300, '0.4-4.0', '0.4-4.0', 'mIU/L', 'CLIA'),
('T3 Total', 'T3', 'biochemistry', 'blood', 6, 250, '80-200', '80-200', 'ng/dL', 'CLIA'),
('T4 Total', 'T4', 'biochemistry', 'blood', 6, 250, '5.0-12.0', '5.0-12.0', 'μg/dL', 'CLIA'),
-- Serology
('Typhidot IgM/IgG', 'TYPH', 'serology', 'blood', 4, 350, 'Non-reactive', 'Non-reactive', '-', 'ICT'),
('Dengue NS1 Antigen', 'DGNS1', 'serology', 'blood', 4, 500, 'Negative', 'Negative', '-', 'ELISA'),
('Dengue IgM/IgG', 'DGIG', 'serology', 'blood', 4, 500, 'Non-reactive', 'Non-reactive', '-', 'ELISA'),
('Malaria Antigen Test', 'MAL', 'serology', 'blood', 2, 300, 'Negative', 'Negative', '-', 'RDT'),
('HBsAg', 'HBSAG', 'serology', 'blood', 4, 300, 'Non-reactive', 'Non-reactive', '-', 'ELISA'),
('Anti-HCV', 'HCV', 'serology', 'blood', 4, 400, 'Non-reactive', 'Non-reactive', '-', 'ELISA'),
('HIV 1+2', 'HIV', 'serology', 'blood', 4, 400, 'Non-reactive', 'Non-reactive', '-', 'ELISA'),
('VDRL', 'VDRL', 'serology', 'blood', 4, 200, 'Non-reactive', 'Non-reactive', '-', 'RPR'),
('Widal Test', 'WIDAL', 'serology', 'blood', 6, 250, '<1:40', '<1:40', '-', 'Slide'),
-- Urine
('Urine Routine & Microscopy', 'UR', 'urine', 'urine', 2, 100, 'See parameters', 'See parameters', '-', 'Microscopy'),
('Urine Culture & Sensitivity', 'UCx', 'urine', 'urine', 48, 500, 'No growth', 'No growth', '-', 'Culture'),
('Urine Pregnancy Test', 'UPT', 'urine', 'urine', 1, 100, '-', 'Negative', '-', 'ICT'),
-- Stool
('Stool Routine & Microscopy', 'SR', 'stool', 'stool', 4, 100, 'No parasites', 'No parasites', '-', 'Microscopy'),
-- Other
('Blood Culture & Sensitivity', 'BCx', 'microbiology', 'blood', 72, 700, 'No growth', 'No growth', '-', 'Automated'),
('Throat Swab Culture', 'TSCx', 'microbiology', 'swab', 48, 500, 'Normal flora', 'Normal flora', '-', 'Culture'),
('Prothrombin Time (PT/INR)', 'PTINR', 'haematology', 'blood', 4, 250, '11-13.5 sec / 0.8-1.1', '11-13.5 sec / 0.8-1.1', 'sec / ratio', 'Photo'),
('APTT', 'APTT', 'haematology', 'blood', 4, 250, '25-35', '25-35', 'sec', 'Photo'),
('D-Dimer', 'DDIM', 'haematology', 'blood', 6, 800, '<0.5', '<0.5', 'mg/L', 'ELISA'),
('Troponin I', 'TROPI', 'biochemistry', 'blood', 3, 800, '<0.04', '<0.04', 'ng/mL', 'CLIA'),
('CRP (C-Reactive Protein)', 'CRP', 'biochemistry', 'blood', 4, 300, '<5', '<5', 'mg/L', 'Nephelometry'),
('Procalcitonin', 'PCT', 'biochemistry', 'blood', 6, 1200, '<0.1', '<0.1', 'ng/mL', 'CLIA'),
('Ferritin', 'FERR', 'biochemistry', 'blood', 6, 500, '12-300', '12-150', 'ng/mL', 'CLIA'),
('Vitamin D (25-OH)', 'VITD', 'biochemistry', 'blood', 24, 800, '30-100', '30-100', 'ng/mL', 'CLIA'),
('Vitamin B12', 'B12', 'biochemistry', 'blood', 24, 600, '200-900', '200-900', 'pg/mL', 'CLIA')
ON CONFLICT DO NOTHING;
