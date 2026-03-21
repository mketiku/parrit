-- =============================================================
-- Optimized Admin RPC Suite (v2) - Added Share Token Support
-- =============================================================

-- 1. Performance: Add indexes to audit logs for faster lookups/reporting
CREATE INDEX IF NOT EXISTS admin_audit_logs_admin_id_idx ON public.admin_audit_logs (admin_id);
CREATE INDEX IF NOT EXISTS admin_audit_logs_created_at_idx ON public.admin_audit_logs (created_at DESC);

-- 2. Data Health: Ensure all users have a workspace_settings record with a share_token
-- This prevents null share_tokens from breaking admin inspect links.
INSERT INTO public.workspace_settings (user_id)
SELECT id FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

-- 3. Hardened RPC: List All Workspaces
DROP FUNCTION IF EXISTS public.admin_get_workspaces();
CREATE OR REPLACE FUNCTION public.admin_get_workspaces()
RETURNS table (
  id uuid, 
  email text, 
  created_at timestamptz, 
  last_sign_in_at timestamptz, 
  public_view_enabled boolean,
  share_token uuid
)
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- Security: Verify admin role from JWT
  IF (auth.jwt() -> 'app_metadata' ->> 'role') IS DISTINCT FROM 'admin' THEN
    RAISE EXCEPTION 'Access Denied: Admin role required.';
  END IF;

  -- Audit: Record access
  INSERT INTO public.admin_audit_logs (admin_id, action)
  VALUES (auth.uid(), 'listed_all_workspaces');

  RETURN QUERY
  SELECT 
    u.id, 
    u.email::text, 
    u.created_at, 
    u.last_sign_in_at, 
    COALESCE(s.public_view_enabled, false),
    s.share_token
  FROM auth.users u
  LEFT JOIN public.workspace_settings s ON s.user_id = u.id
  ORDER BY u.email ASC NULLS LAST;
END;
$$;

-- 4. Hardened RPC: Fetch Full Workspace Data (Bypassing RLS)
CREATE OR REPLACE FUNCTION public.admin_get_workspace_data(target_user_id uuid)
RETURNS json
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- Security: Verify admin role
  IF (auth.jwt() -> 'app_metadata' ->> 'role') IS DISTINCT FROM 'admin' THEN
    RAISE EXCEPTION 'Access Denied: Admin role required.';
  END IF;

  -- Audit: Record the private access
  INSERT INTO public.admin_audit_logs (admin_id, target_user_id, action)
  VALUES (auth.uid(), target_user_id, 'viewed_private_workspace');

  RETURN json_build_object(
    'people', (SELECT json_agg(row_to_json(p)) FROM public.people p WHERE p.user_id = target_user_id),
    'boards', (SELECT json_agg(row_to_json(b)) FROM public.pairing_boards b WHERE b.user_id = target_user_id)
  );
END;
$$;

-- 5. Permissions
GRANT EXECUTE ON FUNCTION public.admin_get_workspaces() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_workspace_data(uuid) TO authenticated;
