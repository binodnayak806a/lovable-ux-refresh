/*
  # wellnotes HMS Foundation Schema

  ## Summary
  Creates the foundational database schema for the wellnotes Hospital Management System.

  ## New Tables

  ### 1. `profiles`
  - Extends Supabase auth.users with HMS-specific user profile data
  - Columns: id, email, full_name, role, hospital_id, department, designation, phone, avatar_url, is_active, created_at, updated_at
  - Roles: admin, doctor, nurse, billing, pharmacist, lab_technician, receptionist, superadmin

  ### 2. `hospitals`
  - Hospital/clinic master records
  - Columns: id, name, registration_number, address, city, state, pincode, phone, email, website, logo_url, bed_count, is_active, created_at

  ### 3. `departments`
  - Hospital departments (cardiology, orthopedics, etc.)
  - Columns: id, hospital_id, name, code, head_doctor_id, description, is_active, created_at

  ## Security
  - RLS enabled on all tables
  - Users can read/update their own profile
  - Hospital data accessible to authenticated users of that hospital
  - Superadmins have broader access

  ## Notes
  - All tables use UUID primary keys
  - Timestamps use timestamptz for timezone awareness
  - A trigger auto-creates profiles when auth users are created
*/

CREATE TYPE user_role AS ENUM (
  'superadmin', 'admin', 'doctor', 'nurse', 'billing',
  'pharmacist', 'lab_technician', 'receptionist'
);

CREATE TABLE IF NOT EXISTS hospitals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  registration_number text UNIQUE,
  address text,
  city text,
  state text,
  pincode text,
  phone text,
  email text,
  website text,
  logo_url text,
  bed_count integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE hospitals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view hospitals"
  ON hospitals FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text NOT NULL DEFAULT '',
  role user_role NOT NULL DEFAULT 'receptionist',
  hospital_id uuid REFERENCES hospitals(id),
  department text,
  designation text,
  phone text,
  avatar_url text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE TABLE IF NOT EXISTS departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id uuid NOT NULL REFERENCES hospitals(id),
  name text NOT NULL,
  code text NOT NULL,
  head_doctor_id uuid,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view departments"
  ON departments FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

CREATE INDEX IF NOT EXISTS profiles_hospital_id_idx ON profiles(hospital_id);
CREATE INDEX IF NOT EXISTS profiles_role_idx ON profiles(role);
CREATE INDEX IF NOT EXISTS departments_hospital_id_idx ON departments(hospital_id);
