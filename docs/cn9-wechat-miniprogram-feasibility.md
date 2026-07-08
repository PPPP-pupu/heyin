# CN-9 — WeChat Mini Program Feasibility Research

## A. Executive Summary

### Is WeChat Mini Program feasible?

**Yes.** The core product loop (create project → share → join → record → upload → playback → export) is technically achievable within WeChat Mini Program constraints. CloudBase provides a unified backend that works identically for both H5 and Mini Program.

### Should Heyin move to Mini Program now, later, or keep H5 first?

**Recommendation: Keep H5 first. Start Mini Program after internal testing validates the product.**

The H5 MVP is ready for small-group testing. Moving to Mini Program now would be premature — the product experience should be validated first. The H5 also serves as a reference implementation and fallback.

### Recommended path:

```
H5 Internal Testing (3-10 users, 1-2 weeks)
  → Collect feedback
  → Fix P1 issues (claim, auth, cleanup)
  → Re-test
  → IF distribution through WeChat is the main goal
    → CN-9 → MP-1 scaffold → MP-2 auth → ...
  → ELSE continue H5 enhancement
```

---

## B. H5 vs Mini Program Comparison

| Dimension | Next.js H5 (current) | WeChat Mini Program |
|---|---|---|
| **User access** | URL in any browser | Must be in WeChat, search or scan QR |
| **Sharing** | Copy link / navigator.share | Share card (rich preview) |
| **Recording permission** | Browser mic prompt (per-origin) | `wx.authorize` scope `scope.record` |
| **Audio upload** | CloudBase JS SDK | CloudBase MP SDK (built-in `wx.cloud`) |
| **Playback** | `<audio>` / `Audio()` / OfflineAudioContext | `InnerAudioContext` / `WebAudioContext` (limited) |
| **Work export** | OfflineAudioContext + WAV encoder | Limited — `WebAudioContext` not available; needs server-side mixing |
| **CloudBase integration** | `@cloudbase/js-sdk` (dynamic import) | `wx.cloud` (zero-dependency, built-in) |
| **Login / openid** | Anonymous only (accessKey) | `wx.login()` → openid (automatic) |
| **Review / compliance** | None for testing | Required — content category, privacy policy |
| **Development cost** | N/A (already built) | Medium-high (~60-80% rewrite of UI layer) |
| **Maintenance cost** | One H5 codebase | Two codebases (H5 + MP) unless shared backend |
| **Distribution** | URL, QR code | WeChat ecosystem (moments, group, official account) |
| **Offline** | Service Worker | Built-in offline support |
| **Audio format** | WebM (browser dependent) | `.mp3` / `.aac` / `.wav` |
| **File size limit** | Browser-dependent (~100MB+) | 10MB upload limit |

---

## C. Reusable Parts

| Part | Reusable? | Notes |
|---|---|---|
| Data model (types) | ✅ Yes | `ChorusProject`, `VoiceSlot`, `VoiceSubmission`, `ChorusWork`, `ChorusWorkVersion` |
| CloudBase collections | ✅ Yes | All 6 collections unchanged |
| Storage path conventions | ✅ Yes | `projects/{id}/submissions/{id}.{ext}`, `works/{id}/versions/{id}.wav` |
| Repository concepts | ✅ Yes | Project/Audio/Work interfaces; Mini Program SDK is simpler (no SSR issues) |
| Business logic | ⚠️ Partial | `buildTimeline()`, `buildComposition()`, claim/release logic reusable in JS |
| QA checklist | ✅ Yes | Test cases transfer directly |
| Product flow | ✅ Yes | create → join → record → submit → playback → export |
| CloudBase auth model | ⚠️ Partial | accessKey replaced by wx.cloud built-in auth |
| Audio extension mapping | ✅ Yes | MIME → ext logic reusable, but Mini Program records to known format |

---

## D. Non-Reusable or Needs Rewrite

| Part | Reason |
|---|---|
| **Next.js pages** | Mini Program uses WXML or JSX (Taro/uni-app) |
| **React components** | No React DOM in Mini Program (unless Taro) |
| **DOM audio elements** | Replaced by `InnerAudioContext` |
| **`new Audio()`** | Not available |
| **`MediaRecorder` API** | Replaced by `wx.getRecorderManager()` |
| **`navigator.share()`** | Replaced by `onShareAppMessage()` |
| **`crypto.randomUUID()`** | Available in newer WeChat versions; fallback needed |
| **localStorage** | Replaced by `wx.setStorageSync()` |
| **IndexedDB** | Not available; use CloudBase for all audio persistence |
| **Tailwind CSS** | Not directly usable in Mini Program (Taro Tailwind plugin available) |
| **Next.js routing** | Replaced by Mini Program page routing (`app.json` pages array) |
| **`OfflineAudioContext`** | **Not available** — server-side mixing required |
| **`URL.createObjectURL()`** | Not available — audio loaded from temp file paths |
| **Dynamic `import()`** | Not needed — `wx.cloud` is synchronous |

---

## E. Mini Program Replacement Mapping

| H5 Feature | Mini Program Equivalent |
|---|---|
| `/create` page | `pages/create/create` |
| `/project/[projectId]` | `pages/project/project?id=xxx` |
| `/join/[shareId]` | `pages/join/join?shareId=xxx` (or scene param via share card) |
| `/explore` | `pages/explore/explore` |
| `/work/[workId]` | `pages/work/work?id=xxx` |
| `RecordingModal` | In-page recorder UI + `wx.getRecorderManager()` |
| `MediaRecorder.start/stop` | `recorderManager.start()` / `recorderManager.stop()` |
| `recorderManager.onStop` → audioBlob | `recorderManager.onStop` → `{tempFilePath, duration}` |
| `new Audio(url).play()` | `wx.createInnerAudioContext()` → `.src = url` → `.play()` |
| `audioRepository.saveAudio(blob, path)` | `wx.cloud.uploadFile({cloudPath, filePath})` |
| `audioRepository.loadAudio(id)` | `wx.cloud.getTempFileURL()` + `wx.downloadFile()` |
| `navigator.share({url})` | `onShareAppMessage()` returning `{path, title, imageUrl}` |
| `localStorage` guest profile | `wx.getStorageSync('guestProfile')` or openid-bound |
| `isCloudRepositoryMode()` | Always "cloud" in Mini Program |
| `isTencentProvider()` | Always "tencent" in Mini Program |
| `@cloudbase/js-sdk` | Built-in `wx.cloud` (no package install) |
| EdgeOne URL sharing | Mini Program share card (rich media preview) |
| Browser mic permission | `wx.authorize({scope: 'scope.record'})` |
| `OfflineAudioContext` mixing | **Not available** — Cloud Function server-side mixing |
| `exportWav()` encoding | Move to Cloud Function or use server-side FFmpeg |

---

## F. Backend Impact

### Current CloudBase Schema — Can Stay Unchanged

| Collection | Unchanged? | Notes |
|---|---|---|
| `projects` | ✅ | Add optional fields for Mini Program |
| `lyric_lines` | ✅ | No change needed |
| `voice_slots` | ✅ | No change needed |
| `voice_submissions` | ✅ | Add `submittedFrom: "h5" \| "mp"` |
| `works` | ✅ | Add `createdBy` |
| `work_versions` | ✅ | Add `createdBy` |

### Recommended New Fields

| Collection | New Field | Type | Reason |
|---|---|---|---|
| `projects` | `creatorOpenId` | string? | Track which WeChat user created the project |
| `projects` | `createdBy` | string? | Creator identifier (openid or guestId) |
| `voice_submissions` | `guestOpenId` | string? | WeChat user who submitted |
| `voice_submissions` | `submittedFrom` | string? | `"h5"` or `"mp"` |
| `works` | `createdBy` | string? | User who generated the chorus |
| `work_versions` | `createdBy` | string? | User who generated this version |

All new fields should be optional (nullable) to maintain backward compatibility with existing H5 data.

### Storage Paths — Unchanged

```
projects/{projectId}/submissions/{submissionId}.{ext}  → same
works/{workId}/versions/{versionId}.wav                 → same
```

---

## G. Auth / Permission Plan

### Option Comparison

| Option | Description | Pros | Cons |
|---|---|---|---|
| **1. Anonymous (same as H5)** | No openid, guest UUID in localStorage | Fastest, no auth work | No ownership, no security, same limits as H5 |
| **2. WeChat openid** | `wx.login()` → openid as identity | Real identity, secure, free | Only works in Mini Program; H5 stays anonymous |
| **3. Hybrid** | H5 stays anonymous; MP uses openid | Best of both | Two identity types, some complexity |

### Recommendation: Option 2 for Mini Program

**WeChat openid** is the natural choice for Mini Program. It's free, built-in, and provides real identity without user registration. `wx.cloud.init()` automatically obtains openid.

H5 can continue with anonymous access for now. When auth is added to H5 later (e.g., WeChat OAuth via official account), the same openid system can be shared.

---

## H. Claim Slot Improvement

### Why Mini Program Should Use Cloud Function

Current H5 claim is **read-then-update** (best-effort, non-atomic):

```
1. Read slot status
2. If empty, update to claimed
```

Two users clicking simultaneously can both pass step 2.

### Proposed: Cloud Function Atomic Claim

```javascript
// Cloud Function: claimSlot
// 1. Validate project exists and is "open"
// 2. Validate slot exists and is "empty"
// 3. Atomic conditional update:
//    db.collection('voice_slots')
//      .where({ _id: slotId, status: 'empty' })
//      .update({ status: 'claimed', claimedBy: openid, claimedAt: now })
// 4. If update affected 0 docs → slot was already taken → return error
// 5. If update affected 1 doc → return success
```

This eliminates the race condition entirely. The same Cloud Function can be called from H5 (via HTTP API) if needed later.

---

## I. Audio Recording Plan

### Mini Program Recording Flow

```
1. wx.authorize({ scope: 'scope.record' })
2. recorderManager = wx.getRecorderManager()
3. recorderManager.start({ format: 'mp3', sampleRate: 44100 })
4. User speaks
5. recorderManager.stop()
6. onStop callback: { tempFilePath: string, duration: number }
7. wx.cloud.uploadFile({
     cloudPath: 'projects/{pid}/submissions/{sid}.mp3',
     filePath: tempFilePath
   })
8. Save voice_submissions doc
9. Update voice_slots: status='filled'
```

### Key Differences from H5

| Aspect | H5 | Mini Program |
|---|---|---|
| Format | WebM (browser-specific) | `.mp3` (fixed) |
| Bitrate control | Browser decides | `encodeBitRate` configurable |
| Sample rate | Browser decides | `sampleRate` configurable |
| Duration limit | None (browser) | 600s (10 min) max |
| Permission model | Per-origin browser prompt | WeChat scope authorization |
| Temp file | Blob in memory | Temp file path on device |

---

## J. Work Export Feasibility

### Problem

H5 uses `OfflineAudioContext` (Web Audio API) to mix tracks client-side. This API is **not available in WeChat Mini Program**.

### Options

| Option | Description | Viable? |
|---|---|---|
| **A. Client-side MP mixing** | Use Mini Program's limited audio APIs | ❌ Not feasible — no multi-track mixing API |
| **B. Keep H5 export only** | Users export via H5 browser; MP only for recording | ⚠️ Usable but bad UX |
| **C. Cloud Function mixing** | Upload voice files, mix on server, return WAV | ✅ Recommended |

### Recommendation: Option C — Cloud Function Mixing

A Cloud Function receives voice file paths, downloads them, mixes using a server-side audio library (FFmpeg or Node.js audio lib), uploads the result, and creates work/version documents.

This also benefits H5 users by offloading heavy mixing from the browser.

### Implementation sketch:

```
Cloud Function: generateChorus
Input: { projectId }
Process:
  1. Load all voice_submissions for project
  2. Download each audio file from CloudBase Storage
  3. Mix using FFmpeg (or Node.js audio library)
  4. Upload result to works/{workId}/versions/{versionId}.wav
  5. Create works + work_versions docs
Output: { workId, versionId, audioUrl }
```

---

## K. Review / Compliance Checklist

These must be verified from official WeChat/Tencent documentation before submission:

| # | Item | Status |
|---|---|---|
| 1 | Mini Program account registered (individual or enterprise) | ⬜ |
| 2 | Category selected: "工具 > 语音" or "社交 > 社区" | ⬜ |
| 3 | ICP filing (企业主体) | ⬜ |
| 4 | Privacy policy page (required for audio recording) | ⬜ |
| 5 | `scope.record` usage description in app.json | ⬜ |
| 6 | Content moderation: user-generated audio content | ⬜ |
| 7 | Audio storage compliance (no illegal content) | ⬜ |
| 8 | CloudBase environment bound to Mini Program AppID | ⬜ |
| 9 | Service categories: 社交 > 笔记, 工具 > 语音 | ⬜ |
| 10 | Security assessment for UGC audio platform | ⬜ |

⚠️ **Category selection is critical.** "社交" (social) category has stricter review requirements. "工具" (tools) may be easier but limits social features.

---

## L. Development Plan

```
MP-0  Research (this doc)                     ← CURRENT
MP-1  Mini Program project scaffold            (1-2 days)
      - Init project, bind CloudBase env
      - Set up page structure, routing
      - Taro or native framework decision
MP-2  CloudBase login / openid                 (1-2 days)
      - wx.cloud.init()
      - Obtain openid
      - Store user profile
MP-3  Create / project / join pages            (3-5 days)
      - Port create form
      - Port project detail with slots
      - Port join page with nickname gate
      - Port slot picker
      - Share card setup
MP-4  Recording / upload                       (2-3 days)
      - wx.getRecorderManager() integration
      - Upload to CloudBase Storage
      - voice_submissions write
      - Slot fill update
MP-5  Playback                                 (2-3 days)
      - Individual voice playback
      - InnerAudioContext management
      - Filled slot UI
MP-6  Work export strategy                     (3-5 days)
      - Cloud Function for mixing
      - or keep H5 export
MP-7  QA / review preparation                  (3-5 days)
      - Full QA pass
      - Privacy policy
      - Review submission
MP-8  Submit for review                        (1-7 days wait)
```

**Estimated total: 15-25 development days + review wait**

---

## M. Recommendation

### Final Verdict

| Question | Answer |
|---|---|
| Technically feasible? | ✅ Yes |
| Should start now? | ❌ No — validate product first |
| Should start after internal testing? | ⚠️ Only if WeChat distribution is essential |
| H5 enough for now? | ✅ Yes for small-group testing |
| Recommended next action | **H5 testing → feedback → CN-8.1 fixes → then decide** |

### Sequence:

```
v0.8 Internal Testing (NOW)
  → 3-10 users, 1-2 weeks
  → Collect feedback
  →
CN-8.1 Stabilization
  → Add owner token / basic auth
  → Improve delete cleanup
  → Polish error states
  → H5 tested and stable
  →
Decision point:
  A: "We need WeChat distribution" → MP-1
  B: "H5 is good enough" → enhance H5 further
```
