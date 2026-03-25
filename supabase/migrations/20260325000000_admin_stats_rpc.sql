-- =============================================================
-- Admin Stats RPC
-- Exposes aggregate usage counts for the admin portal Stats tab.
-- Returns only totals — no workspace-identifiable data.
-- Follows the same JWT role check + authenticated grant pattern
-- as admin_get_workspaces and admin_get_feedback.
-- =============================================================

DROP FUNCTION IF EXISTS public.admin_get_stats();

CREATE OR REPLACE FUNCTION public.admin_get_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF (auth.jwt() -> 'app_metadata' ->> 'role') IS DISTINCT FROM 'admin' THEN
    RAISE EXCEPTION 'Access Denied: Admin role required.';
  END IF;

  INSERT INTO public.admin_audit_logs (admin_id, action)
  VALUES (auth.uid(), 'viewed_stats');

  RETURN (
    SELECT json_build_object(
      'total_sessions',      (SELECT COUNT(*)::int FROM public.pairing_sessions),
      'sessions_this_month', (SELECT COUNT(*)::int FROM public.pairing_sessions
                              WHERE created_at >= date_trunc('month', now())),
      'sessions_this_week',  (SELECT COUNT(*)::int FROM public.pairing_sessions
                              WHERE created_at >= date_trunc('week', now())),
      'total_people',        (SELECT COUNT(*)::int FROM public.people)
    )
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_get_stats() TO authenticated;
