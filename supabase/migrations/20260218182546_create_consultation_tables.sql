/*
  # Create Consultation Module Tables

  ## Summary
  Creates the core consultation tables for the OPD consultation workflow including
  symptoms, diagnoses (with ICD-10 codes), and the junction tables for many-to-many
  relationships.

  ## New Tables
  1. `symptoms`
    - `id` (uuid, primary key)
    - `name` (text, unique symptom name)
    - `category` (text, grouping for UI)
    - `description` (text, optional)
    - `usage_count` (integer, for sorting by popularity)
    - `is_active` (boolean)

  2. `diagnoses`
    - `id` (uuid, primary key)
    - `name` (text, diagnosis name)
    - `icd10_code` (text, ICD-10 code like J06.9)
    - `category` (text, grouping)
    - `description` (text, optional)
    - `is_active` (boolean)

  3. `consultations`
    - `id` (uuid, primary key)
    - `appointment_id` (uuid, FK → appointments, nullable)
    - `patient_id` (uuid, FK → patients)
    - `doctor_id` (uuid, FK → auth.users)
    - `consultation_date` (timestamptz)
    - `chief_complaint` (text)
    - `history_of_present_illness` (text)
    - `past_history` (text)
    - `family_history` (text)
    - `personal_history` (text)
    - `drug_history` (text)
    - `physical_examination` (text)
    - `clinical_notes` (text)
    - `assessment` (text)
    - `plan` (text)
    - `follow_up_date` (date)
    - `is_completed` (boolean)

  4. `consultation_symptoms`
    - `id` (uuid, primary key)
    - `consultation_id` (uuid, FK → consultations)
    - `symptom_id` (uuid, FK → symptoms)
    - `severity` (text: mild/moderate/severe)
    - `duration_days` (integer)
    - `notes` (text)

  5. `consultation_diagnoses`
    - `id` (uuid, primary key)
    - `consultation_id` (uuid, FK → consultations)
    - `diagnosis_id` (uuid, FK → diagnoses)
    - `diagnosis_type` (text: primary/secondary/provisional)
    - `severity` (text: mild/moderate/severe/critical)
    - `notes` (text)

  ## Security
  - RLS enabled on all tables
  - Hospital-scoped access for clinical staff
*/

-- Symptoms master table
CREATE TABLE IF NOT EXISTS symptoms (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL,
  category     text NOT NULL DEFAULT 'General',
  description  text,
  usage_count  integer DEFAULT 0,
  is_active    boolean DEFAULT true,
  created_at   timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS symptoms_name_unique ON symptoms(lower(name));

ALTER TABLE symptoms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view symptoms"
  ON symptoms FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Diagnoses master table (ICD-10)
CREATE TABLE IF NOT EXISTS diagnoses (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  icd10_code  text,
  category    text NOT NULL DEFAULT 'General',
  description text,
  is_active   boolean DEFAULT true,
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS diagnoses_icd10_idx ON diagnoses(icd10_code);
CREATE INDEX IF NOT EXISTS diagnoses_name_idx ON diagnoses(name);

ALTER TABLE diagnoses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view diagnoses"
  ON diagnoses FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Consultations table
CREATE TABLE IF NOT EXISTS consultations (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id            uuid REFERENCES appointments(id) ON DELETE SET NULL,
  patient_id                uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id                 uuid REFERENCES auth.users(id),
  consultation_date         timestamptz DEFAULT now(),
  chief_complaint           text,
  history_of_present_illness text,
  past_history              text,
  family_history            text,
  personal_history          text,
  drug_history              text,
  allergy_history           text,
  physical_examination      text,
  clinical_notes            text,
  assessment                text,
  plan                      text,
  follow_up_date            date,
  is_completed              boolean DEFAULT false,
  created_at                timestamptz DEFAULT now(),
  updated_at                timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS consultations_patient_idx ON consultations(patient_id);
CREATE INDEX IF NOT EXISTS consultations_doctor_idx ON consultations(doctor_id);
CREATE INDEX IF NOT EXISTS consultations_appointment_idx ON consultations(appointment_id);
CREATE INDEX IF NOT EXISTS consultations_date_idx ON consultations(consultation_date DESC);

ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clinical staff can view consultations"
  ON consultations FOR SELECT
  TO authenticated
  USING (
    patient_id IN (
      SELECT id FROM patients WHERE hospital_id IN (
        SELECT hospital_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Clinical staff can insert consultations"
  ON consultations FOR INSERT
  TO authenticated
  WITH CHECK (
    patient_id IN (
      SELECT id FROM patients WHERE hospital_id IN (
        SELECT hospital_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Clinical staff can update consultations"
  ON consultations FOR UPDATE
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

-- Consultation symptoms junction
CREATE TABLE IF NOT EXISTS consultation_symptoms (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id uuid NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
  symptom_id      uuid NOT NULL REFERENCES symptoms(id) ON DELETE CASCADE,
  severity        text DEFAULT 'moderate' CHECK (severity IN ('mild','moderate','severe')),
  duration_days   integer,
  notes           text,
  created_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS consultation_symptoms_consultation_idx ON consultation_symptoms(consultation_id);
CREATE INDEX IF NOT EXISTS consultation_symptoms_symptom_idx ON consultation_symptoms(symptom_id);

ALTER TABLE consultation_symptoms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clinical staff can view consultation symptoms"
  ON consultation_symptoms FOR SELECT
  TO authenticated
  USING (
    consultation_id IN (
      SELECT id FROM consultations WHERE patient_id IN (
        SELECT id FROM patients WHERE hospital_id IN (
          SELECT hospital_id FROM profiles WHERE id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Clinical staff can insert consultation symptoms"
  ON consultation_symptoms FOR INSERT
  TO authenticated
  WITH CHECK (
    consultation_id IN (
      SELECT id FROM consultations WHERE patient_id IN (
        SELECT id FROM patients WHERE hospital_id IN (
          SELECT hospital_id FROM profiles WHERE id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Clinical staff can delete consultation symptoms"
  ON consultation_symptoms FOR DELETE
  TO authenticated
  USING (
    consultation_id IN (
      SELECT id FROM consultations WHERE patient_id IN (
        SELECT id FROM patients WHERE hospital_id IN (
          SELECT hospital_id FROM profiles WHERE id = auth.uid()
        )
      )
    )
  );

-- Consultation diagnoses junction
CREATE TABLE IF NOT EXISTS consultation_diagnoses (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id uuid NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
  diagnosis_id    uuid NOT NULL REFERENCES diagnoses(id) ON DELETE CASCADE,
  diagnosis_type  text DEFAULT 'primary' CHECK (diagnosis_type IN ('primary','secondary','provisional')),
  severity        text DEFAULT 'moderate' CHECK (severity IN ('mild','moderate','severe','critical')),
  notes           text,
  created_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS consultation_diagnoses_consultation_idx ON consultation_diagnoses(consultation_id);
CREATE INDEX IF NOT EXISTS consultation_diagnoses_diagnosis_idx ON consultation_diagnoses(diagnosis_id);

ALTER TABLE consultation_diagnoses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clinical staff can view consultation diagnoses"
  ON consultation_diagnoses FOR SELECT
  TO authenticated
  USING (
    consultation_id IN (
      SELECT id FROM consultations WHERE patient_id IN (
        SELECT id FROM patients WHERE hospital_id IN (
          SELECT hospital_id FROM profiles WHERE id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Clinical staff can insert consultation diagnoses"
  ON consultation_diagnoses FOR INSERT
  TO authenticated
  WITH CHECK (
    consultation_id IN (
      SELECT id FROM consultations WHERE patient_id IN (
        SELECT id FROM patients WHERE hospital_id IN (
          SELECT hospital_id FROM profiles WHERE id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Clinical staff can delete consultation diagnoses"
  ON consultation_diagnoses FOR DELETE
  TO authenticated
  USING (
    consultation_id IN (
      SELECT id FROM consultations WHERE patient_id IN (
        SELECT id FROM patients WHERE hospital_id IN (
          SELECT hospital_id FROM profiles WHERE id = auth.uid()
        )
      )
    )
  );
