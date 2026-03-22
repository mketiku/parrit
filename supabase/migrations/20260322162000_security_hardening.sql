-- =============================================================
-- Security Hardening (v1)
-- Addressing critical vulnerabilities identified in audit.
-- =============================================================

-- 1. Fix workspace_settings RLS: Stop leaking private user IDs and tokens
-- Previously 'TO anon USING (true)' allowed anyone to dump the entire table.
DROP POLICY IF EXISTS "Public view by share token" ON public.workspace_settings;
CREATE POLICY "Public view by share token"
  ON public.workspace_settings
  FOR SELECT
  TO anon
  USING (public_view_enabled = true);

-- 2. Harden save_pairing_session RPC: Derive user_id from auth.uid()
-- Previously accepted p_user_id from the client, which is a trust-boundary violation.
CREATE OR REPLACE FUNCTION public.save_pairing_session(
  p_session_date DATE, -- Shifted parameters to remove p_user_id
  p_snapshot_data JSONB,
  p_history_rows JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_session_id UUID;
  v_user_id UUID := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 1. Insert the session with the JSON snapshot
  INSERT INTO public.pairing_sessions (user_id, session_date, snapshot_data)
  VALUES (v_user_id, p_session_date, p_snapshot_data)
  RETURNING id INTO v_session_id;

  -- 2. Insert the normalized history rows
  INSERT INTO public.pairing_history (
    user_id,
    session_id,
    person_id,
    board_id,
    person_name,
    board_name
  )
  SELECT 
    v_user_id,
    v_session_id,
    (row->>'person_id')::UUID,
    (row->>'board_id')::UUID,
    (row->>'person_name'),
    (row->>'board_name')
  FROM jsonb_array_elements(p_history_rows) AS row;

  RETURN v_session_id;
END;
$$;

-- Old version cleanup (if it had 4 params)
-- Note: PostgreSQL supports function overloading, so we might need to drop the old one explicitly 
-- to avoid confusion, but Supabase RPC usually calls the latest matching one.
-- To be safe, let's drop the old signature.
DROP FUNCTION IF EXISTS public.save_pairing_session(UUID, DATE, JSONB, JSONB);
