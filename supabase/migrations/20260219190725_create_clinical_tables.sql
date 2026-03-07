/*
  # Clinical Module Tables - Symptoms, Diagnoses, Medical History, Vitals, Consultations

  1. New Tables
    - `symptoms` - Master symptom list with category classification
    - `diagnoses` - Master diagnosis list with ICD-10 codes
    - `medical_history` - Patient medical history records
    - `vitals` - OPD vitals recording
    - `consultations` - Doctor-patient consultation records
    - `consultation_symptoms` - Junction table for consultation symptoms
    - `consultation_diagnoses` - Junction table for consultation diagnoses

  2. Schema Changes
    - Add missing columns to `patients` table (registration_type, created_by, guardian fields, billing_category)

  3. Security
    - RLS enabled on all tables
    - Authenticated users can read master lists
    - Clinical records restricted to hospital staff
*/

-- Add missing columns to patients
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'patients' AND column_name = 'registration_type'
  ) THEN
    ALTER TABLE patients ADD COLUMN registration_type text DEFAULT 'walk-in';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'patients' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE patients ADD COLUMN created_by uuid REFERENCES auth.users(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'patients' AND column_name = 'guardian_name'
  ) THEN
    ALTER TABLE patients ADD COLUMN guardian_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'patients' AND column_name = 'guardian_phone'
  ) THEN
    ALTER TABLE patients ADD COLUMN guardian_phone text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'patients' AND column_name = 'guardian_relation'
  ) THEN
    ALTER TABLE patients ADD COLUMN guardian_relation text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'patients' AND column_name = 'billing_category'
  ) THEN
    ALTER TABLE patients ADD COLUMN billing_category text DEFAULT 'cash';
  END IF;
END $$;

-- SYMPTOMS MASTER TABLE
CREATE TABLE IF NOT EXISTS symptoms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  description text,
  usage_count integer DEFAULT 0,
  is_active boolean DEFAULT true,
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE symptoms ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'symptoms' AND policyname = 'Authenticated users can view symptoms') THEN
    CREATE POLICY "Authenticated users can view symptoms"
      ON symptoms FOR SELECT TO authenticated USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'symptoms' AND policyname = 'Admins can manage symptoms') THEN
    CREATE POLICY "Admins can manage symptoms"
      ON symptoms FOR INSERT TO authenticated
      WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin','superadmin'));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'symptoms' AND policyname = 'Admins can update symptoms') THEN
    CREATE POLICY "Admins can update symptoms"
      ON symptoms FOR UPDATE TO authenticated
      USING ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin','superadmin'))
      WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin','superadmin'));
  END IF;
END $$;

-- DIAGNOSES MASTER TABLE
CREATE TABLE IF NOT EXISTS diagnoses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  icd_code text,
  category text NOT NULL DEFAULT 'general',
  description text,
  usage_count integer DEFAULT 0,
  is_active boolean DEFAULT true,
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE diagnoses ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'diagnoses' AND policyname = 'Authenticated users can view diagnoses') THEN
    CREATE POLICY "Authenticated users can view diagnoses"
      ON diagnoses FOR SELECT TO authenticated USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'diagnoses' AND policyname = 'Admins can manage diagnoses') THEN
    CREATE POLICY "Admins can manage diagnoses"
      ON diagnoses FOR INSERT TO authenticated
      WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin','superadmin'));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'diagnoses' AND policyname = 'Admins can update diagnoses') THEN
    CREATE POLICY "Admins can update diagnoses"
      ON diagnoses FOR UPDATE TO authenticated
      USING ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin','superadmin'))
      WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin','superadmin'));
  END IF;
END $$;

-- MEDICAL HISTORY TABLE
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

-- VITALS TABLE
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

-- CONSULTATIONS TABLE
CREATE TABLE IF NOT EXISTS consultations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id uuid REFERENCES hospitals(id),
  appointment_id uuid REFERENCES appointments(id) ON DELETE SET NULL,
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id uuid REFERENCES profiles(id),
  consultation_date date DEFAULT CURRENT_DATE,
  chief_complaint text,
  history_of_present_illness text,
  past_history text,
  family_history text,
  personal_history text,
  drug_history text,
  allergy_history text,
  physical_examination text,
  examination_findings text,
  clinical_notes text,
  assessment text,
  plan text,
  advice text,
  follow_up_date date,
  is_completed boolean DEFAULT false,
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

-- CONSULTATION SYMPTOMS JUNCTION TABLE
CREATE TABLE IF NOT EXISTS consultation_symptoms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id uuid REFERENCES consultations(id) ON DELETE CASCADE,
  symptom_id uuid REFERENCES symptoms(id),
  symptom_name text NOT NULL,
  duration text,
  duration_days integer,
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

-- CONSULTATION DIAGNOSES JUNCTION TABLE
CREATE TABLE IF NOT EXISTS consultation_diagnoses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id uuid REFERENCES consultations(id) ON DELETE CASCADE,
  diagnosis_id uuid REFERENCES diagnoses(id),
  diagnosis_name text NOT NULL,
  icd_code text,
  diagnosis_type text DEFAULT 'primary' CHECK (diagnosis_type IN ('primary','secondary','provisional','differential')),
  severity text,
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

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_vitals_patient ON vitals(patient_id);
CREATE INDEX IF NOT EXISTS idx_vitals_hospital ON vitals(hospital_id);
CREATE INDEX IF NOT EXISTS idx_consultations_patient ON consultations(patient_id);
CREATE INDEX IF NOT EXISTS idx_consultations_doctor ON consultations(doctor_id);
CREATE INDEX IF NOT EXISTS idx_consultations_hospital ON consultations(hospital_id);
CREATE INDEX IF NOT EXISTS idx_medical_history_patient ON medical_history(patient_id);
CREATE INDEX IF NOT EXISTS idx_symptoms_name ON symptoms(name);
CREATE INDEX IF NOT EXISTS idx_diagnoses_name ON diagnoses(name);
