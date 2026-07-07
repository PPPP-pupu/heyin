-- ============================================================================
-- Heyin (和音) — Storage Bucket Configuration
-- ============================================================================
-- Target: Supabase Storage
-- Phase:  6.2 (Commit 2)
-- ============================================================================
--
-- Usage:
--   1. Run schema.sql first (tables + indexes + RLS).
--   2. Open the Supabase SQL Editor and run this file.
--   3. Or create the bucket manually in the Supabase dashboard and
--      run only the policy statements below.
--
-- Note: Supabase does not provide a CREATE BUCKET SQL command.
-- Buckets must be created via the dashboard (Storage → New Bucket)
-- or via the Management API. The SQL below creates the RLS policies
-- for a bucket named "heyin-audio".
-- ============================================================================

-- ============================================================================
-- MANUAL STEP (do this in the Supabase Dashboard)
-- ============================================================================
-- 1. Go to Storage → New Bucket.
-- 2. Name:           heyin-audio
-- 3. Public bucket:  YES (check this box)
-- 4. File size limit: 50 MB
-- 5. Allowed MIME types (optional for MVP):
--      audio/webm
--      audio/wav
--      audio/mpeg
--      audio/ogg
--      audio/mp4
-- ============================================================================

-- ============================================================================
-- STORAGE RLS POLICIES — heyin-audio bucket
-- ============================================================================
--
-- ⚠️  TEMPORARY MVP POLICY ⚠️
-- These policies allow any anonymous user to read and upload audio files.
-- This is acceptable for MVP testing with a small trusted group.
-- BEFORE production:
--   1. Require authentication.
--   2. Restrict upload paths to the authenticated user's projects.
--   3. Add file type and size validation at the policy level.
-- ============================================================================

-- Public read — anyone can stream/download audio from the bucket
drop policy if exists "Public read audio" on storage.objects;
create policy "Public read audio"
  on storage.objects for select
  using (bucket_id = 'heyin-audio');

-- Public upload — anyone can upload audio to the bucket
-- Post-MVP: restrict to authenticated users, scope by project path
drop policy if exists "Public upload audio" on storage.objects;
create policy "Public upload audio"
  on storage.objects for insert
  with check (bucket_id = 'heyin-audio');

-- Public delete — anyone can delete audio from the bucket (MVP ONLY)
-- ⚠️ UNSAFE for production: anyone can delete any file.
-- Post-MVP: restrict to the uploader or project owner.
drop policy if exists "Public delete audio" on storage.objects;
create policy "Public delete audio"
  on storage.objects for delete
  using (bucket_id = 'heyin-audio');

-- ============================================================================
-- RECOMMENDED PATH CONVENTIONS
-- ============================================================================
--
-- Voice submissions (recorded by participants, format: webm/ogg/mp4):
--   projects/{projectId}/submissions/{submissionId}.webm
--
-- Work versions (mixed chorus, format: wav):
--   works/{workId}/versions/{versionId}.wav
--
-- These paths are not enforced by the policies above (MVP simplicity).
-- Post-MVP: add CHECK clauses to the upload policy that validate path structure.
-- ============================================================================
