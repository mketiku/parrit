-- =============================================================
-- Feedback Table
-- =============================================================

-- 1. Create the feedback table
CREATE TABLE IF NOT EXISTS public.feedback (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  user_id    uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  type       text        NOT NULL DEFAULT 'general'
                         CHECK (type IN ('bug', 'idea', 'general')),
  message    text        NOT NULL CHECK (char_length(message) <= 1000),
  page       text
);

-- 2. Enable RLS — authenticated users can only insert their own rows
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated users can submit feedback"
  ON public.feedback
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 3. Admin RPC to read all feedback (bypasses RLS via SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.admin_get_feedback()
RETURNS TABLE (
  id         uuid,
  created_at timestamptz,
  user_id    uuid,
  type       text,
  message    text,
  page       text
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
  SELECT f.id, f.created_at, f.user_id, f.type, f.message, f.page
  FROM public.feedback f
  ORDER BY f.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_get_feedback() TO authenticated;
