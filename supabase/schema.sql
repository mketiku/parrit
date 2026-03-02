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
create table public.pairing_boards (
  id                  uuid         primary key default gen_random_uuid(),
  user_id             uuid         not null,
  name                text         not null,
  is_exempt           boolean      not null default false,
  goal_text           text,
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
