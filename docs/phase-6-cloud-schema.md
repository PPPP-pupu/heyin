# Phase 6 — Cloud Schema Documentation

## Overview

This document describes the Supabase cloud schema for Heyin. The schema mirrors the existing local data model (`ChorusProject`, `VoiceSlot`, `VoiceSubmission`, `ChorusWork`, `ChorusWorkVersion`) but normalizes it into six relational tables and moves audio from IndexedDB to Supabase Storage.

## Table Map: Local Type → Cloud Table

### `projects` ← `ChorusProject`

| Cloud Column   | Local Field      | Notes |
|---|---|---|
| `id`           | `id`             | UUID |
| `share_id`     | `shareId`        | Unique, used in `/join/{shareId}` URLs |
| `title`        | `title`          | |
| `song_name`    | `songName`       | |
| `slots_per_line` | `slotsPerLine` | |
| `status`       | `status`         | `draft` / `open` / `locked` / `completed` |
| `created_at`   | `createdAt`      | |
| `updated_at`   | `updatedAt`      | |

Local fields NOT in cloud: `backingTrackUrl` (reserved), `lyricLines[]`, `voiceSlots[]` (split into separate tables).

### `lyric_lines` ← `ChorusProject.lyricLines[]`

| Cloud Column | Local Field | Notes |
|---|---|---|
| `id`         | `id`        | |
| `project_id` | (FK)        | Replaces `ChorusProject.id` parent |
| `line_index` | `index`     | |
| `text`       | `text`      | |

### `voice_slots` ← `ChorusProject.voiceSlots[]`

| Cloud Column | Local Field  | Notes |
|---|---|---|
| `id`         | `id`         | |
| `project_id` | (FK)         | Denormalized for fast project-level queries |
| `line_id`    | `lineId`     | FK → lyric_lines |
| `line_index` | `lineIndex`  | |
| `slot_index` | `slotIndex`  | |
| `lyric_text` | `lyricText`  | |
| `status`     | `status`     | `empty` / `claimed` / `filled` |
| `claimed_by` | `claimedBy`  | Guest UUID (references future guest_profiles) |
| `claimed_at` | `claimedAt`  | ISO timestamp — enables stale-claim detection |

Local fields NOT in cloud: `submission` (split into `voice_submissions` table).

### `voice_submissions` ← `VoiceSubmission`

| Cloud Column | Local Field  | Notes |
|---|---|---|
| `id`         | `id`         | |
| `project_id` | (FK)         | Denormalized for queries |
| `slot_id`    | `slotId`     | FK → voice_slots |
| `guest_id`   | `guestId`    | GuestProfile UUID |
| `nickname`   | `nickname`   | Snapshot at submission time |
| `province`   | `province`   | |
| `audio_path` | `audioId`    | Supabase Storage path (was IndexedDB key) |
| `duration`   | `duration`   | Seconds |
| `created_at` | `createdAt`  | |

Critical difference: `audioId` (IndexedDB key) → `audio_path` (Storage path). Audio blobs are stored in `heyin-audio` bucket instead of IndexedDB.

### `works` ← `ChorusWork`

| Cloud Column       | Local Field     | Notes |
|---|---|---|
| `id`               | `id`            | |
| `project_id`       | `projectId`     | |
| `title`            | `title`         | |
| `song_name`        | `songName`      | |
| `latest_version_id`| `latestVersionId` | |
| `audio_path`       | `audioId`       | Latest version WAV in Storage |
| `audio_duration`   | `audioDuration` | |
| `filled_slot_count`| `filledSlotCount` | |
| `total_slot_count` | `totalSlotCount` | |
| `lyric_line_count` | `lyricLineCount` | |

Local fields NOT in cloud: `participants[]` (can be derived from voice_submissions), `versions[]` (split into work_versions), `shareMetadata` (reserved).

### `work_versions` ← `ChorusWorkVersion`

| Cloud Column       | Local Field     | Notes |
|---|---|---|
| `id`               | `id`            | |
| `work_id`          | `workId`        | |
| `project_id`       | (FK)            | Denormalized |
| `audio_path`       | `audioId`       | This version's WAV in Storage |
| `duration`         | `duration`      | |
| `filled_slot_count`| `filledSlotCount` | |
| `total_slot_count` | `totalSlotCount` | |

## Why Audio Goes to Storage, Not Database

Supabase Storage is purpose-built for binary large objects. Storing audio there provides:

- **Signed URLs** — generate time-limited download links (post-MVP with auth).
- **CDN caching** — faster playback for large WAV files.
- **Direct upload** — participants can upload from the browser without proxying through an API route.
- **Cost efficiency** — Storage costs less per GB than database storage.

The `audio_path` column in `voice_submissions` and `work_versions` stores the path within the `heyin-audio` bucket. The app resolves paths to public URLs for playback.

## Path Conventions

| Content | Path Template |
|---|---|
| Voice submission (recording) | `projects/{projectId}/submissions/{submissionId}.webm` |
| Work version (mixed chorus) | `works/{workId}/versions/{versionId}.wav` |

## RLS Policy Status — TEMPORARY MVP

All tables currently use `using (true)` / `with check (true)` — meaning **any anonymous user** can read, insert, and (where applicable) update any row.

This is intentionally permissive for MVP testing with a small trusted group (3–10 people). The alternative — setting up Supabase Auth + JWT verification + row-level ownership checks — would add ~2–3 days to the Phase 6 timeline and should be done before any public or semi-public launch.

### Before Production — Must Tighten

| Table | Current | Post-MVP |
|---|---|---|
| `projects` | Anyone can read/write any project | Only creator can update; read requires share_id |
| `lyric_lines` | Anyone can read/write | Read only for join participants; write only for creator |
| `voice_slots` | Anyone can claim/update any slot | Only the claiming guest can update their claimed slot; server-side status transition validation |
| `voice_submissions` | Anyone can insert/read | Only the claiming guest can submit to their claimed slot |
| `works` | Anyone can read/write | Only the project creator can create works |
| `work_versions` | Anyone can read/write | Only the creator can create versions |
| `heyin-audio` bucket | Anyone can upload/read | Authenticated users only; path-scoped policies |

### Claim Race Condition (Future Concern)

The current MVP has a theoretical race: two guests could claim the same empty slot simultaneously. In local mode this is impossible (single browser). With Supabase this becomes possible. For MVP testing with a small trusted group, the risk is extremely low. Post-MVP: add a database-level constraint or `pg_try_advisory_lock` pattern.

## Executing the Schema

1. Open [Supabase SQL Editor](https://app.supabase.com/project/_/sql).
2. Paste and run `supabase/schema.sql`.
3. Create the `heyin-audio` bucket manually in the Storage dashboard (public, 50 MB limit).
4. Paste and run `supabase/storage.sql` to add the RLS policies.
