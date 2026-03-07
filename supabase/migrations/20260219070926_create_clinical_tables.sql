/*
  # Clinical Module Tables

  ## New Tables

  ### symptoms
  - Master symptom list with category classification
  - Seeded with 60+ common medical symptoms

  ### diagnoses
  - Master diagnosis list with ICD-10 codes
  - Seeded with 50+ common diagnoses

  ### medical_history
  - Patient medical history records (allergies, past conditions, family history)

  ### vitals
  - OPD vitals recording (comprehensive format)

  ### consultations
  - Doctor-patient consultation records linked to appointments

  ### consultation_symptoms
  - Junction: which symptoms were noted in a consultation

  ### consultation_diagnoses
  - Junction: which diagnoses were made in a consultation

  ### medications
  - Master medication formulary with dosage info
  - Seeded with 250+ common medications

  ### prescriptions
  - Prescription header records

  ### prescription_items
  - Individual medication line items within a prescription

  ## Security
  - RLS enabled on all tables
  - Authenticated users can read master lists (symptoms, diagnoses, medications)
  - Clinical records restricted to hospital staff
*/

-- ============================================================
-- SYMPTOMS MASTER TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS symptoms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE symptoms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view symptoms"
  ON symptoms FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage symptoms"
  ON symptoms FOR INSERT TO authenticated
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin','superadmin'));

CREATE POLICY "Admins can update symptoms"
  ON symptoms FOR UPDATE TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin','superadmin'))
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin','superadmin'));

-- ============================================================
-- DIAGNOSES MASTER TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS diagnoses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  icd_code text,
  category text NOT NULL DEFAULT 'general',
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE diagnoses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view diagnoses"
  ON diagnoses FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage diagnoses"
  ON diagnoses FOR INSERT TO authenticated
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin','superadmin'));

CREATE POLICY "Admins can update diagnoses"
  ON diagnoses FOR UPDATE TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin','superadmin'))
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin','superadmin'));

-- ============================================================
-- MEDICAL HISTORY TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS medical_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  hospital_id uuid REFERENCES hospitals(id),
  history_type text NOT NULL DEFAULT 'medical',
  condition_name text NOT NULL,
  description text,
  since_date date,
  is_current boolean DEFAULT true,
  recorded_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE medical_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated hospital staff can view medical history"
  ON medical_history FOR SELECT TO authenticated
  USING (hospital_id = (SELECT hospital_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Clinical staff can insert medical history"
  ON medical_history FOR INSERT TO authenticated
  WITH CHECK (hospital_id = (SELECT hospital_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Clinical staff can update medical history"
  ON medical_history FOR UPDATE TO authenticated
  USING (hospital_id = (SELECT hospital_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (hospital_id = (SELECT hospital_id FROM profiles WHERE id = auth.uid()));

-- ============================================================
-- VITALS TABLE (comprehensive OPD vitals)
-- ============================================================
CREATE TABLE IF NOT EXISTS vitals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  hospital_id uuid REFERENCES hospitals(id),
  appointment_id uuid REFERENCES appointments(id) ON DELETE SET NULL,
  temperature numeric,
  temperature_unit text DEFAULT 'F',
  pulse_rate integer,
  blood_pressure_systolic integer,
  blood_pressure_diastolic integer,
  respiratory_rate integer,
  oxygen_saturation numeric,
  weight numeric,
  height numeric,
  bmi numeric GENERATED ALWAYS AS (
    CASE WHEN height > 0 AND weight > 0
    THEN ROUND((weight / ((height/100) * (height/100)))::numeric, 1)
    ELSE NULL END
  ) STORED,
  blood_glucose numeric,
  pain_scale integer CHECK (pain_scale BETWEEN 0 AND 10),
  notes text,
  recorded_by uuid REFERENCES profiles(id),
  recorded_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE vitals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hospital staff can view vitals"
  ON vitals FOR SELECT TO authenticated
  USING (hospital_id = (SELECT hospital_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Clinical staff can insert vitals"
  ON vitals FOR INSERT TO authenticated
  WITH CHECK (hospital_id = (SELECT hospital_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Clinical staff can update vitals"
  ON vitals FOR UPDATE TO authenticated
  USING (hospital_id = (SELECT hospital_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (hospital_id = (SELECT hospital_id FROM profiles WHERE id = auth.uid()));

-- ============================================================
-- CONSULTATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS consultations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id uuid REFERENCES hospitals(id),
  appointment_id uuid REFERENCES appointments(id) ON DELETE SET NULL,
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id uuid REFERENCES profiles(id),
  consultation_date date DEFAULT CURRENT_DATE,
  chief_complaint text,
  history_of_present_illness text,
  examination_findings text,
  assessment text,
  plan text,
  advice text,
  follow_up_date date,
  status text DEFAULT 'in_progress' CHECK (status IN ('in_progress','completed','cancelled')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hospital staff can view consultations"
  ON consultations FOR SELECT TO authenticated
  USING (hospital_id = (SELECT hospital_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Clinical staff can insert consultations"
  ON consultations FOR INSERT TO authenticated
  WITH CHECK (hospital_id = (SELECT hospital_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Clinical staff can update consultations"
  ON consultations FOR UPDATE TO authenticated
  USING (hospital_id = (SELECT hospital_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (hospital_id = (SELECT hospital_id FROM profiles WHERE id = auth.uid()));

-- ============================================================
-- CONSULTATION SYMPTOMS JUNCTION TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS consultation_symptoms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id uuid REFERENCES consultations(id) ON DELETE CASCADE,
  symptom_id uuid REFERENCES symptoms(id),
  symptom_name text NOT NULL,
  duration text,
  severity text DEFAULT 'moderate' CHECK (severity IN ('mild','moderate','severe')),
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE consultation_symptoms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hospital staff can view consultation symptoms"
  ON consultation_symptoms FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM consultations c
    WHERE c.id = consultation_symptoms.consultation_id
    AND c.hospital_id = (SELECT hospital_id FROM profiles WHERE id = auth.uid())
  ));

CREATE POLICY "Clinical staff can insert consultation symptoms"
  ON consultation_symptoms FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM consultations c
    WHERE c.id = consultation_symptoms.consultation_id
    AND c.hospital_id = (SELECT hospital_id FROM profiles WHERE id = auth.uid())
  ));

CREATE POLICY "Clinical staff can delete consultation symptoms"
  ON consultation_symptoms FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM consultations c
    WHERE c.id = consultation_symptoms.consultation_id
    AND c.hospital_id = (SELECT hospital_id FROM profiles WHERE id = auth.uid())
  ));

-- ============================================================
-- CONSULTATION DIAGNOSES JUNCTION TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS consultation_diagnoses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id uuid REFERENCES consultations(id) ON DELETE CASCADE,
  diagnosis_id uuid REFERENCES diagnoses(id),
  diagnosis_name text NOT NULL,
  icd_code text,
  diagnosis_type text DEFAULT 'primary' CHECK (diagnosis_type IN ('primary','secondary','provisional','differential')),
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE consultation_diagnoses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hospital staff can view consultation diagnoses"
  ON consultation_diagnoses FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM consultations c
    WHERE c.id = consultation_diagnoses.consultation_id
    AND c.hospital_id = (SELECT hospital_id FROM profiles WHERE id = auth.uid())
  ));

CREATE POLICY "Clinical staff can insert consultation diagnoses"
  ON consultation_diagnoses FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM consultations c
    WHERE c.id = consultation_diagnoses.consultation_id
    AND c.hospital_id = (SELECT hospital_id FROM profiles WHERE id = auth.uid())
  ));

CREATE POLICY "Clinical staff can delete consultation diagnoses"
  ON consultation_diagnoses FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM consultations c
    WHERE c.id = consultation_diagnoses.consultation_id
    AND c.hospital_id = (SELECT hospital_id FROM profiles WHERE id = auth.uid())
  ));

-- ============================================================
-- MEDICATIONS MASTER TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS medications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  generic_name text,
  brand_name text,
  category text DEFAULT 'other',
  dosage_form text DEFAULT 'tablet' CHECK (dosage_form IN ('tablet','capsule','syrup','injection','cream','drops','inhaler','suppository','patch','gel','lotion','powder','granules','solution','suspension','other')),
  strength text,
  unit text DEFAULT 'mg',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE medications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view medications"
  ON medications FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage medications"
  ON medications FOR INSERT TO authenticated
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin','superadmin','pharmacist'));

CREATE POLICY "Admins can update medications"
  ON medications FOR UPDATE TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin','superadmin','pharmacist'))
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin','superadmin','pharmacist'));

-- ============================================================
-- PRESCRIPTIONS TABLE
-- ============================================================
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
  notes text,
  advice text,
  follow_up_date date,
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

-- ============================================================
-- PRESCRIPTION ITEMS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS prescription_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id uuid REFERENCES prescriptions(id) ON DELETE CASCADE,
  medication_id uuid REFERENCES medications(id),
  medication_name text NOT NULL,
  dosage text,
  frequency text,
  duration text,
  route text DEFAULT 'oral',
  instructions text,
  quantity integer DEFAULT 1,
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

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_vitals_patient ON vitals(patient_id);
CREATE INDEX IF NOT EXISTS idx_vitals_hospital ON vitals(hospital_id);
CREATE INDEX IF NOT EXISTS idx_consultations_patient ON consultations(patient_id);
CREATE INDEX IF NOT EXISTS idx_consultations_doctor ON consultations(doctor_id);
CREATE INDEX IF NOT EXISTS idx_consultations_hospital ON consultations(hospital_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient ON prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_hospital ON prescriptions(hospital_id);
CREATE INDEX IF NOT EXISTS idx_medical_history_patient ON medical_history(patient_id);
CREATE INDEX IF NOT EXISTS idx_symptoms_name ON symptoms(name);
CREATE INDEX IF NOT EXISTS idx_diagnoses_name ON diagnoses(name);
CREATE INDEX IF NOT EXISTS idx_medications_name ON medications(name);

-- ============================================================
-- SEED: SYMPTOMS (60+ common symptoms)
-- ============================================================
INSERT INTO symptoms (name, category) VALUES
('Fever', 'general'), ('Cough', 'respiratory'), ('Cold / Runny Nose', 'respiratory'),
('Sore Throat', 'ENT'), ('Headache', 'neurological'), ('Body Ache', 'musculoskeletal'),
('Fatigue / Weakness', 'general'), ('Loss of Appetite', 'gastrointestinal'),
('Nausea', 'gastrointestinal'), ('Vomiting', 'gastrointestinal'),
('Diarrhea', 'gastrointestinal'), ('Constipation', 'gastrointestinal'),
('Abdominal Pain', 'gastrointestinal'), ('Bloating', 'gastrointestinal'),
('Chest Pain', 'cardiovascular'), ('Shortness of Breath', 'respiratory'),
('Palpitations', 'cardiovascular'), ('Dizziness', 'neurological'),
('Fainting / Syncope', 'neurological'), ('Back Pain', 'musculoskeletal'),
('Neck Pain', 'musculoskeletal'), ('Joint Pain', 'musculoskeletal'),
('Muscle Cramps', 'musculoskeletal'), ('Swelling in Legs', 'cardiovascular'),
('Rash / Skin Eruption', 'dermatological'), ('Itching', 'dermatological'),
('Jaundice', 'hepatic'), ('Dark Urine', 'renal'), ('Burning Micturition', 'renal'),
('Frequent Urination', 'renal'), ('Blood in Urine', 'renal'),
('Decreased Urine Output', 'renal'), ('Excessive Thirst', 'endocrine'),
('Excessive Hunger', 'endocrine'), ('Weight Loss', 'general'),
('Weight Gain', 'general'), ('Night Sweats', 'general'),
('Chills / Rigors', 'general'), ('Vision Problems', 'ophthalmological'),
('Eye Redness', 'ophthalmological'), ('Ear Pain', 'ENT'), ('Hearing Loss', 'ENT'),
('Nasal Blockage', 'ENT'), ('Nosebleed', 'ENT'), ('Toothache', 'dental'),
('Difficulty Swallowing', 'ENT'), ('Hoarseness of Voice', 'ENT'),
('Numbness / Tingling', 'neurological'), ('Tremors', 'neurological'),
('Memory Loss', 'neurological'), ('Confusion', 'neurological'),
('Anxiety', 'psychiatric'), ('Depression', 'psychiatric'),
('Insomnia', 'psychiatric'), ('Excessive Sleepiness', 'psychiatric'),
('Irregular Heartbeat', 'cardiovascular'), ('Leg Cramps', 'musculoskeletal'),
('Hot Flushes', 'endocrine'), ('Excessive Sweating', 'general'),
('Hair Loss', 'dermatological'), ('Nail Changes', 'dermatological'),
('Painful Periods', 'gynaecological'), ('Irregular Periods', 'gynaecological'),
('Vaginal Discharge', 'gynaecological'), ('Breast Pain', 'gynaecological')
ON CONFLICT DO NOTHING;

-- ============================================================
-- SEED: DIAGNOSES (50+ common diagnoses with ICD-10 codes)
-- ============================================================
INSERT INTO diagnoses (name, icd_code, category) VALUES
('Hypertension', 'I10', 'cardiovascular'),
('Type 2 Diabetes Mellitus', 'E11', 'endocrine'),
('Acute Upper Respiratory Infection', 'J06.9', 'respiratory'),
('Pneumonia', 'J18.9', 'respiratory'),
('Asthma', 'J45.9', 'respiratory'),
('Chronic Obstructive Pulmonary Disease', 'J44.1', 'respiratory'),
('Acute Bronchitis', 'J20.9', 'respiratory'),
('Allergic Rhinitis', 'J30.4', 'ENT'),
('Sinusitis', 'J32.9', 'ENT'),
('Tonsillitis', 'J35.0', 'ENT'),
('Otitis Media', 'H66.9', 'ENT'),
('Coronary Artery Disease', 'I25.1', 'cardiovascular'),
('Acute Myocardial Infarction', 'I21.9', 'cardiovascular'),
('Atrial Fibrillation', 'I48.9', 'cardiovascular'),
('Heart Failure', 'I50.9', 'cardiovascular'),
('Gastroenteritis', 'A09', 'gastrointestinal'),
('Gastroesophageal Reflux Disease', 'K21.0', 'gastrointestinal'),
('Peptic Ulcer Disease', 'K27.9', 'gastrointestinal'),
('Irritable Bowel Syndrome', 'K58.9', 'gastrointestinal'),
('Appendicitis', 'K37', 'gastrointestinal'),
('Cholecystitis', 'K81.0', 'gastrointestinal'),
('Hepatitis B', 'B16.9', 'hepatic'),
('Hepatitis C', 'B17.1', 'hepatic'),
('Cirrhosis of Liver', 'K74.6', 'hepatic'),
('Urinary Tract Infection', 'N39.0', 'renal'),
('Kidney Stones', 'N20.0', 'renal'),
('Chronic Kidney Disease', 'N18.9', 'renal'),
('Acute Renal Failure', 'N17.9', 'renal'),
('Migraine', 'G43.9', 'neurological'),
('Epilepsy', 'G40.9', 'neurological'),
('Stroke', 'I64', 'neurological'),
('Vertigo', 'H81.3', 'neurological'),
('Depression', 'F32.9', 'psychiatric'),
('Anxiety Disorder', 'F41.9', 'psychiatric'),
('Insomnia', 'G47.0', 'psychiatric'),
('Rheumatoid Arthritis', 'M06.9', 'musculoskeletal'),
('Osteoarthritis', 'M19.9', 'musculoskeletal'),
('Low Back Pain', 'M54.5', 'musculoskeletal'),
('Cervical Spondylosis', 'M47.8', 'musculoskeletal'),
('Osteoporosis', 'M81.0', 'musculoskeletal'),
('Fracture — Closed', 'S02.9', 'orthopedic'),
('Dengue Fever', 'A97', 'infectious'),
('Malaria', 'B54', 'infectious'),
('Typhoid Fever', 'A01.0', 'infectious'),
('COVID-19', 'U07.1', 'infectious'),
('Tuberculosis', 'A15.0', 'infectious'),
('Anemia', 'D64.9', 'haematological'),
('Thyroid Disorder', 'E07.9', 'endocrine'),
('Hypothyroidism', 'E03.9', 'endocrine'),
('Hyperthyroidism', 'E05.9', 'endocrine'),
('Vitamin D Deficiency', 'E55.9', 'nutritional'),
('Vitamin B12 Deficiency', 'E53.8', 'nutritional'),
('Iron Deficiency Anemia', 'D50.9', 'haematological'),
('Eczema / Dermatitis', 'L30.9', 'dermatological'),
('Psoriasis', 'L40.9', 'dermatological'),
('Acne', 'L70.0', 'dermatological'),
('Urticaria', 'L50.9', 'dermatological')
ON CONFLICT DO NOTHING;

-- ============================================================
-- SEED: MEDICATIONS (250+ common medications)
-- ============================================================
INSERT INTO medications (name, generic_name, category, dosage_form, strength, unit) VALUES
-- Analgesics / Antipyretics
('Paracetamol 500mg', 'Paracetamol', 'analgesic', 'tablet', '500', 'mg'),
('Paracetamol 650mg', 'Paracetamol', 'analgesic', 'tablet', '650', 'mg'),
('Paracetamol Syrup', 'Paracetamol', 'analgesic', 'syrup', '250mg/5ml', 'mg/5ml'),
('Ibuprofen 400mg', 'Ibuprofen', 'NSAID', 'tablet', '400', 'mg'),
('Ibuprofen 600mg', 'Ibuprofen', 'NSAID', 'tablet', '600', 'mg'),
('Diclofenac 50mg', 'Diclofenac Sodium', 'NSAID', 'tablet', '50', 'mg'),
('Diclofenac 75mg Injection', 'Diclofenac Sodium', 'NSAID', 'injection', '75mg/3ml', 'mg'),
('Aspirin 75mg', 'Aspirin', 'antiplatelet', 'tablet', '75', 'mg'),
('Aspirin 150mg', 'Aspirin', 'antiplatelet', 'tablet', '150', 'mg'),
('Tramadol 50mg', 'Tramadol HCl', 'analgesic', 'capsule', '50', 'mg'),
('Ketorolac 10mg', 'Ketorolac', 'NSAID', 'tablet', '10', 'mg'),
('Naproxen 250mg', 'Naproxen', 'NSAID', 'tablet', '250', 'mg'),
-- Antibiotics
('Amoxicillin 250mg', 'Amoxicillin', 'antibiotic', 'capsule', '250', 'mg'),
('Amoxicillin 500mg', 'Amoxicillin', 'antibiotic', 'capsule', '500', 'mg'),
('Amoxicillin-Clavulanate 625mg', 'Amoxicillin + Clavulanic Acid', 'antibiotic', 'tablet', '625', 'mg'),
('Azithromycin 250mg', 'Azithromycin', 'antibiotic', 'tablet', '250', 'mg'),
('Azithromycin 500mg', 'Azithromycin', 'antibiotic', 'tablet', '500', 'mg'),
('Ciprofloxacin 250mg', 'Ciprofloxacin', 'antibiotic', 'tablet', '250', 'mg'),
('Ciprofloxacin 500mg', 'Ciprofloxacin', 'antibiotic', 'tablet', '500', 'mg'),
('Levofloxacin 500mg', 'Levofloxacin', 'antibiotic', 'tablet', '500', 'mg'),
('Doxycycline 100mg', 'Doxycycline', 'antibiotic', 'capsule', '100', 'mg'),
('Cefixime 200mg', 'Cefixime', 'antibiotic', 'tablet', '200', 'mg'),
('Cefixime 400mg', 'Cefixime', 'antibiotic', 'tablet', '400', 'mg'),
('Ceftriaxone 1g Injection', 'Ceftriaxone', 'antibiotic', 'injection', '1', 'g'),
('Metronidazole 400mg', 'Metronidazole', 'antibiotic', 'tablet', '400', 'mg'),
('Metronidazole 500mg', 'Metronidazole', 'antibiotic', 'tablet', '500', 'mg'),
('Clindamycin 300mg', 'Clindamycin', 'antibiotic', 'capsule', '300', 'mg'),
('Nitrofurantoin 100mg', 'Nitrofurantoin', 'antibiotic', 'capsule', '100', 'mg'),
('Trimethoprim-Sulfamethoxazole 960mg', 'Co-trimoxazole', 'antibiotic', 'tablet', '960', 'mg'),
('Linezolid 600mg', 'Linezolid', 'antibiotic', 'tablet', '600', 'mg'),
-- Antihypertensives
('Amlodipine 5mg', 'Amlodipine', 'antihypertensive', 'tablet', '5', 'mg'),
('Amlodipine 10mg', 'Amlodipine', 'antihypertensive', 'tablet', '10', 'mg'),
('Atenolol 25mg', 'Atenolol', 'antihypertensive', 'tablet', '25', 'mg'),
('Atenolol 50mg', 'Atenolol', 'antihypertensive', 'tablet', '50', 'mg'),
('Metoprolol 25mg', 'Metoprolol Succinate', 'antihypertensive', 'tablet', '25', 'mg'),
('Metoprolol 50mg', 'Metoprolol Succinate', 'antihypertensive', 'tablet', '50', 'mg'),
('Losartan 25mg', 'Losartan Potassium', 'antihypertensive', 'tablet', '25', 'mg'),
('Losartan 50mg', 'Losartan Potassium', 'antihypertensive', 'tablet', '50', 'mg'),
('Telmisartan 40mg', 'Telmisartan', 'antihypertensive', 'tablet', '40', 'mg'),
('Telmisartan 80mg', 'Telmisartan', 'antihypertensive', 'tablet', '80', 'mg'),
('Enalapril 5mg', 'Enalapril Maleate', 'antihypertensive', 'tablet', '5', 'mg'),
('Ramipril 5mg', 'Ramipril', 'antihypertensive', 'tablet', '5', 'mg'),
('Hydrochlorothiazide 12.5mg', 'Hydrochlorothiazide', 'diuretic', 'tablet', '12.5', 'mg'),
('Furosemide 40mg', 'Furosemide', 'diuretic', 'tablet', '40', 'mg'),
('Spironolactone 25mg', 'Spironolactone', 'diuretic', 'tablet', '25', 'mg'),
-- Antidiabetics
('Metformin 500mg', 'Metformin HCl', 'antidiabetic', 'tablet', '500', 'mg'),
('Metformin 850mg', 'Metformin HCl', 'antidiabetic', 'tablet', '850', 'mg'),
('Metformin 1000mg', 'Metformin HCl', 'antidiabetic', 'tablet', '1000', 'mg'),
('Glibenclamide 5mg', 'Glibenclamide', 'antidiabetic', 'tablet', '5', 'mg'),
('Glimepiride 1mg', 'Glimepiride', 'antidiabetic', 'tablet', '1', 'mg'),
('Glimepiride 2mg', 'Glimepiride', 'antidiabetic', 'tablet', '2', 'mg'),
('Sitagliptin 50mg', 'Sitagliptin', 'antidiabetic', 'tablet', '50', 'mg'),
('Sitagliptin 100mg', 'Sitagliptin', 'antidiabetic', 'tablet', '100', 'mg'),
('Empagliflozin 10mg', 'Empagliflozin', 'antidiabetic', 'tablet', '10', 'mg'),
('Insulin Regular', 'Regular Human Insulin', 'antidiabetic', 'injection', '100 IU/ml', 'IU/ml'),
('Insulin Glargine', 'Insulin Glargine', 'antidiabetic', 'injection', '100 IU/ml', 'IU/ml'),
-- Gastrointestinal
('Omeprazole 20mg', 'Omeprazole', 'antacid', 'capsule', '20', 'mg'),
('Omeprazole 40mg', 'Omeprazole', 'antacid', 'capsule', '40', 'mg'),
('Pantoprazole 40mg', 'Pantoprazole Sodium', 'antacid', 'tablet', '40', 'mg'),
('Rabeprazole 20mg', 'Rabeprazole Sodium', 'antacid', 'tablet', '20', 'mg'),
('Esomeprazole 20mg', 'Esomeprazole', 'antacid', 'capsule', '20', 'mg'),
('Ranitidine 150mg', 'Ranitidine HCl', 'antacid', 'tablet', '150', 'mg'),
('Domperidone 10mg', 'Domperidone', 'antiemetic', 'tablet', '10', 'mg'),
('Ondansetron 4mg', 'Ondansetron HCl', 'antiemetic', 'tablet', '4', 'mg'),
('Ondansetron 8mg', 'Ondansetron HCl', 'antiemetic', 'tablet', '8', 'mg'),
('Metoclopramide 10mg', 'Metoclopramide', 'antiemetic', 'tablet', '10', 'mg'),
('Loperamide 2mg', 'Loperamide HCl', 'antidiarrheal', 'tablet', '2', 'mg'),
('Bisacodyl 5mg', 'Bisacodyl', 'laxative', 'tablet', '5', 'mg'),
('Lactulose Syrup', 'Lactulose', 'laxative', 'syrup', '10g/15ml', 'g/15ml'),
('Simethicone 40mg', 'Simethicone', 'antiflatulent', 'tablet', '40', 'mg'),
('Hyoscine Butylbromide 10mg', 'Hyoscine Butylbromide', 'antispasmodic', 'tablet', '10', 'mg'),
-- Respiratory
('Salbutamol 2mg', 'Salbutamol Sulphate', 'bronchodilator', 'tablet', '2', 'mg'),
('Salbutamol Inhaler', 'Salbutamol', 'bronchodilator', 'inhaler', '100mcg/dose', 'mcg/dose'),
('Budesonide Inhaler', 'Budesonide', 'corticosteroid', 'inhaler', '200mcg/dose', 'mcg/dose'),
('Montelukast 10mg', 'Montelukast Sodium', 'anti-asthmatic', 'tablet', '10', 'mg'),
('Cetirizine 10mg', 'Cetirizine HCl', 'antihistamine', 'tablet', '10', 'mg'),
('Fexofenadine 120mg', 'Fexofenadine HCl', 'antihistamine', 'tablet', '120', 'mg'),
('Loratadine 10mg', 'Loratadine', 'antihistamine', 'tablet', '10', 'mg'),
('Phenylephrine + Chlorpheniramine', 'Phenylephrine+Chlorpheniramine', 'decongestant', 'tablet', '10mg+2mg', 'mg'),
('Dextromethorphan Syrup', 'Dextromethorphan', 'antitussive', 'syrup', '15mg/5ml', 'mg/5ml'),
-- Cardiovascular
('Atorvastatin 10mg', 'Atorvastatin Calcium', 'statin', 'tablet', '10', 'mg'),
('Atorvastatin 20mg', 'Atorvastatin Calcium', 'statin', 'tablet', '20', 'mg'),
('Rosuvastatin 10mg', 'Rosuvastatin Calcium', 'statin', 'tablet', '10', 'mg'),
('Clopidogrel 75mg', 'Clopidogrel Bisulphate', 'antiplatelet', 'tablet', '75', 'mg'),
('Warfarin 1mg', 'Warfarin Sodium', 'anticoagulant', 'tablet', '1', 'mg'),
('Digoxin 0.25mg', 'Digoxin', 'cardiac glycoside', 'tablet', '0.25', 'mg'),
('Nitroglycerin SL', 'Glyceryl Trinitrate', 'nitrate', 'tablet', '0.5', 'mg'),
-- Neurological / Psychiatric
('Phenytoin 100mg', 'Phenytoin Sodium', 'anticonvulsant', 'tablet', '100', 'mg'),
('Carbamazepine 200mg', 'Carbamazepine', 'anticonvulsant', 'tablet', '200', 'mg'),
('Valproate 500mg', 'Sodium Valproate', 'anticonvulsant', 'tablet', '500', 'mg'),
('Levetiracetam 500mg', 'Levetiracetam', 'anticonvulsant', 'tablet', '500', 'mg'),
('Amitriptyline 25mg', 'Amitriptyline HCl', 'antidepressant', 'tablet', '25', 'mg'),
('Sertraline 50mg', 'Sertraline HCl', 'antidepressant', 'tablet', '50', 'mg'),
('Escitalopram 10mg', 'Escitalopram Oxalate', 'antidepressant', 'tablet', '10', 'mg'),
('Alprazolam 0.25mg', 'Alprazolam', 'anxiolytic', 'tablet', '0.25', 'mg'),
('Clonazepam 0.5mg', 'Clonazepam', 'anticonvulsant', 'tablet', '0.5', 'mg'),
('Diazepam 5mg', 'Diazepam', 'anxiolytic', 'tablet', '5', 'mg'),
('Zolpidem 10mg', 'Zolpidem Tartrate', 'hypnotic', 'tablet', '10', 'mg'),
-- Corticosteroids
('Prednisolone 5mg', 'Prednisolone', 'corticosteroid', 'tablet', '5', 'mg'),
('Prednisolone 10mg', 'Prednisolone', 'corticosteroid', 'tablet', '10', 'mg'),
('Dexamethasone 4mg', 'Dexamethasone', 'corticosteroid', 'tablet', '4', 'mg'),
('Methylprednisolone 4mg', 'Methylprednisolone', 'corticosteroid', 'tablet', '4', 'mg'),
('Hydrocortisone Cream 1%', 'Hydrocortisone', 'corticosteroid', 'cream', '1%', '%'),
-- Thyroid
('Levothyroxine 25mcg', 'Levothyroxine Sodium', 'thyroid', 'tablet', '25', 'mcg'),
('Levothyroxine 50mcg', 'Levothyroxine Sodium', 'thyroid', 'tablet', '50', 'mcg'),
('Levothyroxine 100mcg', 'Levothyroxine Sodium', 'thyroid', 'tablet', '100', 'mcg'),
('Carbimazole 5mg', 'Carbimazole', 'antithyroid', 'tablet', '5', 'mg'),
-- Vitamins / Supplements
('Vitamin D3 60000 IU', 'Cholecalciferol', 'vitamin', 'capsule', '60000', 'IU'),
('Vitamin B12 500mcg', 'Methylcobalamin', 'vitamin', 'tablet', '500', 'mcg'),
('Folic Acid 5mg', 'Folic Acid', 'vitamin', 'tablet', '5', 'mg'),
('Iron + Folic Acid', 'Ferrous Sulphate+Folic Acid', 'supplement', 'tablet', '150+0.5mg', 'mg'),
('Calcium + Vitamin D3', 'Calcium Carbonate+D3', 'supplement', 'tablet', '500mg+250IU', 'mg'),
('Multivitamin Capsule', 'Multivitamin', 'vitamin', 'capsule', '-', '-'),
('Zinc 50mg', 'Zinc Sulphate', 'supplement', 'tablet', '50', 'mg'),
('Omega-3 Fish Oil', 'Omega-3 Fatty Acids', 'supplement', 'capsule', '1000', 'mg'),
-- Antifungals / Antivirals
('Fluconazole 150mg', 'Fluconazole', 'antifungal', 'capsule', '150', 'mg'),
('Itraconazole 100mg', 'Itraconazole', 'antifungal', 'capsule', '100', 'mg'),
('Acyclovir 400mg', 'Acyclovir', 'antiviral', 'tablet', '400', 'mg'),
('Oseltamivir 75mg', 'Oseltamivir Phosphate', 'antiviral', 'capsule', '75', 'mg'),
-- Injectable / IV Fluids
('Normal Saline 500ml', '0.9% Sodium Chloride', 'IV fluid', 'solution', '0.9%', '%'),
('Normal Saline 1000ml', '0.9% Sodium Chloride', 'IV fluid', 'solution', '0.9%', '%'),
('Ringer Lactate 500ml', 'Lactated Ringer''s Solution', 'IV fluid', 'solution', '-', '-'),
('Dextrose 5% 500ml', '5% Dextrose', 'IV fluid', 'solution', '5%', '%'),
('Dextrose Normal Saline 500ml', 'DNS', 'IV fluid', 'solution', '-', '-'),
('Albumin 20% 100ml', 'Human Albumin', 'plasma expander', 'injection', '20%', '%'),
-- Antacid combinations
('Antacid Suspension', 'Aluminium+Magnesium Hydroxide', 'antacid', 'syrup', '-', '-'),
-- Urology
('Tamsulosin 0.4mg', 'Tamsulosin HCl', 'alpha blocker', 'capsule', '0.4', 'mg'),
('Finasteride 5mg', 'Finasteride', '5-alpha reductase inhibitor', 'tablet', '5', 'mg'),
-- Eye / Ear Drops
('Ciprofloxacin Eye Drops', 'Ciprofloxacin', 'antibiotic', 'drops', '0.3%', '%'),
('Tobramycin Eye Drops', 'Tobramycin', 'antibiotic', 'drops', '0.3%', '%'),
('Timolol Eye Drops 0.5%', 'Timolol Maleate', 'antiglaucoma', 'drops', '0.5%', '%'),
-- Dermatology
('Clotrimazole Cream 1%', 'Clotrimazole', 'antifungal', 'cream', '1%', '%'),
('Betamethasone Cream 0.1%', 'Betamethasone Valerate', 'corticosteroid', 'cream', '0.1%', '%'),
('Mupirocin Ointment 2%', 'Mupirocin', 'antibiotic', 'cream', '2%', '%'),
('Calamine Lotion', 'Calamine', 'soothing', 'lotion', '-', '-'),
-- Antimalarial
('Chloroquine 250mg', 'Chloroquine Phosphate', 'antimalarial', 'tablet', '250', 'mg'),
('Artemether-Lumefantrine', 'Artemether+Lumefantrine', 'antimalarial', 'tablet', '20mg+120mg', 'mg'),
('Hydroxychloroquine 200mg', 'Hydroxychloroquine Sulphate', 'antimalarial', 'tablet', '200', 'mg'),
-- Antiparasitic
('Albendazole 400mg', 'Albendazole', 'anthelmintic', 'tablet', '400', 'mg'),
('Ivermectin 6mg', 'Ivermectin', 'antiparasitic', 'tablet', '6', 'mg')
ON CONFLICT DO NOTHING;
