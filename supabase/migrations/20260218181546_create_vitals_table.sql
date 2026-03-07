/*
  # Create Vitals Table

  ## Summary
  Creates the `vitals` table for recording patient vital signs during OPD consultations.

  ## New Tables
  - `vitals`
    - `id` (uuid, primary key)
    - `patient_id` (uuid, FK → patients)
    - `appointment_id` (uuid, FK → appointments, nullable)
    - `recorded_by` (uuid, FK → auth.users)
    - `recorded_at` (timestamptz, default now)
    - `systolic_bp` (integer, mmHg)
    - `diastolic_bp` (integer, mmHg)
    - `heart_rate` (integer, bpm)
    - `respiratory_rate` (integer, breaths/min)
    - `temperature` (decimal 4,1, °C)
    - `spo2` (integer, %)
    - `height` (decimal 5,2, cm)
    - `weight` (decimal 5,2, kg)
    - `bmi` (decimal 4,2, auto-calculated)
    - `blood_glucose_level` (decimal 5,2, mg/dL)
    - `pain_scale` (integer, 0–10)
    - `notes` (text)
    - `is_abnormal` (boolean, default false)

  ## Security
  - RLS enabled; hospital-scoped read/insert/update for authenticated users

  ## Indexes
  - `vitals_patient_id_idx` for fast patient-scoped queries
  - `vitals_recorded_at_idx` for chronological ordering
*/

CREATE TABLE IF NOT EXISTS vitals (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id          uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  appointment_id      uuid REFERENCES appointments(id) ON DELETE SET NULL,
  recorded_by         uuid REFERENCES auth.users(id),
  recorded_at         timestamptz DEFAULT now(),
  systolic_bp         integer,
  diastolic_bp        integer,
  heart_rate          integer,
  respiratory_rate    integer,
  temperature         decimal(4,1),
  spo2                integer,
  height              decimal(5,2),
  weight              decimal(5,2),
  bmi                 decimal(4,2),
  blood_glucose_level decimal(5,2),
  pain_scale          integer CHECK (pain_scale >= 0 AND pain_scale <= 10),
  notes               text,
  is_abnormal         boolean DEFAULT false
);

ALTER TABLE vitals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clinical staff can view vitals"
  ON vitals FOR SELECT
  TO authenticated
  USING (
    patient_id IN (
      SELECT id FROM patients WHERE hospital_id IN (
        SELECT hospital_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Clinical staff can insert vitals"
  ON vitals FOR INSERT
  TO authenticated
  WITH CHECK (
    patient_id IN (
      SELECT id FROM patients WHERE hospital_id IN (
        SELECT hospital_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Clinical staff can update vitals"
  ON vitals FOR UPDATE
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

CREATE INDEX IF NOT EXISTS vitals_patient_id_idx   ON vitals(patient_id);
CREATE INDEX IF NOT EXISTS vitals_recorded_at_idx  ON vitals(recorded_at DESC);
CREATE INDEX IF NOT EXISTS vitals_appointment_id_idx ON vitals(appointment_id);
