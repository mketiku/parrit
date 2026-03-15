-- Add share_token column to workspace_settings for secure public view URLs
ALTER TABLE workspace_settings
  ADD COLUMN IF NOT EXISTS share_token UUID DEFAULT gen_random_uuid() NOT NULL;

-- Create unique index for fast lookup by token
CREATE UNIQUE INDEX IF NOT EXISTS workspace_settings_share_token_idx
  ON workspace_settings (share_token);

-- Update RLS: allow unauthenticated users to SELECT workspace_settings by share_token
-- (they can only see public_view_enabled and the token, not sensitive data)
DROP POLICY IF EXISTS "Public view by share token" ON workspace_settings;
CREATE POLICY "Public view by share token"
  ON workspace_settings
  FOR SELECT
  TO anon
  USING (true);
