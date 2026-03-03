-- =============================================================
-- Parrit — Secure Admin & RBAC Setup
-- =============================================================

-- 1. Create a secure Audit Log table
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES auth.users(id),
  target_user_id uuid,
  action text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on audit logs
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can view all logs" ON public.admin_audit_logs;
CREATE POLICY "Admins can view all logs" ON public.admin_audit_logs 
  FOR SELECT USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- 2. Create the Admin Check Function
-- Supabase maps 'raw_app_meta_data' column to the 'app_metadata' JWT claim
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Secure Admin RPC: Fetch Workspace Data (Bypassing RLS)
CREATE OR REPLACE FUNCTION public.admin_get_workspace_data(target_user_id uuid)
RETURNS json
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access Denied: Admin role required.';
  END IF;

  -- Audit the access
  INSERT INTO public.admin_audit_logs (admin_id, target_user_id, action)
  VALUES (auth.uid(), target_user_id, 'viewed_private_workspace');

  RETURN json_build_object(
    'people', (SELECT json_agg(row_to_json(p)) FROM public.people p WHERE p.user_id = target_user_id),
    'boards', (SELECT json_agg(row_to_json(b)) FROM public.pairing_boards b WHERE b.user_id = target_user_id)
  );
END;
$$;

-- 4. Secure Admin RPC: List All Workspaces
CREATE OR REPLACE FUNCTION public.admin_get_workspaces()
RETURNS table (
  id uuid, 
  email text, 
  created_at timestamptz, 
  last_sign_in_at timestamptz, 
  public_view_enabled boolean
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access Denied: Admin role required.';
  END IF;

  -- Audit the list action
  INSERT INTO public.admin_audit_logs (admin_id, action)
  VALUES (auth.uid(), 'listed_all_workspaces');

  RETURN QUERY
  SELECT 
    u.id, 
    u.email::text, 
    u.created_at, 
    u.last_sign_in_at, 
    COALESCE(s.public_view_enabled, false)
  FROM auth.users u
  LEFT JOIN public.workspace_settings s ON s.user_id = u.id
  ORDER BY u.email;
END;
$$;

-- =============================================================
-- ONE-OFF COMMANDS (Run these as needed)
-- =============================================================

-- PROMOTE A USER TO ADMIN:
-- UPDATE auth.users 
-- SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb
-- WHERE email = [EMAIL_ADDRESS]';
