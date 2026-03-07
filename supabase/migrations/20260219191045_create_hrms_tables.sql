/*
  # HRMS Module Tables

  1. New Tables
    - `staff` - Full employee record
    - `attendance` - Daily attendance per staff
    - `leave_requests` - Leave applications
    - `system_settings` - Key-value hospital config store

  2. Security
    - RLS enabled on all tables
    - Hospital-scoped access
    - Admin-only write access for most tables
*/

-- Staff table
CREATE TABLE IF NOT EXISTS staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  hospital_id uuid REFERENCES hospitals(id),
  employee_id varchar(50) NOT NULL,
  first_name varchar(100) NOT NULL,
  last_name varchar(100) DEFAULT '',
  email varchar(255),
  phone varchar(15),
  date_of_birth date,
  gender varchar(10),
  address text,
  city varchar(100),
  designation varchar(100),
  department varchar(100),
  specialty text,
  qualification text,
  license_number text,
  consultation_fee numeric DEFAULT 0,
  date_of_joining date NOT NULL DEFAULT CURRENT_DATE,
  employment_type varchar(50) DEFAULT 'Full-time',
  salary decimal(10,2) DEFAULT 0,
  status varchar(20) DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT staff_employee_id_hospital_unique UNIQUE (hospital_id, employee_id)
);

ALTER TABLE staff ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view staff in their hospital"
  ON staff FOR SELECT TO authenticated
  USING (hospital_id = (SELECT hospital_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Admins can insert staff"
  ON staff FOR INSERT TO authenticated
  WITH CHECK (
    hospital_id = (SELECT hospital_id FROM profiles WHERE id = auth.uid())
    AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'superadmin')
  );

CREATE POLICY "Admins can update staff"
  ON staff FOR UPDATE TO authenticated
  USING (
    hospital_id = (SELECT hospital_id FROM profiles WHERE id = auth.uid())
    AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'superadmin')
  )
  WITH CHECK (
    hospital_id = (SELECT hospital_id FROM profiles WHERE id = auth.uid())
    AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'superadmin')
  );

CREATE POLICY "Admins can delete staff"
  ON staff FOR DELETE TO authenticated
  USING (
    hospital_id = (SELECT hospital_id FROM profiles WHERE id = auth.uid())
    AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'superadmin')
  );

-- Attendance table
CREATE TABLE IF NOT EXISTS attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid REFERENCES staff(id) ON DELETE CASCADE,
  date date NOT NULL,
  check_in time,
  check_out time,
  status varchar(20) DEFAULT 'present',
  notes text,
  UNIQUE(staff_id, date)
);

ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view attendance"
  ON attendance FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM staff s
    WHERE s.id = attendance.staff_id
    AND s.hospital_id = (SELECT hospital_id FROM profiles WHERE id = auth.uid())
  ));

CREATE POLICY "Admins and nurses can insert attendance"
  ON attendance FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff s
      WHERE s.id = attendance.staff_id
      AND s.hospital_id = (SELECT hospital_id FROM profiles WHERE id = auth.uid())
    )
    AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'superadmin', 'nurse')
  );

CREATE POLICY "Admins and nurses can update attendance"
  ON attendance FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff s
      WHERE s.id = attendance.staff_id
      AND s.hospital_id = (SELECT hospital_id FROM profiles WHERE id = auth.uid())
    )
    AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'superadmin', 'nurse')
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff s
      WHERE s.id = attendance.staff_id
      AND s.hospital_id = (SELECT hospital_id FROM profiles WHERE id = auth.uid())
    )
    AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'superadmin', 'nurse')
  );

-- Leave requests table
CREATE TABLE IF NOT EXISTS leave_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid REFERENCES staff(id) ON DELETE CASCADE,
  leave_type varchar(50) DEFAULT 'Casual Leave',
  from_date date NOT NULL,
  to_date date NOT NULL,
  total_days integer DEFAULT 1,
  reason text,
  status varchar(20) DEFAULT 'pending',
  approved_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view leave requests in hospital"
  ON leave_requests FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM staff s
    WHERE s.id = leave_requests.staff_id
    AND s.hospital_id = (SELECT hospital_id FROM profiles WHERE id = auth.uid())
  ));

CREATE POLICY "Admins can insert leave requests"
  ON leave_requests FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff s
      WHERE s.id = leave_requests.staff_id
      AND s.hospital_id = (SELECT hospital_id FROM profiles WHERE id = auth.uid())
    )
    AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'superadmin')
  );

CREATE POLICY "Admins can update leave requests"
  ON leave_requests FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff s
      WHERE s.id = leave_requests.staff_id
      AND s.hospital_id = (SELECT hospital_id FROM profiles WHERE id = auth.uid())
    )
    AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'superadmin')
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff s
      WHERE s.id = leave_requests.staff_id
      AND s.hospital_id = (SELECT hospital_id FROM profiles WHERE id = auth.uid())
    )
    AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'superadmin')
  );

-- System settings table
CREATE TABLE IF NOT EXISTS system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id uuid REFERENCES hospitals(id),
  setting_key varchar(100) NOT NULL,
  setting_value text,
  setting_type varchar(50) DEFAULT 'general',
  updated_at timestamptz DEFAULT now(),
  UNIQUE(hospital_id, setting_key)
);

ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view system settings"
  ON system_settings FOR SELECT TO authenticated
  USING (
    hospital_id = (SELECT hospital_id FROM profiles WHERE id = auth.uid())
    AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'superadmin')
  );

CREATE POLICY "Admins can insert system settings"
  ON system_settings FOR INSERT TO authenticated
  WITH CHECK (
    hospital_id = (SELECT hospital_id FROM profiles WHERE id = auth.uid())
    AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'superadmin')
  );

CREATE POLICY "Admins can update system settings"
  ON system_settings FOR UPDATE TO authenticated
  USING (
    hospital_id = (SELECT hospital_id FROM profiles WHERE id = auth.uid())
    AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'superadmin')
  )
  WITH CHECK (
    hospital_id = (SELECT hospital_id FROM profiles WHERE id = auth.uid())
    AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'superadmin')
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_staff_hospital ON staff(hospital_id);
CREATE INDEX IF NOT EXISTS idx_staff_status ON staff(status);
CREATE INDEX IF NOT EXISTS idx_attendance_staff_date ON attendance(staff_id, date);
CREATE INDEX IF NOT EXISTS idx_leave_requests_staff ON leave_requests(staff_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_system_settings_hospital ON system_settings(hospital_id);
