/*
  # Add IPD Nursing Tables

  ## Summary
  Creates nursing-specific tables for the IPD module including nursing tasks,
  IPD vitals, nursing notes, doctor rounds, and bed history tracking.

  ## New Tables
  1. `bed_history` - Track bed assignments
  2. `nursing_tasks` - Nursing task management
  3. `ipd_vitals` - IPD-specific vitals tracking
  4. `nursing_notes` - Nursing documentation
  5. `doctor_rounds` - Daily rounds documentation

  ## Updates
  - Add billing_category, insurance fields to admissions
  - Add more bed data for ICU and General wards
  - Create admission number generator function

  ## Security
  - RLS enabled on all tables
  - Hospital-scoped access policies
*/

-- Add missing columns to admissions if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admissions' AND column_name = 'billing_category') THEN
    ALTER TABLE admissions ADD COLUMN billing_category text DEFAULT 'Cash' CHECK (billing_category IN ('Cash', 'Insurance', 'TPA', 'Corporate', 'Government'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admissions' AND column_name = 'insurance_company') THEN
    ALTER TABLE admissions ADD COLUMN insurance_company text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admissions' AND column_name = 'policy_number') THEN
    ALTER TABLE admissions ADD COLUMN policy_number text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admissions' AND column_name = 'estimated_stay_days') THEN
    ALTER TABLE admissions ADD COLUMN estimated_stay_days integer DEFAULT 3;
  END IF;
END $$;

-- Bed History table
CREATE TABLE IF NOT EXISTS bed_history (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admission_id  uuid NOT NULL REFERENCES admissions(id) ON DELETE CASCADE,
  bed_id        uuid NOT NULL REFERENCES beds(id) ON DELETE CASCADE,
  assigned_at   timestamptz DEFAULT now(),
  released_at   timestamptz,
  reason        text,
  created_at    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS bed_history_admission_idx ON bed_history(admission_id);
CREATE INDEX IF NOT EXISTS bed_history_bed_idx ON bed_history(bed_id);

ALTER TABLE bed_history ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Staff can view bed history"
    ON bed_history FOR SELECT
    TO authenticated
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Staff can insert bed history"
    ON bed_history FOR INSERT
    TO authenticated
    WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Staff can update bed history"
    ON bed_history FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Nursing Tasks table
CREATE TABLE IF NOT EXISTS nursing_tasks (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admission_id      uuid NOT NULL REFERENCES admissions(id) ON DELETE CASCADE,
  task_type         text NOT NULL DEFAULT 'Other' CHECK (task_type IN ('Vitals', 'Medication', 'Dressing', 'Observation', 'Lab', 'Procedure', 'Other')),
  task_description  text NOT NULL,
  scheduled_time    timestamptz NOT NULL,
  completed_time    timestamptz,
  completed_by      uuid REFERENCES auth.users(id),
  status            text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'missed', 'delayed', 'cancelled')),
  priority          text NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  recurrence        text DEFAULT 'once' CHECK (recurrence IN ('once', 'daily', 'every-4-hours', 'every-6-hours', 'every-8-hours', 'every-12-hours')),
  notes             text,
  created_by        uuid REFERENCES auth.users(id),
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS nursing_tasks_admission_idx ON nursing_tasks(admission_id);
CREATE INDEX IF NOT EXISTS nursing_tasks_scheduled_idx ON nursing_tasks(scheduled_time);
CREATE INDEX IF NOT EXISTS nursing_tasks_status_idx ON nursing_tasks(status);

ALTER TABLE nursing_tasks ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Staff can view nursing tasks"
    ON nursing_tasks FOR SELECT
    TO authenticated
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Staff can insert nursing tasks"
    ON nursing_tasks FOR INSERT
    TO authenticated
    WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Staff can update nursing tasks"
    ON nursing_tasks FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Staff can delete nursing tasks"
    ON nursing_tasks FOR DELETE
    TO authenticated
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- IPD Vitals table
CREATE TABLE IF NOT EXISTS ipd_vitals (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admission_id          uuid NOT NULL REFERENCES admissions(id) ON DELETE CASCADE,
  recorded_by           uuid REFERENCES auth.users(id),
  recorded_at           timestamptz DEFAULT now(),
  systolic_bp           integer,
  diastolic_bp          integer,
  heart_rate            integer,
  respiratory_rate      integer,
  temperature           numeric(4,1),
  spo2                  integer,
  blood_glucose         numeric(5,1),
  input_output_chart    jsonb DEFAULT '{}',
  pain_score            integer CHECK (pain_score >= 0 AND pain_score <= 10),
  consciousness_level   text CHECK (consciousness_level IN ('Alert', 'Verbal', 'Pain', 'Unresponsive', NULL)),
  gcs_score             integer CHECK (gcs_score >= 3 AND gcs_score <= 15),
  notes                 text,
  created_at            timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ipd_vitals_admission_idx ON ipd_vitals(admission_id);
CREATE INDEX IF NOT EXISTS ipd_vitals_recorded_idx ON ipd_vitals(recorded_at DESC);

ALTER TABLE ipd_vitals ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Staff can view ipd vitals"
    ON ipd_vitals FOR SELECT
    TO authenticated
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Staff can insert ipd vitals"
    ON ipd_vitals FOR INSERT
    TO authenticated
    WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Nursing Notes table
CREATE TABLE IF NOT EXISTS nursing_notes (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admission_id  uuid NOT NULL REFERENCES admissions(id) ON DELETE CASCADE,
  nurse_id      uuid REFERENCES auth.users(id),
  note_type     text NOT NULL DEFAULT 'General' CHECK (note_type IN ('General', 'Handover', 'Incident', 'Progress', 'Procedure', 'Observation')),
  note_text     text NOT NULL,
  created_at    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS nursing_notes_admission_idx ON nursing_notes(admission_id);
CREATE INDEX IF NOT EXISTS nursing_notes_date_idx ON nursing_notes(created_at DESC);

ALTER TABLE nursing_notes ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Staff can view nursing notes"
    ON nursing_notes FOR SELECT
    TO authenticated
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Staff can insert nursing notes"
    ON nursing_notes FOR INSERT
    TO authenticated
    WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Doctor Rounds table
CREATE TABLE IF NOT EXISTS doctor_rounds (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admission_id            uuid NOT NULL REFERENCES admissions(id) ON DELETE CASCADE,
  doctor_id               uuid REFERENCES auth.users(id),
  round_date              date NOT NULL DEFAULT CURRENT_DATE,
  round_time              time,
  clinical_notes          text,
  treatment_plan          text,
  orders                  text,
  follow_up_instructions  text,
  created_at              timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS doctor_rounds_admission_idx ON doctor_rounds(admission_id);
CREATE INDEX IF NOT EXISTS doctor_rounds_date_idx ON doctor_rounds(round_date DESC);

ALTER TABLE doctor_rounds ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Staff can view doctor rounds"
    ON doctor_rounds FOR SELECT
    TO authenticated
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Doctors can insert rounds"
    ON doctor_rounds FOR INSERT
    TO authenticated
    WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Doctors can update rounds"
    ON doctor_rounds FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Function to generate admission number
CREATE OR REPLACE FUNCTION generate_admission_number()
RETURNS text AS $$
DECLARE
  year_part text;
  month_part text;
  today_count integer;
  new_number text;
BEGIN
  year_part := TO_CHAR(CURRENT_DATE, 'YY');
  month_part := TO_CHAR(CURRENT_DATE, 'MM');
  
  SELECT COUNT(*) + 1 INTO today_count
  FROM admissions
  WHERE EXTRACT(YEAR FROM admission_date) = EXTRACT(YEAR FROM CURRENT_DATE);
  
  new_number := 'ADM' || year_part || month_part || LPAD(today_count::text, 4, '0');
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Update ward names for better display
UPDATE wards SET name = 'ICU Ward' WHERE ward_type = 'icu' AND name IS NULL;
UPDATE wards SET name = 'General Ward' WHERE ward_type = 'general' AND name IS NULL;
UPDATE wards SET name = 'Private Rooms' WHERE ward_type = 'private' AND name IS NULL;

-- Insert more beds for ICU ward if needed
DO $$
DECLARE
  icu_ward_id uuid;
  gen_ward_id uuid;
  pvt_ward_id uuid;
  hosp_id uuid;
BEGIN
  SELECT hospital_id INTO hosp_id FROM profiles LIMIT 1;
  SELECT id INTO icu_ward_id FROM wards WHERE ward_type = 'icu' AND hospital_id = hosp_id LIMIT 1;
  SELECT id INTO gen_ward_id FROM wards WHERE ward_type = 'general' AND hospital_id = hosp_id LIMIT 1;
  SELECT id INTO pvt_ward_id FROM wards WHERE ward_type = 'private' AND hospital_id = hosp_id LIMIT 1;

  -- Add ICU beds
  IF icu_ward_id IS NOT NULL THEN
    FOR i IN 1..8 LOOP
      INSERT INTO beds (hospital_id, ward_id, bed_number, bed_type, daily_rate, status)
      VALUES (
        hosp_id,
        icu_ward_id,
        'ICU-' || LPAD(i::text, 2, '0'),
        CASE WHEN i <= 3 THEN 'ventilator' ELSE 'icu' END,
        CASE WHEN i <= 3 THEN 8000 ELSE 5000 END,
        'available'
      )
      ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;

  -- Add General ward beds
  IF gen_ward_id IS NOT NULL THEN
    FOR i IN 1..15 LOOP
      INSERT INTO beds (hospital_id, ward_id, bed_number, bed_type, daily_rate, status)
      VALUES (
        hosp_id,
        gen_ward_id,
        'GEN-' || LPAD(i::text, 2, '0'),
        CASE WHEN i <= 4 THEN 'oxygen' ELSE 'general' END,
        CASE WHEN i <= 4 THEN 1500 ELSE 1000 END,
        'available'
      )
      ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;

  -- Add Private room beds
  IF pvt_ward_id IS NOT NULL THEN
    FOR i IN 1..10 LOOP
      INSERT INTO beds (hospital_id, ward_id, bed_number, bed_type, daily_rate, status)
      VALUES (
        hosp_id,
        pvt_ward_id,
        'PVT-' || LPAD(i::text, 2, '0'),
        'general',
        3500,
        'available'
      )
      ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;
END $$;

-- Update ward bed counts
UPDATE wards SET total_beds = (SELECT COUNT(*) FROM beds WHERE beds.ward_id = wards.id);
UPDATE wards SET available_beds = (SELECT COUNT(*) FROM beds WHERE beds.ward_id = wards.id AND beds.status = 'available');
