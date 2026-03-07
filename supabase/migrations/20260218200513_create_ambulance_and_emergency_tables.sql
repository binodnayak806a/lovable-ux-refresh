/*
  # Create Ambulance and Emergency Management Tables

  1. New Tables
    - `ambulances` - Ambulance fleet master
      - `id` (uuid, primary key)
      - `hospital_id` (uuid, foreign key to hospitals)
      - `vehicle_number` (varchar)
      - `vehicle_type` (varchar) - BLS, ALS, ICU on Wheels
      - `driver_name`, `driver_phone` (varchar)
      - `paramedic_name` (varchar)
      - `status` (varchar) - available, on_duty, maintenance
      - `last_service_date` (date)
      - `gps_tracking_id` (varchar)
      - `is_active` (boolean)
      
    - `ambulance_requests` - Ambulance dispatch requests
      - `id` (uuid, primary key)
      - `hospital_id` (uuid, foreign key)
      - `request_number` (varchar)
      - `patient_id` (uuid, foreign key to patients)
      - `ambulance_id` (uuid, foreign key to ambulances)
      - `request_type` (varchar) - pickup, transfer, emergency
      - `pickup_location`, `dropoff_location` (text)
      - `pickup_time` (timestamptz)
      - `patient_condition` (text)
      - `priority` (varchar) - low, normal, high, critical
      - `status` (varchar) - requested, assigned, on_way, picked_up, completed, cancelled
      - `dispatch_time`, `arrival_time`, `completion_time` (timestamptz)
      - `distance_km`, `charges` (decimal)
      
    - `emergency_cases` - Emergency department cases
      - `id` (uuid, primary key)
      - `hospital_id` (uuid, foreign key)
      - `case_number` (varchar)
      - `patient_id` (uuid, foreign key to patients)
      - `arrival_time` (timestamptz)
      - `arrival_mode` (varchar) - Ambulance, Walk-in, Police, Referred
      - `triage_category` (varchar) - Red, Yellow, Green
      - `chief_complaint` (text)
      - `vitals_on_arrival` (jsonb)
      - `treating_doctor_id` (uuid, foreign key to auth.users)
      - `status` (varchar) - active, admitted, discharged, referred
      - `disposition` (varchar)
      - `disposition_time` (timestamptz)
      
    - `emergency_treatments` - Emergency treatment records
      - `id` (uuid, primary key)
      - `emergency_case_id` (uuid, foreign key)
      - `treatment_time` (timestamptz)
      - `treatment_notes`, `medications_given`, `procedures_performed` (text)
      - `performed_by` (uuid, foreign key to auth.users)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users based on hospital_id

  3. Sample Data
    - Insert sample ambulances for testing
*/

-- Ambulances table
CREATE TABLE IF NOT EXISTS ambulances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  vehicle_number VARCHAR(50) NOT NULL,
  vehicle_type VARCHAR(50) NOT NULL DEFAULT 'Basic Life Support',
  driver_name VARCHAR(100),
  driver_phone VARCHAR(20),
  paramedic_name VARCHAR(100),
  status VARCHAR(20) NOT NULL DEFAULT 'available',
  last_service_date DATE,
  next_service_date DATE,
  gps_tracking_id VARCHAR(100),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT ambulances_vehicle_number_hospital_unique UNIQUE (hospital_id, vehicle_number),
  CONSTRAINT ambulances_status_check CHECK (status IN ('available', 'on_duty', 'maintenance', 'out_of_service')),
  CONSTRAINT ambulances_vehicle_type_check CHECK (vehicle_type IN ('Basic Life Support', 'Advanced Life Support', 'ICU on Wheels', 'Patient Transport'))
);

-- Ambulance requests table
CREATE TABLE IF NOT EXISTS ambulance_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  request_number VARCHAR(50) NOT NULL,
  patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
  ambulance_id UUID REFERENCES ambulances(id) ON DELETE SET NULL,
  request_type VARCHAR(50) NOT NULL DEFAULT 'pickup',
  pickup_location TEXT NOT NULL,
  pickup_latitude DECIMAL(10, 8),
  pickup_longitude DECIMAL(11, 8),
  dropoff_location TEXT,
  dropoff_latitude DECIMAL(10, 8),
  dropoff_longitude DECIMAL(11, 8),
  pickup_time TIMESTAMPTZ,
  patient_name VARCHAR(200),
  patient_phone VARCHAR(20),
  patient_condition TEXT,
  priority VARCHAR(20) NOT NULL DEFAULT 'normal',
  status VARCHAR(20) NOT NULL DEFAULT 'requested',
  dispatch_time TIMESTAMPTZ,
  arrival_time TIMESTAMPTZ,
  completion_time TIMESTAMPTZ,
  distance_km DECIMAL(10, 2),
  charges DECIMAL(10, 2),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT ambulance_requests_number_hospital_unique UNIQUE (hospital_id, request_number),
  CONSTRAINT ambulance_requests_type_check CHECK (request_type IN ('pickup', 'transfer', 'emergency', 'scheduled')),
  CONSTRAINT ambulance_requests_priority_check CHECK (priority IN ('low', 'normal', 'high', 'critical')),
  CONSTRAINT ambulance_requests_status_check CHECK (status IN ('requested', 'assigned', 'dispatched', 'on_way', 'arrived', 'picked_up', 'in_transit', 'completed', 'cancelled'))
);

-- Emergency cases table
CREATE TABLE IF NOT EXISTS emergency_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  case_number VARCHAR(50) NOT NULL,
  patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
  ambulance_request_id UUID REFERENCES ambulance_requests(id) ON DELETE SET NULL,
  arrival_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  arrival_mode VARCHAR(50) NOT NULL DEFAULT 'Walk-in',
  triage_category VARCHAR(20) NOT NULL DEFAULT 'Green',
  triage_time TIMESTAMPTZ,
  triaged_by UUID REFERENCES auth.users(id),
  chief_complaint TEXT NOT NULL,
  history_of_present_illness TEXT,
  vitals_on_arrival JSONB,
  treating_doctor_id UUID REFERENCES auth.users(id),
  bed_number VARCHAR(20),
  status VARCHAR(20) NOT NULL DEFAULT 'waiting',
  disposition VARCHAR(50),
  disposition_notes TEXT,
  disposition_time TIMESTAMPTZ,
  admitted_to_ward VARCHAR(100),
  admission_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT emergency_cases_number_hospital_unique UNIQUE (hospital_id, case_number),
  CONSTRAINT emergency_cases_arrival_mode_check CHECK (arrival_mode IN ('Ambulance', 'Walk-in', 'Police', 'Referred', 'Self', 'Other')),
  CONSTRAINT emergency_cases_triage_check CHECK (triage_category IN ('Red', 'Yellow', 'Green', 'Black')),
  CONSTRAINT emergency_cases_status_check CHECK (status IN ('waiting', 'triaged', 'in_treatment', 'observation', 'admitted', 'discharged', 'referred', 'lama', 'expired')),
  CONSTRAINT emergency_cases_disposition_check CHECK (disposition IS NULL OR disposition IN ('Admitted', 'Discharged', 'Referred', 'LAMA', 'Expired', 'Observation'))
);

-- Emergency treatments table
CREATE TABLE IF NOT EXISTS emergency_treatments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  emergency_case_id UUID NOT NULL REFERENCES emergency_cases(id) ON DELETE CASCADE,
  treatment_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  treatment_type VARCHAR(50) NOT NULL DEFAULT 'general',
  treatment_notes TEXT,
  medications_given TEXT,
  procedures_performed TEXT,
  vitals_after JSONB,
  performed_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT emergency_treatments_type_check CHECK (treatment_type IN ('general', 'medication', 'procedure', 'vitals_check', 'imaging', 'lab_order', 'consultation'))
);

-- Enable RLS
ALTER TABLE ambulances ENABLE ROW LEVEL SECURITY;
ALTER TABLE ambulance_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_treatments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ambulances
CREATE POLICY "Users can view ambulances in their hospital"
  ON ambulances FOR SELECT
  TO authenticated
  USING (
    hospital_id IN (
      SELECT hospital_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert ambulances in their hospital"
  ON ambulances FOR INSERT
  TO authenticated
  WITH CHECK (
    hospital_id IN (
      SELECT hospital_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update ambulances in their hospital"
  ON ambulances FOR UPDATE
  TO authenticated
  USING (
    hospital_id IN (
      SELECT hospital_id FROM profiles WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    hospital_id IN (
      SELECT hospital_id FROM profiles WHERE id = auth.uid()
    )
  );

-- RLS Policies for ambulance_requests
CREATE POLICY "Users can view ambulance requests in their hospital"
  ON ambulance_requests FOR SELECT
  TO authenticated
  USING (
    hospital_id IN (
      SELECT hospital_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert ambulance requests in their hospital"
  ON ambulance_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    hospital_id IN (
      SELECT hospital_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update ambulance requests in their hospital"
  ON ambulance_requests FOR UPDATE
  TO authenticated
  USING (
    hospital_id IN (
      SELECT hospital_id FROM profiles WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    hospital_id IN (
      SELECT hospital_id FROM profiles WHERE id = auth.uid()
    )
  );

-- RLS Policies for emergency_cases
CREATE POLICY "Users can view emergency cases in their hospital"
  ON emergency_cases FOR SELECT
  TO authenticated
  USING (
    hospital_id IN (
      SELECT hospital_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert emergency cases in their hospital"
  ON emergency_cases FOR INSERT
  TO authenticated
  WITH CHECK (
    hospital_id IN (
      SELECT hospital_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update emergency cases in their hospital"
  ON emergency_cases FOR UPDATE
  TO authenticated
  USING (
    hospital_id IN (
      SELECT hospital_id FROM profiles WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    hospital_id IN (
      SELECT hospital_id FROM profiles WHERE id = auth.uid()
    )
  );

-- RLS Policies for emergency_treatments
CREATE POLICY "Users can view emergency treatments for cases in their hospital"
  ON emergency_treatments FOR SELECT
  TO authenticated
  USING (
    emergency_case_id IN (
      SELECT id FROM emergency_cases WHERE hospital_id IN (
        SELECT hospital_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert emergency treatments for cases in their hospital"
  ON emergency_treatments FOR INSERT
  TO authenticated
  WITH CHECK (
    emergency_case_id IN (
      SELECT id FROM emergency_cases WHERE hospital_id IN (
        SELECT hospital_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ambulances_hospital_status ON ambulances(hospital_id, status);
CREATE INDEX IF NOT EXISTS idx_ambulances_is_active ON ambulances(hospital_id, is_active);
CREATE INDEX IF NOT EXISTS idx_ambulance_requests_hospital_status ON ambulance_requests(hospital_id, status);
CREATE INDEX IF NOT EXISTS idx_ambulance_requests_priority ON ambulance_requests(hospital_id, priority, status);
CREATE INDEX IF NOT EXISTS idx_ambulance_requests_ambulance ON ambulance_requests(ambulance_id);
CREATE INDEX IF NOT EXISTS idx_emergency_cases_hospital_status ON emergency_cases(hospital_id, status);
CREATE INDEX IF NOT EXISTS idx_emergency_cases_triage ON emergency_cases(hospital_id, triage_category, status);
CREATE INDEX IF NOT EXISTS idx_emergency_cases_arrival_time ON emergency_cases(hospital_id, arrival_time DESC);
CREATE INDEX IF NOT EXISTS idx_emergency_treatments_case ON emergency_treatments(emergency_case_id);

-- Insert sample ambulances
INSERT INTO ambulances (hospital_id, vehicle_number, vehicle_type, driver_name, driver_phone, paramedic_name, status)
SELECT 
  h.id,
  'AMB-' || (row_number() OVER ())::TEXT || '-' || substr(md5(random()::text), 1, 4),
  vehicle_type,
  driver_name,
  driver_phone,
  paramedic_name,
  status
FROM hospitals h
CROSS JOIN (
  VALUES 
    ('Basic Life Support', 'Rajesh Kumar', '9876543210', 'Amit Singh', 'available'),
    ('Advanced Life Support', 'Suresh Patel', '9876543211', 'Priya Sharma', 'available'),
    ('ICU on Wheels', 'Vikram Singh', '9876543212', 'Dr. Neha Gupta', 'available'),
    ('Patient Transport', 'Manoj Verma', '9876543213', 'Ravi Kumar', 'maintenance')
) AS ambulance_data(vehicle_type, driver_name, driver_phone, paramedic_name, status)
WHERE NOT EXISTS (SELECT 1 FROM ambulances WHERE ambulances.hospital_id = h.id)
LIMIT 4;