# Tencent CloudBase Collection Schema — Heyin (和音)

Uses camelCase field names to match the TypeScript app model.

---

## projects

| Field | Type | Required | Example |
|---|---|---|---|
| `id` | string | ✅ | `"abc123-uuid"` |
| `shareId` | string | ✅ | `"h-a1b2c3d4"` |
| `title` | string | ✅ | `"十年大合唱"` |
| `songName` | string | ✅ | `"十年"` |
| `slotsPerLine` | number | ✅ | `3` |
| `status` | string | ✅ | `"open"` |
| `createdAt` | string | ✅ | `"2026-07-08T..."` |
| `updatedAt` | string | ✅ | `"2026-07-08T..."` |

**Index:** `shareId` (unique)

---

## lyric_lines

| Field | Type | Required | Example |
|---|---|---|---|
| `id` | string | ✅ | `"line-uuid"` |
| `projectId` | string | ✅ | `"abc123-uuid"` |
| `lineIndex` | number | ✅ | `0` |
| `text` | string | ✅ | `"如果那两个字没有颤抖"` |

**Index:** `projectId + lineIndex`

---

## voice_slots

| Field | Type | Required | Example |
|---|---|---|---|
| `id` | string | ✅ | `"slot-uuid"` |
| `projectId` | string | ✅ | `"abc123-uuid"` |
| `lineId` | string | ✅ | `"line-uuid"` |
| `lineIndex` | number | ✅ | `0` |
| `slotIndex` | number | ✅ | `0` |
| `lyricText` | string | ✅ | `"如果那两个字没有颤抖"` |
| `status` | string | ✅ | `"empty"` |
| `claimedBy` | string | ❌ | `"guest-uuid"` |
| `claimedAt` | string | ❌ | `"2026-07-08T..."` |
| `updatedAt` | string | ✅ | `"2026-07-08T..."` |

**Index:** `projectId`, `projectId + status`

**Status values:** `empty` / `claimed` / `filled`

---

## voice_submissions

| Field | Type | Required | Example |
|---|---|---|---|
| `id` | string | ✅ | `"sub-uuid"` |
| `projectId` | string | ✅ | `"abc123-uuid"` |
| `slotId` | string | ✅ | `"slot-uuid"` |
| `guestId` | string | ❌ | `"guest-uuid"` |
| `nickname` | string | ✅ | `"小雨"` |
| `province` | string | ❌ | `"浙江"` |
| `audioPath` | string | ✅ | `"projects/abc123/submissions/sub-uuid.webm"` |
| `duration` | number | ✅ | `4.2` |
| `createdAt` | string | ✅ | `"2026-07-08T..."` |

**Index:** `projectId`, `slotId`

**audioPath stores the Storage path, NOT a public URL.**

---

## works

| Field | Type | Required | Example |
|---|---|---|---|
| `id` | string | ✅ | `"work-uuid"` |
| `projectId` | string | ✅ | `"abc123-uuid"` |
| `title` | string | ✅ | `"十年大合唱"` |
| `songName` | string | ✅ | `"十年"` |
| `latestVersionId` | string | ❌ | `"ver-uuid"` |
| `audioPath` | string | ❌ | `"works/work-uuid/versions/ver-uuid.wav"` |
| `audioDuration` | number | ❌ | `56.3` |
| `participants` | string[] | ✅ | `["小雨","阿Ken","月亮"]` |
| `lyricLineCount` | number | ✅ | `4` |
| `filledSlotCount` | number | ✅ | `12` |
| `totalSlotCount` | number | ✅ | `12` |
| `versions` | string[] | ✅ | `["ver-uuid-1","ver-uuid-2"]` |
| `createdAt` | string | ✅ | `"2026-07-08T..."` |

**Index:** `projectId`

---

## work_versions

| Field | Type | Required | Example |
|---|---|---|---|
| `id` | string | ✅ | `"ver-uuid"` |
| `workId` | string | ✅ | `"work-uuid"` |
| `projectId` | string | ✅ | `"abc123-uuid"` |
| `audioPath` | string | ✅ | `"works/work-uuid/versions/ver-uuid.wav"` |
| `duration` | number | ✅ | `56.3` |
| `filledSlotCount` | number | ✅ | `12` |
| `totalSlotCount` | number | ✅ | `12` |
| `createdAt` | string | ✅ | `"2026-07-08T..."` |

**Index:** `workId`, `projectId`
