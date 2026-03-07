/*
  # Ambulance and Emergency Module Tables

  1. New Tables
    - `ambulances` - Ambulance fleet master
    - `ambulance_requests` - Dispatch requests
    - `emergency_cases` - Emergency department cases
    - `emergency_treatments` - Treatment actions in emergency

  2. Security
    - RLS enabled on all tables
    - Hospital-scoped access
*/

-- AMBULANCES TABLE
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
  status text DEFAULT 'available',
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

-- AMBULANCE REQUESTS TABLE
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
  dispatch_time timestamptz,
  dispatched_at timestamptz,
  arrival_time timestamptz,
  arrived_at_scene_at timestamptz,
  arrived_at_destination_at timestamptz,
  completion_time timestamptz,
  completed_at timestamptz,
  distance_km numeric,
  charges numeric DEFAULT 0,
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

-- EMERGENCY CASES TABLE
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
  treating_doctor_id uuid REFERENCES profiles(id),
  vital_signs jsonb,
  gcs_score integer,
  mlc_case boolean DEFAULT false,
  mlc_number text,
  referral_hospital text,
  referral_notes text,
  disposition text CHECK (disposition IN ('admitted','discharged','transferred','absconded','death','lwbs','observation')),
  disposition_time timestamptz,
  disposition_notes text,
  admitted_to_ward text,
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

-- EMERGENCY TREATMENTS TABLE
CREATE TABLE IF NOT EXISTS emergency_treatments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  emergency_case_id uuid REFERENCES emergency_cases(id) ON DELETE CASCADE,
  treatment_type text DEFAULT 'medication' CHECK (treatment_type IN ('medication','procedure','iv_fluid','oxygen','monitoring','investigation','other')),
  description text NOT NULL,
  dosage text,
  route text,
  treatment_time timestamptz DEFAULT now(),
  given_at timestamptz DEFAULT now(),
  given_by uuid REFERENCES profiles(id),
  performed_by uuid REFERENCES profiles(id),
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

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_ambulances_hospital ON ambulances(hospital_id);
CREATE INDEX IF NOT EXISTS idx_ambulance_requests_hospital ON ambulance_requests(hospital_id);
CREATE INDEX IF NOT EXISTS idx_emergency_cases_hospital ON emergency_cases(hospital_id);
CREATE INDEX IF NOT EXISTS idx_emergency_cases_status ON emergency_cases(status);
CREATE INDEX IF NOT EXISTS idx_emergency_cases_arrival ON emergency_cases(arrival_time);
