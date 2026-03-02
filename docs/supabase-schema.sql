-- =============================================================
-- Parrit - Complete Supabase Setup
-- Run this entire file in Supabase → SQL Editor → New Query
-- =============================================================

-- ---- 1. People Table ----
-- Stores team members per workspace (scoped by auth user)
create table if not exists public.people (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  name             text not null,
  avatar_color_hex text not null default '#6366f1',
  created_at       timestamptz default now()
);

alter table public.people enable row level security;

-- Only the authenticated workspace owner can read/write their people
create policy "Workspace members manage their own people"
  on public.people
  for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---- 2. Pairing Boards Table ----
-- Stores pairing boards and their current person assignments per workspace
create table if not exists public.pairing_boards (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  name                text not null,
  is_exempt           boolean not null default false,
  goal_text           text,
  meeting_link        text,
  sort_order          integer not null default 0,
  -- Stored as array of UUIDs referencing people.id
  assigned_person_ids uuid[] not null default '{}',
  created_at          timestamptz default now()
);

alter table public.pairing_boards enable row level security;

-- Only the authenticated workspace owner can read/write their boards
create policy "Workspace members manage their own boards"
  on public.pairing_boards
  for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---- 3. Optional: Helpful indexes ----
create index if not exists people_user_id_idx on public.people(user_id);
create index if not exists boards_user_id_idx on public.pairing_boards(user_id);

-- =============================================================
-- Supabase Auth Settings (manual steps — not SQL)
-- =============================================================
-- In Supabase Dashboard → Authentication → Providers → Email:
--   ✅ Disable "Confirm email"      (avoids email-delivery friction)
--   ✅ Disable "Secure email change" (optional, for simplicity)
-- These settings allow workspaces to sign up and log in
-- immediately without requiring email confirmation.
-- =============================================================
