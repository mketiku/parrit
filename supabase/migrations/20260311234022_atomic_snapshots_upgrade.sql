-- Add snapshot_data column to pairing_sessions for "Polaroid" history (Strategy #2)
ALTER TABLE public.pairing_sessions ADD COLUMN IF NOT EXISTS snapshot_data JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Create an Atomic Save Function (Strategy #1)
-- This ensures a session and its history rows are created together or not at all.
CREATE OR REPLACE FUNCTION public.save_pairing_session(
  p_user_id UUID,
  p_session_date DATE,
  p_snapshot_data JSONB,
  p_history_rows JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_session_id UUID;
BEGIN
  -- 1. Insert the session with the JSON snapshot
  INSERT INTO public.pairing_sessions (user_id, session_date, snapshot_data)
  VALUES (p_user_id, p_session_date, p_snapshot_data)
  RETURNING id INTO v_session_id;

  -- 2. Insert the normalized history rows for analytics (Heatmap/Timeline)
  -- We parse the JSONB array into rows
  INSERT INTO public.pairing_history (
    user_id,
    session_id,
    person_id,
    board_id,
    person_name,
    board_name
  )
  SELECT 
    p_user_id,
    v_session_id,
    (row->>'person_id')::UUID,
    (row->>'board_id')::UUID,
    (row->>'person_name'),
    (row->>'board_name')
  FROM jsonb_array_elements(p_history_rows) AS row;

  RETURN v_session_id;
END;
$$;
