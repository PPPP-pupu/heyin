# Phase 6.1 — QA Acceptance Criteria

## What Phase 6.1 Delivers

Cloud project metadata flow. Users on different devices can create, share, join, claim, and release slots via Supabase. Audio recording and upload remain local-only until Commit 7.

---

## QA Checklist

### 1. Cloud Create Project

| Step | Action | Expected |
|---|---|---|
| 1.1 | Open the app in cloud mode | Home page loads |
| 1.2 | Navigate to `/create` | Create form loads |
| 1.3 | Fill in title, song name, lyrics, slots per line | Form validates |
| 1.4 | Click **Create Project** | Redirected to `/project/{uuid}` |
| 1.5 | Check browser URL | ID is UUID format (xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx), not `proj-xxx` |
| 1.6 | Check Supabase `projects` table | 1 row exists with matching UUID |
| 1.7 | Check Supabase `lyric_lines` table | N rows (matching lyric count) |
| 1.8 | Check Supabase `voice_slots` table | N×slots rows, all status=`empty` |

**Status:** ⬜ PASS / ⬜ FAIL

### 2. Cloud Share

| Step | Action | Expected |
|---|---|---|
| 2.1 | On project page, click **Share** | Link copied |
| 2.2 | Paste the link | URL format: `{origin}/join/h-xxxxxxxx` |
| 2.3 | Confirm origin | Uses Vercel domain (not localhost) |

**Status:** ⬜ PASS / ⬜ FAIL

### 3. Cloud Join (Cross-Device)

| Step | Action | Expected |
|---|---|---|
| 3.1 | Open join link on another device/browser | Join page loads |
| 3.2 | Verify project info displayed | Title, song name, lyrics, progress bar |
| 3.3 | Verify cloud notice | Amber banner: "Cloud recording upload will be enabled in the next phase." |
| 3.4 | Verify empty slots are clickable | Dashed border, "+" icon |

**Status:** ⬜ PASS / ⬜ FAIL

### 4. Cloud Claim

| Step | Action | Expected |
|---|---|---|
| 4.1 | Enter nickname → Join Chorus | Nickname gate passes |
| 4.2 | Click an empty slot | Slot changes to claimed (amber pulse, "You are recording...") |
| 4.3 | Verify "Slot Claimed" panel appears | Shows lyric text + cloud notice + Release Slot button |
| 4.4 | Verify RecordingModal does NOT open | No recording UI, no microphone access |
| 4.5 | Check Supabase `voice_slots` | Row status=`claimed`, `claimed_by` = guest UUID, `claimed_at` = timestamp |

**Status:** ⬜ PASS / ⬜ FAIL

### 5. Cloud Release

| Step | Action | Expected |
|---|---|---|
| 5.1 | Click **Release Slot** | Panel closes |
| 5.2 | Verify slot returns to empty | Dashed border, "+" icon |
| 5.3 | Check Supabase `voice_slots` | Row status=`empty`, `claimed_by` = null, `claimed_at` = null |

**Status:** ⬜ PASS / ⬜ FAIL

### 6. Cloud Recording Block

| Step | Action | Expected |
|---|---|---|
| 6.1 | On cloud project page (creator), click empty slot | Nothing happens (slot selection disabled in cloud) |
| 6.2 | On cloud join page (participant), after claiming | "Slot Claimed" panel has only Release Slot button |
| 6.3 | Verify no audio is saved | No new rows in `voice_submissions`. No files in Supabase Storage |

**Status:** ⬜ PASS / ⬜ FAIL

### 7. Local Mode Regression

| Step | Action | Expected |
|---|---|---|
| 7.1 | Set `NEXT_PUBLIC_HEYIN_STORAGE_MODE=local` | App uses localStorage + IndexedDB |
| 7.2 | Create project | Works with `proj-xxx` ID |
| 7.3 | Join, record, submit | Full recording flow works |
| 7.4 | Playback, export, work page | All function normally |

**Status:** ⬜ PASS / ⬜ FAIL

---

## Go / No-Go for Commit 7

**Commit 7 (Cloud Audio Upload) should only start after:**

- [ ] All 7 QA sections above pass.
- [ ] Cloud create → UUID works.
- [ ] Cloud join cross-device works.
- [ ] Cloud claim/release via Supabase works.
- [ ] Cloud recording remains intentionally blocked.
- [ ] Local mode regression is clean.

**Blockers:** (fill in if any)

---

## Test Environment

| Item | Value |
|---|---|
| Supabase Project URL | `https://jdupleowmmdiflutwlqc.supabase.co` |
| Vercel URL | (fill after deploy) |
| Test date | (fill) |
| Tester | (fill) |
