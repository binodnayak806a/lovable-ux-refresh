/*
  # QR Booking & Offline Support Enhancements

  1. Modified Tables
    - `custom_fields_config`
      - Added `is_public` (boolean, default false) - controls whether field is shown on public QR booking form

  2. New Tables
    - `hospital_settings`
      - `id` (uuid, primary key)
      - `hospital_id` (uuid, references hospitals)
      - `key` (text)
      - `value` (text)
      - Unique constraint on (hospital_id, key)

  3. Security
    - Enable RLS on hospital_settings
    - Public can read hospital_settings (needed for QR booking page)
    - Only authenticated users can modify hospital_settings
    - Public anon users can read hospitals table (for QR booking branding)
    - Public anon users can read doctors (profiles with role='doctor') for QR booking
    - Public anon users can insert appointments (for QR booking)
    - Public anon users can read custom_fields_config where is_public=true

  4. Notes
    - The QR booking page is public (no auth required)
    - Appointments created via QR get status 'qr_booked'
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'custom_fields_config' AND column_name = 'is_public'
  ) THEN
    ALTER TABLE custom_fields_config ADD COLUMN is_public boolean NOT NULL DEFAULT false;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS hospital_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id uuid NOT NULL,
  key text NOT NULL,
  value text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(hospital_id, key)
);

ALTER TABLE hospital_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read hospital settings"
  ON hospital_settings FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert hospital settings"
  ON hospital_settings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update hospital settings"
  ON hospital_settings FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'hospitals' AND policyname = 'Public can read active hospitals'
  ) THEN
    CREATE POLICY "Public can read active hospitals"
      ON hospitals FOR SELECT
      TO anon
      USING (is_active = true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'profiles' AND policyname = 'Public can read doctor profiles'
  ) THEN
    CREATE POLICY "Public can read doctor profiles"
      ON profiles FOR SELECT
      TO anon
      USING (role = 'doctor' AND is_active = true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'appointments' AND policyname = 'Public can create qr bookings'
  ) THEN
    CREATE POLICY "Public can create qr bookings"
      ON appointments FOR INSERT
      TO anon
      WITH CHECK (status = 'qr_booked');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'custom_fields_config' AND policyname = 'Public can read public custom fields'
  ) THEN
    CREATE POLICY "Public can read public custom fields"
      ON custom_fields_config FOR SELECT
      TO anon
      USING (is_public = true AND is_active = true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'patients' AND policyname = 'Public can create patients via qr'
  ) THEN
    CREATE POLICY "Public can create patients via qr"
      ON patients FOR INSERT
      TO anon
      WITH CHECK (registration_type = 'qr_booking');
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_hospital_settings_hospital ON hospital_settings(hospital_id);
CREATE INDEX IF NOT EXISTS idx_hospital_settings_key ON hospital_settings(hospital_id, key);
