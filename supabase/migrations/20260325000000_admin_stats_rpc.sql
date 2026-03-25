-- =============================================================
-- Admin Stats RPC
-- Exposes aggregate usage counts for the admin portal.
-- Returns only totals — no workspace-identifiable data.
-- =============================================================

CREATE OR REPLACE FUNCTION public.admin_get_stats()
RETURNS json
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT json_build_object(
    'total_sessions',      (SELECT COUNT(*)::int FROM public.pairing_sessions),
    'sessions_this_month', (SELECT COUNT(*)::int FROM public.pairing_sessions
                            WHERE created_at >= date_trunc('month', now())),
    'sessions_this_week',  (SELECT COUNT(*)::int FROM public.pairing_sessions
                            WHERE created_at >= date_trunc('week', now())),
    'total_people',        (SELECT COUNT(*)::int FROM public.people)
  );
$$;

-- Restrict execution to the service role (admin only).
-- Matches the pattern used by admin_get_workspaces and admin_get_feedback.
REVOKE ALL ON FUNCTION public.admin_get_stats() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_get_stats() FROM anon;
REVOKE ALL ON FUNCTION public.admin_get_stats() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_stats() TO service_role;
