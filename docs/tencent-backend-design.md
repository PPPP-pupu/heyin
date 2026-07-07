# Tencent Backend Design — Heyin (和音)

## A. Why Tencent Backend

- Better access for China domestic users
- More stable audio upload and playback within China
- Better future compatibility with WeChat sharing and Mini Program
- Existing repository abstraction layer makes provider swap feasible

## B. Target Architecture

```
Frontend H5:  Next.js → EdgeOne Pages / CloudBase Hosting
Backend DB:   Tencent CloudBase Database (NoSQL collections)
Storage:      Tencent COS or CloudBase Storage
```

## C. Collection Design

### projects

| Field | Type | Notes |
|---|---|---|
| `_id` | auto | CloudBase default |
| `id` | string | UUID |
| `shareId` | string | unique, indexed |
| `title` | string | |
| `songName` | string | |
| `slotsPerLine` | number | 1-10 |
| `status` | string | draft/open/locked/completed |
| `createdAt` | string | ISO |
| `updatedAt` | string | ISO |

### lyric_lines

| Field | Type | Notes |
|---|---|---|
| `_id` | auto | |
| `id` | string | UUID |
| `projectId` | string | FK to projects.id |
| `lineIndex` | number | |
| `text` | string | |

### voice_slots

| Field | Type | Notes |
|---|---|---|
| `_id` | auto | |
| `id` | string | UUID |
| `projectId` | string | FK |
| `lineId` | string | FK to lyric_lines.id |
| `lineIndex` | number | |
| `slotIndex` | number | |
| `lyricText` | string | |
| `status` | string | empty/claimed/filled |
| `claimedBy` | string | guest UUID |
| `claimedAt` | string | ISO |
| `updatedAt` | string | ISO |

### voice_submissions

| Field | Type | Notes |
|---|---|---|
| `_id` | auto | |
| `id` | string | UUID |
| `projectId` | string | FK |
| `slotId` | string | FK to voice_slots.id |
| `guestId` | string | |
| `nickname` | string | snapshot |
| `province` | string | |
| `audioPath` | string | COS/Storage path |
| `duration` | number | seconds |
| `createdAt` | string | ISO |

### works

| Field | Type | Notes |
|---|---|---|
| `_id` | auto | |
| `id` | string | UUID |
| `projectId` | string | FK |
| `title` | string | |
| `songName` | string | |
| `latestVersionId` | string | |
| `audioPath` | string | COS path |
| `audioDuration` | number | |
| `participants` | array | nicknames |
| `lyricLineCount` | number | |
| `filledSlotCount` | number | |
| `totalSlotCount` | number | |
| `versions` | array | version IDs |
| `createdAt` | string | ISO |

### work_versions

| Field | Type | Notes |
|---|---|---|
| `_id` | auto | |
| `id` | string | UUID |
| `workId` | string | FK |
| `projectId` | string | FK |
| `audioPath` | string | COS path |
| `duration` | number | |
| `filledSlotCount` | number | |
| `totalSlotCount` | number | |
| `createdAt` | string | ISO |

## D. Index Recommendations

```
projects.shareId              — ASC, unique
lyric_lines.projectId         — ASC
lyric_lines.projectId + lineIndex — ASC, ASC
voice_slots.projectId         — ASC
voice_slots.projectId + status — ASC, ASC
voice_submissions.projectId   — ASC
voice_submissions.slotId      — ASC
works.projectId               — ASC
work_versions.workId          — ASC
```

## E. Storage Path Conventions

```
Voice submission: projects/{projectId}/submissions/{submissionId}.{ext}
Work version:     works/{workId}/versions/{versionId}.wav
```

Audio paths stored in DB as COS/Storage relative paths, resolved to public URLs at playback time.

## F. Race Condition Note

Claim slot (`empty → claimed`) must eventually be atomic. For MVP, repository uses best-effort conditional update. Post-MVP: use Cloud Function or transactional logic.

## G. Security Notes

MVP may use permissive write rules for closed testing. Before public launch:

- Restrict project updates
- Restrict slot submission
- Prevent arbitrary deletes
- Add rate limiting
- Add auth/openid or guest token model
