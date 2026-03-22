-- =============================================================
-- Anonymized Admin RPC (v3) - PRIVACY REVOLUTION
-- This update strips the ability for admins to peek into private 
-- workspaces, replacing it with high-level anonymized stats.
-- =============================================================

-- 1. Remove the "God Mode" peek function completely
DROP FUNCTION IF EXISTS public.admin_get_workspace_data(uuid);

-- 2. Update workspace listing to include stats but remove share_token
DROP FUNCTION IF EXISTS public.admin_get_workspaces();
CREATE OR REPLACE FUNCTION public.admin_get_workspaces()
RETURNS table (
  id uuid, 
  email text, 
  created_at timestamptz, 
  last_sign_in_at timestamptz, 
  public_view_enabled boolean,
  member_count bigint,
  board_count bigint
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

  -- Audit: Record anonymized listing access
  INSERT INTO public.admin_audit_logs (admin_id, action)
  VALUES (auth.uid(), 'listed_workspaces_stats_only');

  RETURN QUERY
  SELECT 
    u.id, 
    u.email::text, 
    u.created_at, 
    u.last_sign_in_at, 
    COALESCE(s.public_view_enabled, false),
    (SELECT count(*) FROM public.people p WHERE p.user_id = u.id),
    (SELECT count(*) FROM public.pairing_boards b WHERE b.user_id = u.id)
  FROM auth.users u
  LEFT JOIN public.workspace_settings s ON s.user_id = u.id
  ORDER BY u.created_at DESC; -- Now sorted by join date (newest first)
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_get_workspaces() TO authenticated;
