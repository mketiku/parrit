-- =============================================================
-- Admin Feedback Management (v2 - Mark as Read)
-- =============================================================

-- 1. Add is_read column if it doesn't exist
ALTER TABLE public.feedback 
ADD COLUMN IF NOT EXISTS is_read BOOLEAN NOT NULL DEFAULT false;

-- 2. Update the RPC to mark as read (admin only)
CREATE OR REPLACE FUNCTION public.admin_mark_feedback_read(feedback_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- Check if the user is an admin
  IF (auth.jwt() -> 'app_metadata' ->> 'role') IS DISTINCT FROM 'admin' THEN
    RAISE EXCEPTION 'Access Denied: Admin role required.';
  END IF;

  -- Audit the action
  INSERT INTO public.admin_audit_logs (admin_id, action)
  VALUES (auth.uid(), 'marked_feedback_as_read_' || feedback_id::text);

  -- Mark as read
  UPDATE public.feedback
  SET is_read = true
  WHERE id = feedback_id;
END;
$$;

-- 3. Drop and recreate the getter with updated return type (includes is_read)
DROP FUNCTION IF EXISTS public.admin_get_feedback();
CREATE FUNCTION public.admin_get_feedback()
RETURNS TABLE (
  id         uuid,
  created_at timestamptz,
  user_id    uuid,
  type       text,
  message    text,
  page       text,
  is_read    boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF (auth.jwt() -> 'app_metadata' ->> 'role') IS DISTINCT FROM 'admin' THEN
    RAISE EXCEPTION 'Access Denied: Admin role required.';
  END IF;

  INSERT INTO public.admin_audit_logs (admin_id, action)
  VALUES (auth.uid(), 'listed_all_feedback');

  RETURN QUERY
  SELECT f.id, f.created_at, f.user_id, f.type, f.message, f.page, f.is_read
  FROM public.feedback f
  WHERE f.is_read = false -- Only show unread by default for now
  ORDER BY f.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_mark_feedback_read(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_feedback() TO authenticated;
