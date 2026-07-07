-- ============================================================================
-- Heyin (和音) — Cloud Database Schema
-- ============================================================================
-- Target: Supabase PostgreSQL
-- Phase:  6.2 (Commit 2) — Schema definition only
-- ============================================================================
--
-- Usage:
--   1. Open the Supabase SQL Editor at https://app.supabase.com
--   2. Paste this entire file and run it.
--   3. Run storage.sql separately.
--
-- This file is designed to be safely re-run: all CREATE statements use
-- IF NOT EXISTS, and policies are dropped before re-creation.
-- ============================================================================

-- ============================================================================
-- EXTENSIONS
-- ============================================================================
create extension if not exists "uuid-ossp";

-- ============================================================================
-- TABLES
-- ============================================================================

-- --------------------------------------------------------------------------
-- projects — a single chorus project created by a user
-- --------------------------------------------------------------------------
create table if not exists projects (
  id              uuid primary key default gen_random_uuid(),
  share_id        text unique not null,
  title           text not null,
  song_name       text not null,
  slots_per_line  int not null,
  status          text not null default 'open',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint chk_project_status check (status in ('draft', 'open', 'locked', 'completed')),
  constraint chk_slots_per_line check (slots_per_line between 1 and 10)
);

-- --------------------------------------------------------------------------
-- lyric_lines — one lyric phrase per row, ordered by line_index
-- --------------------------------------------------------------------------
create table if not exists lyric_lines (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references projects(id) on delete cascade,
  line_index  int not null,
  text        text not null,

  constraint chk_line_index check (line_index >= 0)
);

-- --------------------------------------------------------------------------
-- voice_slots — empty/claimed/filled recording slots under each lyric line
-- --------------------------------------------------------------------------
create table if not exists voice_slots (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references projects(id) on delete cascade,
  line_id     uuid not null references lyric_lines(id) on delete cascade,
  line_index  int not null,
  slot_index  int not null,
  lyric_text  text not null,
  status      text not null default 'empty',
  claimed_by  text,
  claimed_at  timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  constraint chk_slot_status check (status in ('empty', 'claimed', 'filled')),
  constraint chk_slot_line_index check (line_index >= 0),
  constraint chk_slot_slot_index check (slot_index >= 0)
);

-- --------------------------------------------------------------------------
-- voice_submissions — a recorded voice attached to a slot
-- --------------------------------------------------------------------------
create table if not exists voice_submissions (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references projects(id) on delete cascade,
  slot_id     uuid not null references voice_slots(id) on delete cascade,
  guest_id    text,
  nickname    text not null,
  province    text,
  audio_path  text not null,
  duration    numeric not null,
  created_at  timestamptz not null default now(),

  constraint chk_duration_nonnegative check (duration >= 0)
);

-- --------------------------------------------------------------------------
-- works — a completed, shareable chorus composition
-- --------------------------------------------------------------------------
create table if not exists works (
  id                uuid primary key default gen_random_uuid(),
  project_id        uuid not null references projects(id) on delete cascade,
  title             text not null,
  song_name         text not null,
  latest_version_id uuid,
  audio_path        text,
  audio_duration    numeric,
  filled_slot_count int not null,
  total_slot_count  int not null,
  lyric_line_count  int not null,
  created_at        timestamptz not null default now()
);

-- --------------------------------------------------------------------------
-- work_versions — each "Generate Chorus" creates a new version row
-- --------------------------------------------------------------------------
create table if not exists work_versions (
  id                uuid primary key default gen_random_uuid(),
  work_id           uuid not null references works(id) on delete cascade,
  project_id        uuid not null references projects(id) on delete cascade,
  audio_path        text not null,
  duration          numeric not null,
  filled_slot_count int not null,
  total_slot_count  int not null,
  created_at        timestamptz not null default now(),

  constraint chk_version_duration_nonnegative check (duration >= 0)
);

-- ============================================================================
-- INDEXES
-- ============================================================================
create index if not exists idx_projects_share_id       on projects(share_id);
create index if not exists idx_lyric_lines_project      on lyric_lines(project_id);
create index if not exists idx_voice_slots_project      on voice_slots(project_id);
create index if not exists idx_voice_slots_line         on voice_slots(line_id);
create index if not exists idx_submissions_project      on voice_submissions(project_id);
create index if not exists idx_submissions_slot         on voice_submissions(slot_id);
create index if not exists idx_works_project            on works(project_id);
create index if not exists idx_work_versions_work       on work_versions(work_id);
create index if not exists idx_work_versions_project    on work_versions(project_id);

-- ============================================================================
-- RLS (Row Level Security)
-- ============================================================================
--
-- ⚠️  TEMPORARY MVP POLICY ⚠️
-- All policies below use public (anon) access without authentication.
-- This is acceptable for MVP testing with a small trusted group.
-- BEFORE production or any public launch beyond a small test group:
--   1. Require authentication (Supabase Auth or custom JWT).
--   2. Scope policies to the authenticated user's own projects/works.
--   3. Add server-side validation (claim conflict, duplicate submissions).
-- ============================================================================

-- Enable RLS on all tables
alter table projects          enable row level security;
alter table lyric_lines       enable row level security;
alter table voice_slots       enable row level security;
alter table voice_submissions enable row level security;
alter table works             enable row level security;
alter table work_versions     enable row level security;

-- --------------------------------------------------------------------------
-- projects — public policies
-- --------------------------------------------------------------------------
drop policy if exists "Public read projects"   on projects;
drop policy if exists "Public insert projects" on projects;
drop policy if exists "Public update projects" on projects;

create policy "Public read projects"   on projects for select using (true);
create policy "Public insert projects" on projects for insert with check (true);
create policy "Public update projects" on projects for update using (true);

-- --------------------------------------------------------------------------
-- lyric_lines — public policies
-- --------------------------------------------------------------------------
drop policy if exists "Public read lyric_lines"   on lyric_lines;
drop policy if exists "Public insert lyric_lines" on lyric_lines;

create policy "Public read lyric_lines"   on lyric_lines for select using (true);
create policy "Public insert lyric_lines" on lyric_lines for insert with check (true);

-- --------------------------------------------------------------------------
-- voice_slots — public policies
-- --------------------------------------------------------------------------
-- The update policy allows any client to change slot status (empty → claimed → filled).
-- The app's claimSlot/releaseClaim actions handle the business rules client-side.
-- Post-MVP: add a CHECK clause that enforces status transitions server-side.
-- Post-MVP: restrict updates to the slot's claimed_by guest.
-- --------------------------------------------------------------------------
drop policy if exists "Public read voice_slots"   on voice_slots;
drop policy if exists "Public insert voice_slots" on voice_slots;
drop policy if exists "Public update voice_slots" on voice_slots;

create policy "Public read voice_slots"   on voice_slots for select using (true);
create policy "Public insert voice_slots" on voice_slots for insert with check (true);
create policy "Public update voice_slots" on voice_slots for update using (true);

-- --------------------------------------------------------------------------
-- voice_submissions — public policies (no update — submission is immutable)
-- --------------------------------------------------------------------------
drop policy if exists "Public read voice_submissions"   on voice_submissions;
drop policy if exists "Public insert voice_submissions" on voice_submissions;

create policy "Public read voice_submissions"   on voice_submissions for select using (true);
create policy "Public insert voice_submissions" on voice_submissions for insert with check (true);

-- --------------------------------------------------------------------------
-- works — public policies
-- --------------------------------------------------------------------------
drop policy if exists "Public read works"   on works;
drop policy if exists "Public insert works" on works;
drop policy if exists "Public update works" on works;

create policy "Public read works"   on works for select using (true);
create policy "Public insert works" on works for insert with check (true);
create policy "Public update works" on works for update using (true);

-- --------------------------------------------------------------------------
-- work_versions — public policies (no update — version is immutable)
-- --------------------------------------------------------------------------
drop policy if exists "Public read work_versions"   on work_versions;
drop policy if exists "Public insert work_versions" on work_versions;

create policy "Public read work_versions"   on work_versions for select using (true);
create policy "Public insert work_versions" on work_versions for insert with check (true);
