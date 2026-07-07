# Vercel Deployment Guide — Heyin (和音)

## Current Phase

Phase 6.1 — Cloud Project Metadata Flow.

- Cloud create project ✅
- Cloud load project ✅
- Cloud join (via shareId) ✅
- Cloud claim / release slots ✅
- Cloud recording upload 🔴 (intentionally blocked until Commit 7)

---

## A. Required Vercel Environment Variables

Add these three variables in **Vercel Project Settings → Environment Variables**:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `sb_publishable_xxxxx` (or your anon key) |
| `NEXT_PUBLIC_HEYIN_STORAGE_MODE` | `cloud` |

> **Important:** All three MUST be set. If `NEXT_PUBLIC_HEYIN_STORAGE_MODE` is missing or set to `local`, the app will use localStorage + IndexedDB and won't connect to Supabase.

---

## B. Deployment Steps

### 1. Push code to GitHub

```bash
cd heyin
git init  # if not already a git repo
git add .
git commit -m "Phase 6.1 — Cloud project metadata flow ready for Vercel"
git remote add origin https://github.com/YOUR_USER/heyin.git
git push -u origin main
```

### 2. Import into Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New Project**.
2. Import the GitHub repository.
3. Framework preset: **Next.js** (auto-detected).
4. Expand **Environment Variables** and add the 3 variables from section A.
5. Click **Deploy**.

### 3. Wait for build

Vercel runs `next build` automatically. Confirm the build succeeds.

### 4. Open the production URL

Once deployed, open `https://your-project.vercel.app`.

---

## C. Supabase Requirements (Before Deploy)

All of these should already be done from local testing:

1. **schema.sql executed** — Run `supabase/schema.sql` in Supabase SQL Editor.
   - Creates tables: `projects`, `lyric_lines`, `voice_slots`, `voice_submissions`, `works`, `work_versions`.
   - Enables RLS with public MVP policies.

2. **storage bucket created** — In Supabase Dashboard: Storage → New Bucket → `heyin-audio` → Public.

3. **storage.sql policies** — Run `supabase/storage.sql` in SQL Editor for Storage RLS.

4. **Required tables for Phase 6.1 testing:**
   - `projects`
   - `lyric_lines`
   - `voice_slots`

   (`voice_submissions`, `works`, `work_versions` are for future commits.)

---

## D. Production QA Checklist

Run through these steps on the Vercel production URL (not localhost):

| # | Step | Expected Result |
|---|---|---|
| 1 | Open Vercel URL | Home page loads |
| 2 | Click **Create Chorus Project** | Create form loads |
| 3 | Create a project with lyrics | Redirected to `/project/{uuid}` (NOT `proj-xxx`) |
| 4 | Check Supabase Table Editor | `projects`: 1 row with UUID id. `lyric_lines`: N rows. `voice_slots`: N×slots rows |
| 5 | Click **Share** on project page | Copied URL uses Vercel domain (e.g. `https://heyin.vercel.app/join/h-xxxxxx`), NOT localhost |
| 6 | Open `/join/{shareId}` on **another device** (phone, tablet, or incognito) | Join page loads with project title, lyrics, empty slots, cloud recording notice |
| 7 | Enter nickname, click an empty slot | Slot becomes claimed (amber UI). "Slot Claimed" panel appears. RecordingModal does NOT open |
| 8 | Check Supabase `voice_slots` | Claimed slot: `status = 'claimed'`, `claimed_by = 'guest-xxx'`, `claimed_at = timestamp` |
| 9 | Click **Release Slot** | Panel closes. Slot returns to empty |
| 10 | Check Supabase `voice_slots` | Released slot: `status = 'empty'`, `claimed_by = null`, `claimed_at = null` |
| 11 | Confirm RecordingModal blocked | Cloud notice says "recording upload will be enabled in the next phase" |
| 12 | Try another slot with a different guest (another device) | Claim works independently |

---

## E. Common Issues

| Symptom | Likely Cause | Fix |
|---|---|---|
| Share link shows `localhost` | Clicked Share from local dev, not Vercel | Copy URL manually from Vercel address bar |
| Phone can't open link | URL is `http://` not `https://` | Vercel auto-redirects to HTTPS |
| Project creation fails | Missing Vercel env vars or RLS not enabled | Check Vercel dashboard env vars and Supabase RLS policies |
| Project ID is `proj-xxx` not UUID | Cloud mode not active | Verify `NEXT_PUBLIC_HEYIN_STORAGE_MODE=cloud` in Vercel env vars |
| Claim fails | Voice slots RLS update policy missing | Run `supabase/schema.sql` again in Supabase SQL Editor |
| Build fails on Vercel | Node version mismatch or lint errors | Run `npm run lint && npm run build` locally first |

---

> ⚠️ This is a cloud metadata test deployment.
> Cloud recording upload and audio playback from Supabase Storage are **not implemented yet** (planned for Commit 7).
> The deployment is for verifying the project creation → share → join → claim → release flow.
