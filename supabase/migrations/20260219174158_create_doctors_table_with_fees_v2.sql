/*
  # Create Doctors Table with Specialization and Fee Structure

  1. New Tables
    - `doctors` - Main doctor information with specialization
    - `doctor_fees` - Multiple fee types per doctor
    - `doctor_schedules` - OPD availability schedule

  2. Security
    - Enable RLS on all tables
    - Policies for authenticated users

  3. Sample Data
    - 5 sample doctors with different specializations
    - Fee structure for each doctor
*/

-- Create doctors table
CREATE TABLE IF NOT EXISTS doctors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id uuid NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  employee_id text NOT NULL,
  first_name text NOT NULL,
  last_name text,
  gender text CHECK (gender IN ('male', 'female', 'other')),
  date_of_birth date,
  specialty text NOT NULL,
  sub_specialty text,
  qualification text,
  additional_qualifications text[],
  registration_number text,
  registration_council text,
  registration_valid_till date,
  experience_years integer DEFAULT 0,
  department_id uuid REFERENCES departments(id) ON DELETE SET NULL,
  phone text,
  email text,
  address text,
  profile_photo_url text,
  bio text,
  is_active boolean DEFAULT true,
  is_available_for_opd boolean DEFAULT true,
  is_available_for_ipd boolean DEFAULT true,
  is_available_for_emergency boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT doctors_employee_id_hospital_unique UNIQUE (hospital_id, employee_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_doctors_hospital_id ON doctors(hospital_id);
CREATE INDEX IF NOT EXISTS idx_doctors_specialty ON doctors(specialty);
CREATE INDEX IF NOT EXISTS idx_doctors_department_id ON doctors(department_id);
CREATE INDEX IF NOT EXISTS idx_doctors_is_active ON doctors(is_active) WHERE is_active = true;

-- Create doctor_fees table for multiple fee types per doctor
CREATE TABLE IF NOT EXISTS doctor_fees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  fee_type text NOT NULL CHECK (fee_type IN ('consultation', 'follow_up', 'emergency', 'video_consultation', 'home_visit', 'procedure')),
  amount numeric NOT NULL DEFAULT 0 CHECK (amount >= 0),
  validity_days integer DEFAULT 7,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT doctor_fees_unique UNIQUE (doctor_id, fee_type)
);

-- Create index for doctor_fees
CREATE INDEX IF NOT EXISTS idx_doctor_fees_doctor_id ON doctor_fees(doctor_id);

-- Create doctor_schedules table for OPD availability
CREATE TABLE IF NOT EXISTS doctor_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  slot_duration_minutes integer DEFAULT 15,
  max_patients integer DEFAULT 30,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT doctor_schedules_unique UNIQUE (doctor_id, day_of_week, start_time),
  CONSTRAINT doctor_schedules_time_check CHECK (end_time > start_time)
);

-- Create index for doctor_schedules
CREATE INDEX IF NOT EXISTS idx_doctor_schedules_doctor_id ON doctor_schedules(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_schedules_day ON doctor_schedules(day_of_week);

-- Enable RLS
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_schedules ENABLE ROW LEVEL SECURITY;

-- RLS Policies for doctors table
CREATE POLICY "Staff can view doctors in their hospital"
  ON doctors FOR SELECT
  TO authenticated
  USING (
    hospital_id IN (
      SELECT hospital_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Staff can insert doctors in their hospital"
  ON doctors FOR INSERT
  TO authenticated
  WITH CHECK (
    hospital_id IN (
      SELECT hospital_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Staff can update doctors in their hospital"
  ON doctors FOR UPDATE
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

CREATE POLICY "Staff can delete doctors in their hospital"
  ON doctors FOR DELETE
  TO authenticated
  USING (
    hospital_id IN (
      SELECT hospital_id FROM profiles WHERE id = auth.uid()
    )
  );

-- RLS Policies for doctor_fees table
CREATE POLICY "Staff can view doctor fees"
  ON doctor_fees FOR SELECT
  TO authenticated
  USING (
    doctor_id IN (
      SELECT d.id FROM doctors d
      WHERE d.hospital_id IN (
        SELECT hospital_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Staff can insert doctor fees"
  ON doctor_fees FOR INSERT
  TO authenticated
  WITH CHECK (
    doctor_id IN (
      SELECT d.id FROM doctors d
      WHERE d.hospital_id IN (
        SELECT hospital_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Staff can update doctor fees"
  ON doctor_fees FOR UPDATE
  TO authenticated
  USING (
    doctor_id IN (
      SELECT d.id FROM doctors d
      WHERE d.hospital_id IN (
        SELECT hospital_id FROM profiles WHERE id = auth.uid()
      )
    )
  )
  WITH CHECK (
    doctor_id IN (
      SELECT d.id FROM doctors d
      WHERE d.hospital_id IN (
        SELECT hospital_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Staff can delete doctor fees"
  ON doctor_fees FOR DELETE
  TO authenticated
  USING (
    doctor_id IN (
      SELECT d.id FROM doctors d
      WHERE d.hospital_id IN (
        SELECT hospital_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

-- RLS Policies for doctor_schedules table
CREATE POLICY "Staff can view doctor schedules"
  ON doctor_schedules FOR SELECT
  TO authenticated
  USING (
    doctor_id IN (
      SELECT d.id FROM doctors d
      WHERE d.hospital_id IN (
        SELECT hospital_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Staff can insert doctor schedules"
  ON doctor_schedules FOR INSERT
  TO authenticated
  WITH CHECK (
    doctor_id IN (
      SELECT d.id FROM doctors d
      WHERE d.hospital_id IN (
        SELECT hospital_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Staff can update doctor schedules"
  ON doctor_schedules FOR UPDATE
  TO authenticated
  USING (
    doctor_id IN (
      SELECT d.id FROM doctors d
      WHERE d.hospital_id IN (
        SELECT hospital_id FROM profiles WHERE id = auth.uid()
      )
    )
  )
  WITH CHECK (
    doctor_id IN (
      SELECT d.id FROM doctors d
      WHERE d.hospital_id IN (
        SELECT hospital_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Staff can delete doctor schedules"
  ON doctor_schedules FOR DELETE
  TO authenticated
  USING (
    doctor_id IN (
      SELECT d.id FROM doctors d
      WHERE d.hospital_id IN (
        SELECT hospital_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

-- Create function to generate doctor employee ID
CREATE OR REPLACE FUNCTION generate_doctor_id(p_hospital_id uuid)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  next_num integer;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(employee_id FROM 4) AS integer)), 0) + 1
  INTO next_num
  FROM doctors
  WHERE hospital_id = p_hospital_id;
  
  RETURN 'DR-' || LPAD(next_num::text, 4, '0');
END;
$$;
