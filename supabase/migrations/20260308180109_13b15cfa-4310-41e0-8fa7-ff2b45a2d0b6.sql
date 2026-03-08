
-- Drop ALL existing policies on user_roles
DROP POLICY IF EXISTS "Users can read own role" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can read all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can insert own role" ON public.user_roles;
DROP POLICY IF EXISTS "Superadmins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Superadmins can delete roles" ON public.user_roles;

-- Recreate as explicitly PERMISSIVE
CREATE POLICY "Users can read own role"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can read all roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));

CREATE POLICY "Users can insert own role"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Superadmins can update roles"
  ON public.user_roles FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'superadmin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'superadmin'::app_role));

CREATE POLICY "Superadmins can delete roles"
  ON public.user_roles FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'superadmin'::app_role));
