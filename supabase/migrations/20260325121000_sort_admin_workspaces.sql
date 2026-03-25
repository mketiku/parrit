-- =============================================================
-- Update admin_get_workspaces sorting
-- Sort by recently created (newest first) as primary,
-- then by email (a-z) as secondary.
-- =============================================================

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
  VALUES (auth.uid(), 'listed_workspaces_v4_sorted');

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
  ORDER BY u.created_at DESC, u.email ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_get_workspaces() TO authenticated;
