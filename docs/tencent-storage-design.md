# Tencent Storage Design — Heyin (和音)

## A. Storage Target

**Primary:** CloudBase Storage (for MVP)
**Future:** Tencent COS (for scale/CDN)

## B. Path Conventions

### Voice submission (participant recording)
```
projects/{projectId}/submissions/{submissionId}.{ext}
```
Example: `projects/abc123-uuid/submissions/def456-uuid.webm`

### Work version (mixed chorus export)
```
works/{workId}/versions/{versionId}.wav
```
Example: `works/work-uuid/versions/ver-uuid.wav`

## C. MIME-Aware Extension Mapping

| MIME Type | Extension |
|---|---|
| `audio/webm` | `.webm` |
| `audio/ogg` | `.ogg` |
| `audio/mp4` | `.m4a` |
| `audio/mpeg` | `.mp3` |
| `audio/wav` | `.wav` |
| (empty/unknown) | `.webm` (fallback) |

The `getAudioExtension()` helper in `src/services/supabase/storageUrls.ts` can be reused or extracted to a shared utility.

## D. audioPath Rule

**Database stores the Storage path, NOT the public URL.**

```
✅ audioPath = "projects/abc123/submissions/def456.webm"
❌ audioPath = "https://xxx.tcb.qcloud.la/..."
```

Playback resolver converts path → public URL at runtime.

Reasons:
1. Delete operations don't need to reverse-parse URLs
2. Switching CDN/bucket/domain doesn't require DB migration
3. Consistent with existing Supabase audio_path convention

## E. Upload Flow

```
1. Recording finishes → Blob (audio/webm, audio/mp4, etc.)
2. Generate UUID submission ID
3. Build path: projects/{projectId}/submissions/{submissionId}.{ext}
4. Upload to CloudBase Storage / COS
5. Store path in voice_submissions.audioPath
6. Playback: resolve path → signed/public URL → play
```

## F. Delete Behavior

When deleting a project:
1. Query all voice_submissions.audioPath for that project
2. Delete each file from Storage (best-effort)
3. Delete work_versions.audioPath files (best-effort)
4. Delete database documents (project + cascade children)
5. Do NOT fail the entire delete if a Storage file is missing

## G. Bucket / Folder Structure

```
heyin-audio/
  projects/
    {projectId}/
      submissions/
        {submissionId}.webm
        {submissionId}.m4a
  works/
    {workId}/
      versions/
        {versionId}.wav
```
