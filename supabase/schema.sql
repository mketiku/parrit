-- =============================================================
-- Parrit — Full Supabase Setup (Idempotent Reset + Build)
-- Paste this entire file into Supabase → SQL Editor → New Query
-- It safely tears down any previous state before recreating.
-- =============================================================


-- ============================================================
-- STEP 1: TEARDOWN (clear any previous partial state)
-- ============================================================

drop table if exists public.pairing_history cascade;
drop table if exists public.pairing_sessions cascade;
drop table if exists public.pairing_boards cascade;
drop table if exists public.people cascade;
drop table if exists public.pairing_templates cascade;


-- ============================================================
-- STEP 2: CREATE TABLES
-- ============================================================

-- ---- People ----
create table public.people (
  id               uuid         primary key default gen_random_uuid(),
  user_id          uuid         not null,
  name             text         not null,
  avatar_color_hex text         not null default '#6366f1',
  created_at       timestamptz  not null default now(),

  constraint people_user_id_fk
    foreign key (user_id) references auth.users(id) on delete cascade
);

-- ---- Pairing Boards ----
-- Note: If updating an existing DB, run: 
-- ALTER TABLE public.pairing_boards DROP COLUMN goal_text;
-- ALTER TABLE public.pairing_boards ADD COLUMN goals jsonb NOT NULL DEFAULT '[]'::jsonb;
-- ALTER TABLE public.pairing_boards ADD COLUMN is_locked boolean NOT NULL DEFAULT false;
create table public.pairing_boards (
  id                  uuid         primary key default gen_random_uuid(),
  user_id             uuid         not null,
  name                text         not null,
  is_exempt           boolean      not null default false,
  is_locked           boolean      not null default false,
  goals               jsonb        not null default '[]'::jsonb,
  meeting_link        text,
  sort_order          integer      not null default 0,
  assigned_person_ids uuid[]       not null default '{}',
  created_at          timestamptz  not null default now(),

  constraint pairing_boards_user_id_fk
    foreign key (user_id) references auth.users(id) on delete cascade
);

-- 3. Create the `pairing_sessions` table (The "snapshot" event)
create table public.pairing_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  session_date date default current_date not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Create the `pairing_history` table (Where everyone actually was)
create table public.pairing_history (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  session_id uuid references public.pairing_sessions(id) on delete cascade not null,
  person_id uuid references public.people(id) on delete cascade not null,
  board_id uuid references public.pairing_boards(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);


-- ============================================================
-- STEP 3: INDEXES
-- ============================================================

create index people_user_id_idx       on public.people(user_id);
create index boards_user_id_idx       on public.pairing_boards(user_id);
create index boards_sort_order_idx    on public.pairing_boards(user_id, sort_order);

-- --- Indexes for performance ---
create index idx_sessions_user_id on public.pairing_sessions(user_id);
create index idx_history_user_id on public.pairing_history(user_id);
create index idx_history_session_id on public.pairing_history(session_id);
create index idx_history_person_id on public.pairing_history(person_id);


-- ============================================================
-- STEP 4: ROW LEVEL SECURITY
-- ============================================================

alter table public.people         enable row level security;
alter table public.pairing_boards enable row level security;

-- People policies
create policy "people_select_own"
  on public.people for select
  using (auth.uid() = public.people.user_id);

create policy "people_insert_own"
  on public.people for insert
  with check (auth.uid() = public.people.user_id);

create policy "people_update_own"
  on public.people for update
  using (auth.uid() = public.people.user_id);

create policy "people_delete_own"
  on public.people for delete
  using (auth.uid() = public.people.user_id);

-- Pairing boards policies
create policy "boards_select_own"
  on public.pairing_boards for select
  using (auth.uid() = public.pairing_boards.user_id);

create policy "boards_insert_own"
  on public.pairing_boards for insert
  with check (auth.uid() = public.pairing_boards.user_id);

create policy "boards_update_own"
  on public.pairing_boards for update
  using (auth.uid() = public.pairing_boards.user_id);

create policy "boards_delete_own"
  on public.pairing_boards for delete
  using (auth.uid() = public.pairing_boards.user_id);

-- Pairing sessions policies
alter table public.pairing_sessions enable row level security;

create policy "sessions_select_own"
  on public.pairing_sessions for select
  using (auth.uid() = public.pairing_sessions.user_id);

create policy "sessions_insert_own"
  on public.pairing_sessions for insert
  with check (auth.uid() = public.pairing_sessions.user_id);

create policy "sessions_delete_own"
  on public.pairing_sessions for delete
  using (auth.uid() = public.pairing_sessions.user_id);

-- Pairing history policies
alter table public.pairing_history enable row level security;

create policy "history_select_own"
  on public.pairing_history for select
  using (auth.uid() = public.pairing_history.user_id);

create policy "history_insert_own"
  on public.pairing_history for insert
  with check (auth.uid() = public.pairing_history.user_id);

create policy "history_delete_own"
  on public.pairing_history for delete
  using (auth.uid() = public.pairing_history.user_id);


-- ============================================================
-- DONE
-- Tables: public.people, public.pairing_boards, public.pairing_sessions, public.pairing_history
-- RLS:    Each workspace (auth user) can only see/edit its own rows.
-- ============================================================
--
-- AUTH SETTINGS (manual — do this in the Supabase Dashboard):
--   Authentication → Providers → Email:
--     [ ] Confirm email       ← DISABLE
--     [ ] Secure email change ← DISABLE (optional)
--
-- These settings allow workspace sign-ups to work immediately
-- without needing an email inbox.
-- ============================================================

-- 5. Create the `pairing_templates` table
create table if not exists public.pairing_templates (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  boards jsonb not null, -- Stores board names and goals
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. Create the `workspace_settings` table (For public view-only access)
create table if not exists public.workspace_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  public_view_enabled boolean not null default false,
  onboarding_completed boolean not null default false,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for templates
alter table public.pairing_templates enable row level security;

create policy "templates_select_own"
  on public.pairing_templates for select
  using (auth.uid() = public.pairing_templates.user_id);

create policy "templates_insert_own"
  on public.pairing_templates for insert
  with check (auth.uid() = public.pairing_templates.user_id);

create policy "templates_update_own"
  on public.pairing_templates for update
  using (auth.uid() = public.pairing_templates.user_id);

create policy "templates_delete_own"
  on public.pairing_templates for delete
  using (auth.uid() = public.pairing_templates.user_id);

-- RLS for settings
alter table public.workspace_settings enable row level security;

create policy "settings_select_own" on public.workspace_settings for select using (auth.uid() = user_id);
create policy "settings_upsert_own" on public.workspace_settings for insert with check (auth.uid() = user_id);
create policy "settings_update_own" on public.workspace_settings for update using (auth.uid() = user_id);
create policy "settings_public_read" on public.workspace_settings for select using (true);

-- ============================================================
-- STEP 5: PERMISSIONS (Backup)
-- ============================================================

grant select on public.workspace_settings to anon, authenticated;
grant select on public.workspace_settings to anon, authenticated;

-- Update boards/people for public view
create policy "boards_public_select" on public.pairing_boards for select
using (exists (select 1 from public.workspace_settings s where s.user_id = public.pairing_boards.user_id and s.public_view_enabled = true));

create policy "people_public_select" on public.people for select
using (exists (select 1 from public.workspace_settings s where s.user_id = public.people.user_id and s.public_view_enabled = true));

grant select on public.pairing_boards to anon, authenticated;
grant select on public.people to anon, authenticated;
grant select on public.pairing_sessions to anon, authenticated;
grant select on public.pairing_history to anon, authenticated;

-- ============================================================
-- DONE
-- ============================================================
