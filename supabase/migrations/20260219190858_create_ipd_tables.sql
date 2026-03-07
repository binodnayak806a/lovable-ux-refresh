/*
  # IPD Module Tables

  1. Schema Changes
    - Add missing columns to `admissions` table (billing_category, insurance_company, policy_number, estimated_stay_days)

  2. New Tables
    - `bed_history` - Track bed transfers and assignments
    - `nursing_tasks` - Nursing care tasks for IPD patients
    - `ipd_vitals` - Vitals monitoring for IPD patients
    - `nursing_notes` - Nursing shift notes
    - `doctor_rounds` - Daily doctor round notes
    - `ipd_bill_items` - Daily charges accumulation for IPD
    - `discharge_summaries` - Detailed discharge summary documents

  3. Security
    - RLS enabled on all tables
    - Hospital-scoped access via admissions
*/

-- Add missing columns to admissions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'admissions' AND column_name = 'billing_category'
  ) THEN
    ALTER TABLE admissions ADD COLUMN billing_category text DEFAULT 'cash';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'admissions' AND column_name = 'insurance_company'
  ) THEN
    ALTER TABLE admissions ADD COLUMN insurance_company text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'admissions' AND column_name = 'policy_number'
  ) THEN
    ALTER TABLE admissions ADD COLUMN policy_number text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'admissions' AND column_name = 'estimated_stay_days'
  ) THEN
    ALTER TABLE admissions ADD COLUMN estimated_stay_days integer;
  END IF;
END $$;

-- BED HISTORY TABLE
CREATE TABLE IF NOT EXISTS bed_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admission_id uuid REFERENCES admissions(id) ON DELETE CASCADE,
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  ward_id uuid REFERENCES wards(id),
  bed_id uuid REFERENCES beds(id),
  assigned_at timestamptz DEFAULT now(),
  vacated_at timestamptz,
  released_at timestamptz,
  reason text,
  notes text,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE bed_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hospital staff can view bed history"
  ON bed_history FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admissions a
    WHERE a.id = bed_history.admission_id
    AND a.hospital_id = (SELECT hospital_id FROM profiles WHERE id = auth.uid())
  ));

CREATE POLICY "Nursing staff can insert bed history"
  ON bed_history FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM admissions a
    WHERE a.id = bed_history.admission_id
    AND a.hospital_id = (SELECT hospital_id FROM profiles WHERE id = auth.uid())
  ));

CREATE POLICY "Nursing staff can update bed history"
  ON bed_history FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admissions a
    WHERE a.id = bed_history.admission_id
    AND a.hospital_id = (SELECT hospital_id FROM profiles WHERE id = auth.uid())
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM admissions a
    WHERE a.id = bed_history.admission_id
    AND a.hospital_id = (SELECT hospital_id FROM profiles WHERE id = auth.uid())
  ));

-- NURSING TASKS TABLE
CREATE TABLE IF NOT EXISTS nursing_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admission_id uuid REFERENCES admissions(id) ON DELETE CASCADE,
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  task_type text DEFAULT 'general' CHECK (task_type IN ('medication','vitals','dressing','iv_cannula','catheter','specimen_collection','general','mobility','diet','monitoring')),
  title text NOT NULL,
  task_description text,
  description text,
  priority text DEFAULT 'medium' CHECK (priority IN ('low','medium','high','urgent')),
  scheduled_time timestamptz,
  due_time timestamptz,
  recurrence text,
  status text DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed','skipped','cancelled')),
  completed_time timestamptz,
  completed_at timestamptz,
  assigned_to uuid REFERENCES profiles(id),
  completed_by uuid REFERENCES profiles(id),
  notes text,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE nursing_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hospital staff can view nursing tasks"
  ON nursing_tasks FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admissions a
    WHERE a.id = nursing_tasks.admission_id
    AND a.hospital_id = (SELECT hospital_id FROM profiles WHERE id = auth.uid())
  ));

CREATE POLICY "Nursing staff can insert tasks"
  ON nursing_tasks FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM admissions a
    WHERE a.id = nursing_tasks.admission_id
    AND a.hospital_id = (SELECT hospital_id FROM profiles WHERE id = auth.uid())
  ));

CREATE POLICY "Nursing staff can update tasks"
  ON nursing_tasks FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admissions a
    WHERE a.id = nursing_tasks.admission_id
    AND a.hospital_id = (SELECT hospital_id FROM profiles WHERE id = auth.uid())
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM admissions a
    WHERE a.id = nursing_tasks.admission_id
    AND a.hospital_id = (SELECT hospital_id FROM profiles WHERE id = auth.uid())
  ));

-- IPD VITALS TABLE
CREATE TABLE IF NOT EXISTS ipd_vitals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admission_id uuid REFERENCES admissions(id) ON DELETE CASCADE,
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  temperature numeric,
  temperature_unit text DEFAULT 'F',
  pulse_rate integer,
  blood_pressure_systolic integer,
  blood_pressure_diastolic integer,
  respiratory_rate integer,
  oxygen_saturation numeric,
  weight numeric,
  blood_glucose numeric,
  gcs_score integer,
  pain_scale integer CHECK (pain_scale BETWEEN 0 AND 10),
  urine_output numeric,
  fluid_intake numeric,
  notes text,
  recorded_by uuid REFERENCES profiles(id),
  recorded_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ipd_vitals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hospital staff can view IPD vitals"
  ON ipd_vitals FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admissions a
    WHERE a.id = ipd_vitals.admission_id
    AND a.hospital_id = (SELECT hospital_id FROM profiles WHERE id = auth.uid())
  ));

CREATE POLICY "Clinical staff can insert IPD vitals"
  ON ipd_vitals FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM admissions a
    WHERE a.id = ipd_vitals.admission_id
    AND a.hospital_id = (SELECT hospital_id FROM profiles WHERE id = auth.uid())
  ));

-- NURSING NOTES TABLE
CREATE TABLE IF NOT EXISTS nursing_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admission_id uuid REFERENCES admissions(id) ON DELETE CASCADE,
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  nurse_id uuid REFERENCES profiles(id),
  shift text DEFAULT 'morning' CHECK (shift IN ('morning','afternoon','evening','night')),
  note_type text DEFAULT 'general' CHECK (note_type IN ('general','handover','incident','medication','assessment','plan')),
  note_text text,
  content text,
  written_by uuid REFERENCES profiles(id),
  note_date date DEFAULT CURRENT_DATE,
  note_time time DEFAULT CURRENT_TIME,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE nursing_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hospital staff can view nursing notes"
  ON nursing_notes FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admissions a
    WHERE a.id = nursing_notes.admission_id
    AND a.hospital_id = (SELECT hospital_id FROM profiles WHERE id = auth.uid())
  ));

CREATE POLICY "Nursing staff can insert nursing notes"
  ON nursing_notes FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM admissions a
    WHERE a.id = nursing_notes.admission_id
    AND a.hospital_id = (SELECT hospital_id FROM profiles WHERE id = auth.uid())
  ));

-- DOCTOR ROUNDS TABLE
CREATE TABLE IF NOT EXISTS doctor_rounds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admission_id uuid REFERENCES admissions(id) ON DELETE CASCADE,
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id uuid REFERENCES profiles(id),
  round_date date DEFAULT CURRENT_DATE,
  round_time time DEFAULT CURRENT_TIME,
  clinical_notes text,
  examination_findings text,
  diagnosis_update text,
  treatment_plan text,
  plan text,
  orders text,
  medications_changed text,
  investigations_ordered text,
  follow_up_instructions text,
  condition text DEFAULT 'stable' CHECK (condition IN ('critical','serious','guarded','stable','improving','good')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE doctor_rounds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hospital staff can view doctor rounds"
  ON doctor_rounds FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admissions a
    WHERE a.id = doctor_rounds.admission_id
    AND a.hospital_id = (SELECT hospital_id FROM profiles WHERE id = auth.uid())
  ));

CREATE POLICY "Clinical staff can insert doctor rounds"
  ON doctor_rounds FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM admissions a
    WHERE a.id = doctor_rounds.admission_id
    AND a.hospital_id = (SELECT hospital_id FROM profiles WHERE id = auth.uid())
  ));

CREATE POLICY "Clinical staff can update doctor rounds"
  ON doctor_rounds FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admissions a
    WHERE a.id = doctor_rounds.admission_id
    AND a.hospital_id = (SELECT hospital_id FROM profiles WHERE id = auth.uid())
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM admissions a
    WHERE a.id = doctor_rounds.admission_id
    AND a.hospital_id = (SELECT hospital_id FROM profiles WHERE id = auth.uid())
  ));

-- IPD BILL ITEMS TABLE
CREATE TABLE IF NOT EXISTS ipd_bill_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admission_id uuid REFERENCES admissions(id) ON DELETE CASCADE,
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  item_type text,
  item_name text,
  item_description text,
  item_date date DEFAULT CURRENT_DATE,
  charge_date date DEFAULT CURRENT_DATE,
  charge_type text DEFAULT 'bed_charges',
  description text,
  quantity numeric DEFAULT 1,
  unit_price numeric DEFAULT 0,
  unit_rate numeric DEFAULT 0,
  total_price numeric DEFAULT 0,
  amount numeric DEFAULT 0,
  discount_amount numeric DEFAULT 0,
  net_amount numeric DEFAULT 0,
  is_billable boolean DEFAULT true,
  added_by uuid REFERENCES profiles(id),
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ipd_bill_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hospital staff can view IPD bill items"
  ON ipd_bill_items FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admissions a
    WHERE a.id = ipd_bill_items.admission_id
    AND a.hospital_id = (SELECT hospital_id FROM profiles WHERE id = auth.uid())
  ));

CREATE POLICY "Clinical staff can insert IPD bill items"
  ON ipd_bill_items FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM admissions a
    WHERE a.id = ipd_bill_items.admission_id
    AND a.hospital_id = (SELECT hospital_id FROM profiles WHERE id = auth.uid())
  ));

CREATE POLICY "Clinical staff can update IPD bill items"
  ON ipd_bill_items FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admissions a
    WHERE a.id = ipd_bill_items.admission_id
    AND a.hospital_id = (SELECT hospital_id FROM profiles WHERE id = auth.uid())
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM admissions a
    WHERE a.id = ipd_bill_items.admission_id
    AND a.hospital_id = (SELECT hospital_id FROM profiles WHERE id = auth.uid())
  ));

CREATE POLICY "Clinical staff can delete IPD bill items"
  ON ipd_bill_items FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admissions a
    WHERE a.id = ipd_bill_items.admission_id
    AND a.hospital_id = (SELECT hospital_id FROM profiles WHERE id = auth.uid())
  ));

-- DISCHARGE SUMMARIES TABLE
CREATE TABLE IF NOT EXISTS discharge_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admission_id uuid REFERENCES admissions(id) ON DELETE CASCADE,
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  hospital_id uuid REFERENCES hospitals(id),
  discharge_date date NOT NULL,
  discharge_type text DEFAULT 'normal' CHECK (discharge_type IN ('normal','against_medical_advice','transfer','death','absconded')),
  final_diagnosis text,
  secondary_diagnoses text,
  procedures_done text,
  procedures_performed text,
  operations text,
  clinical_summary text,
  treatment_summary text,
  treatment_given text,
  condition_at_discharge text,
  follow_up_instructions text,
  medications_on_discharge text,
  dietary_instructions text,
  diet_advice text,
  activity_restrictions text,
  follow_up_date date,
  follow_up_with text,
  emergency_contact text,
  doctor_name text,
  doctor_signature text,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE discharge_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hospital staff can view discharge summaries"
  ON discharge_summaries FOR SELECT TO authenticated
  USING (hospital_id = (SELECT hospital_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Clinical staff can insert discharge summaries"
  ON discharge_summaries FOR INSERT TO authenticated
  WITH CHECK (hospital_id = (SELECT hospital_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Clinical staff can update discharge summaries"
  ON discharge_summaries FOR UPDATE TO authenticated
  USING (hospital_id = (SELECT hospital_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (hospital_id = (SELECT hospital_id FROM profiles WHERE id = auth.uid()));

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_nursing_tasks_admission ON nursing_tasks(admission_id);
CREATE INDEX IF NOT EXISTS idx_ipd_vitals_admission ON ipd_vitals(admission_id);
CREATE INDEX IF NOT EXISTS idx_ipd_vitals_recorded_at ON ipd_vitals(recorded_at);
CREATE INDEX IF NOT EXISTS idx_nursing_notes_admission ON nursing_notes(admission_id);
CREATE INDEX IF NOT EXISTS idx_doctor_rounds_admission ON doctor_rounds(admission_id);
CREATE INDEX IF NOT EXISTS idx_ipd_bill_items_admission ON ipd_bill_items(admission_id);
CREATE INDEX IF NOT EXISTS idx_discharge_summaries_admission ON discharge_summaries(admission_id);
CREATE INDEX IF NOT EXISTS idx_bed_history_admission ON bed_history(admission_id);
