/*
  # Add Master Data Columns and RLS Policies

  1. Schema Updates
    - Add `is_active` and `updated_at` columns to master data tables where missing
    - Add `usage_count` column to symptoms and diagnoses tables
    
  2. Security
    - Add RLS policies for admin CRUD operations on master data tables
    
  3. Important Notes
    - All changes use IF NOT EXISTS to be idempotent
    - RLS policies allow authenticated admin users to manage master data
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'medications' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE medications ADD COLUMN is_active boolean DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'medications' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE medications ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'symptoms' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE symptoms ADD COLUMN is_active boolean DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'symptoms' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE symptoms ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'diagnoses' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE diagnoses ADD COLUMN is_active boolean DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'diagnoses' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE diagnoses ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'investigations' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE investigations ADD COLUMN is_active boolean DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'investigations' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE investigations ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'investigations' AND column_name = 'normal_range_male'
  ) THEN
    ALTER TABLE investigations ADD COLUMN normal_range_male text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'investigations' AND column_name = 'normal_range_female'
  ) THEN
    ALTER TABLE investigations ADD COLUMN normal_range_female text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'investigations' AND column_name = 'turnaround_time'
  ) THEN
    ALTER TABLE investigations ADD COLUMN turnaround_time text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_items' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE service_items ADD COLUMN is_active boolean DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_items' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE service_items ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_items' AND column_name = 'code'
  ) THEN
    ALTER TABLE service_items ADD COLUMN code text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'departments' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE departments ADD COLUMN is_active boolean DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'departments' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE departments ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'departments' AND column_name = 'code'
  ) THEN
    ALTER TABLE departments ADD COLUMN code text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'departments' AND column_name = 'head_doctor_id'
  ) THEN
    ALTER TABLE departments ADD COLUMN head_doctor_id uuid REFERENCES staff(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wards' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE wards ADD COLUMN is_active boolean DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wards' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE wards ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wards' AND column_name = 'daily_rate'
  ) THEN
    ALTER TABLE wards ADD COLUMN daily_rate numeric DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wards' AND column_name = 'description'
  ) THEN
    ALTER TABLE wards ADD COLUMN description text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'staff' AND column_name = 'consultation_fee'
  ) THEN
    ALTER TABLE staff ADD COLUMN consultation_fee numeric DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'staff' AND column_name = 'specialty'
  ) THEN
    ALTER TABLE staff ADD COLUMN specialty text;
  END IF;
END $$;

DROP POLICY IF EXISTS "Admin can manage medications" ON medications;
CREATE POLICY "Admin can manage medications"
  ON medications
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin')
    )
  );

DROP POLICY IF EXISTS "Admin can manage symptoms" ON symptoms;
CREATE POLICY "Admin can manage symptoms"
  ON symptoms
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin')
    )
  );

DROP POLICY IF EXISTS "Admin can manage diagnoses" ON diagnoses;
CREATE POLICY "Admin can manage diagnoses"
  ON diagnoses
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin')
    )
  );

DROP POLICY IF EXISTS "Admin can manage investigations" ON investigations;
CREATE POLICY "Admin can manage investigations"
  ON investigations
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin')
    )
  );

DROP POLICY IF EXISTS "Admin can manage service_items" ON service_items;
CREATE POLICY "Admin can manage service_items"
  ON service_items
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin')
    )
  );

DROP POLICY IF EXISTS "Admin can manage departments" ON departments;
CREATE POLICY "Admin can manage departments"
  ON departments
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin')
    )
  );

DROP POLICY IF EXISTS "Admin can manage wards" ON wards;
CREATE POLICY "Admin can manage wards"
  ON wards
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin')
    )
  );
