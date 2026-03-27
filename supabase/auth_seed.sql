-- Create a test user for E2E testing
-- Workspace: test-team
-- Password: password
-- Pseudo-email: test-team@parrit.com

-- 1. Insert into auth.users
insert into auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_sso_user,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token,
  email_change_token_current,
  reauthentication_token,
  created_at,
  updated_at
) values (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'test-team@parrit.com',
  -- bcrypt hash for 'password'
  '$2a$10$LHFUIpRDAAQY5OP.FlMxaOueVwitBPnjPBgFq8E/EdstPeV1TjRj.',
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"workspace_name":"test-team"}',
  false,
  '',
  '',
  '',
  '',
  '',
  '',
  now(),
  now()
) on conflict (id) do update set 
  email_confirmed_at = now(),
  email_change = '',
  email_change_token_new = '',
  recovery_token = '',
  confirmation_token = '',
  email_change_token_current = '',
  reauthentication_token = '';

-- 2. Ensure identity is created
insert into auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
) values (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  format('{"sub":"%s","email":"%s"}', '00000000-0000-0000-0000-000000000001', 'test-team@parrit.com')::jsonb,
  'email',
  'test-team@parrit.com',
  now(),
  now(),
  now()
) on conflict (provider, provider_id) do nothing;

-- 3. Insert into public.workspace_settings
insert into public.workspace_settings (
  user_id,
  onboarding_completed,
  public_view_enabled
) values (
  '00000000-0000-0000-0000-000000000001',
  true,
  false
) on conflict (user_id) do update set 
  onboarding_completed = true;
