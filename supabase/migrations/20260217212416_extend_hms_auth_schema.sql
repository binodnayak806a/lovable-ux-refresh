/*
  # Extend HMS Auth & Audit Schema

  ## Summary
  Extends the wellnotes HMS foundation with:
  1. Audit logging table for tracking all user actions
  2. User sessions table for tracking active logins
  3. Additional RLS policies for admin-level profile access
  4. Indexes for performance on common queries

  ## New Tables

  ### `audit_logs`
  - Immutable log of all user actions in the system
  - Columns: id, hospital_id, user_id, action, table_name, record_id, old_values, new_values, ip_address, user_agent, created_at
  - Insert-only: no UPDATE or DELETE policies

  ### `user_sessions`
  - Tracks active user sessions for security monitoring
  - Columns: id, user_id, hospital_id, ip_address, user_agent, last_active_at, created_at

  ## Security Changes
  - Audit logs: authenticated users can insert, admins can read all hospital logs
  - User sessions: users can only see their own sessions
  - Admin policy added to profiles: admins of same hospital can view all profiles

  ## Important Notes
  1. Audit logs are append-only by design — no update/delete policies
  2. All timestamps use timestamptz for proper timezone handling
  3. JSONB columns for flexible old/new value storage
*/

CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id uuid REFERENCES hospitals(id),
  user_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  table_name text,
  record_id text,
  old_values jsonb,
  new_values jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert audit logs"
  ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view hospital audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (
    hospital_id IN (
      SELECT hospital_id FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'superadmin')
    )
  );

CREATE TABLE IF NOT EXISTS user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  hospital_id uuid REFERENCES hospitals(id),
  ip_address text,
  user_agent text,
  last_active_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions"
  ON user_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions"
  ON user_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
  ON user_sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions"
  ON user_sessions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'profiles'
    AND policyname = 'Admins can view hospital profiles'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Admins can view hospital profiles"
        ON profiles FOR SELECT
        TO authenticated
        USING (
          hospital_id IS NOT NULL AND
          hospital_id IN (
            SELECT hospital_id FROM profiles
            WHERE id = auth.uid()
            AND role IN ('admin', 'superadmin')
          )
        )
    $policy$;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS audit_logs_hospital_id_idx ON audit_logs(hospital_id);
CREATE INDEX IF NOT EXISTS audit_logs_user_id_idx ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS audit_logs_created_at_idx ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS audit_logs_action_idx ON audit_logs(action);
CREATE INDEX IF NOT EXISTS user_sessions_user_id_idx ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS user_sessions_last_active_idx ON user_sessions(last_active_at DESC);
