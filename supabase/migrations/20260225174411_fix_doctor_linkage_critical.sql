/*
  # CRITICAL FIX: Link profiles to doctors table

  ## Problem
  - System has both `profiles` (with role='doctor') AND `doctors` table
  - appointments.doctor_id references profiles.id
  - doctor_schedules.doctor_id references doctors.id
  - NO link between them = broken functionality

  ## Solution
  1. Add doctor_id column to profiles table
  2. Create function to auto-link when doctor profile created
  3. Seed existing data to link profiles to doctors

  ## Impact
  - Enables proper doctor → schedule → fee lookups
  - Fixes appointment creation with doctor schedules
  - Maintains backward compatibility
*/

-- 1. Add doctor_id column to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'doctor_id'
  ) THEN
    ALTER TABLE profiles
    ADD COLUMN doctor_id uuid REFERENCES doctors(id) ON DELETE SET NULL;

    CREATE INDEX IF NOT EXISTS idx_profiles_doctor_id ON profiles(doctor_id);
  END IF;
END $$;

-- 2. Create function to auto-create doctor record when doctor profile created
CREATE OR REPLACE FUNCTION create_doctor_from_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_doctor_id uuid;
  v_employee_id text;
BEGIN
  -- Only process if role is doctor and doctor_id is null
  IF NEW.role = 'doctor' AND NEW.doctor_id IS NULL THEN
    -- Generate employee ID
    v_employee_id := 'DOC-' || LPAD(FLOOR(RANDOM() * 9999)::TEXT, 4, '0');

    -- Create doctor record
    INSERT INTO doctors (
      hospital_id,
      employee_id,
      first_name,
      last_name,
      specialty,
      qualification,
      phone,
      email,
      is_active
    ) VALUES (
      NEW.hospital_id,
      v_employee_id,
      SPLIT_PART(NEW.full_name, ' ', 1),
      NULLIF(SPLIT_PART(NEW.full_name, ' ', 2), ''),
      COALESCE(NEW.designation, 'General Physician'),
      NEW.designation,
      NEW.phone,
      NEW.email,
      NEW.is_active
    )
    RETURNING id INTO v_doctor_id;

    -- Link profile to doctor
    NEW.doctor_id := v_doctor_id;
  END IF;

  RETURN NEW;
END;
$$;

-- Drop trigger if exists, then create
DROP TRIGGER IF EXISTS trigger_create_doctor_from_profile ON profiles;
CREATE TRIGGER trigger_create_doctor_from_profile
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_doctor_from_profile();

-- 3. Seed existing data: Link existing doctor profiles to doctors table
DO $$
DECLARE
  profile_rec RECORD;
  v_doctor_id uuid;
  v_employee_id text;
BEGIN
  -- For each doctor profile without a linked doctor record
  FOR profile_rec IN
    SELECT * FROM profiles WHERE role = 'doctor' AND doctor_id IS NULL
  LOOP
    -- Try to find matching doctor by email or phone
    SELECT id INTO v_doctor_id
    FROM doctors
    WHERE hospital_id = profile_rec.hospital_id
      AND (
        email = profile_rec.email
        OR phone = profile_rec.phone
      )
    LIMIT 1;

    -- If no match found, create new doctor record
    IF v_doctor_id IS NULL THEN
      v_employee_id := 'DOC-' || LPAD(FLOOR(RANDOM() * 9999)::TEXT, 4, '0');

      INSERT INTO doctors (
        hospital_id,
        employee_id,
        first_name,
        last_name,
        specialty,
        qualification,
        phone,
        email,
        is_active
      ) VALUES (
        profile_rec.hospital_id,
        v_employee_id,
        SPLIT_PART(profile_rec.full_name, ' ', 1),
        NULLIF(SPLIT_PART(profile_rec.full_name, ' ', 2), ''),
        COALESCE(profile_rec.designation, 'General Physician'),
        profile_rec.designation,
        profile_rec.phone,
        profile_rec.email,
        profile_rec.is_active
      )
      RETURNING id INTO v_doctor_id;
    END IF;

    -- Link profile to doctor
    UPDATE profiles
    SET doctor_id = v_doctor_id
    WHERE id = profile_rec.id;
  END LOOP;
END $$;

-- 4. Add comment for documentation
COMMENT ON COLUMN profiles.doctor_id IS 'Links to doctors table for doctor-role profiles. Contains doctor details, schedules, and fees.';
