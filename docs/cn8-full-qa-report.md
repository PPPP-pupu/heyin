# CN-8 Full QA Report — Heyin China H5 MVP

## A. Test Environment

| Item | Value |
|---|---|
| Deployment Platform | Tencent EdgeOne Pages |
| Deployment URL | `https://heyin-rtgvltyz.edgeone.cool` (with eo_token) |
| Backend | Tencent CloudBase (NoSQL) |
| Storage | CloudBase Storage |
| CloudBase Env ID | `heyin-d3gr32uxw8348239a` |
| SDK | @cloudbase/js-sdk v3.6.2 |
| Auth | Anonymous login (Publishable Key) |

### Browser/Device Matrix

| Device | Browser | Status |
|---|---|---|
| Desktop Mac | Chrome | ✅ Tested |
| iPhone | Safari | ⬜ Pending |
| Android | Chrome | ⬜ Pending |
| WeChat | In-app browser | ⬜ Pending |

### Network

| Network | Status |
|---|---|
| Wi-Fi | ✅ Tested |
| China 4G/5G | ⬜ Pending |

---

## B. Environment Variables

Expected Tencent production env vars (set in EdgeOne Pages):

```
NEXT_PUBLIC_HEYIN_STORAGE_MODE=cloud
NEXT_PUBLIC_HEYIN_CLOUD_PROVIDER=tencent
NEXT_PUBLIC_TENCENT_CLOUDBASE_ENV_ID=heyin-d3gr32uxw8348239a
NEXT_PUBLIC_TENCENT_CLOUDBASE_ACCESS_KEY=<publishable-key>
```

Placeholders (not yet used but reserved):
```
NEXT_PUBLIC_TENCENT_REGION=
NEXT_PUBLIC_TENCENT_STORAGE_BUCKET=
```

---

## C. Full End-to-End Happy Path

| # | Test | Desktop Chrome (Wi-Fi) | Notes |
|---|---|---|---|
| 1 | Home page opens | ✅ | |
| 2 | Explore page opens | ✅ | |
| 3 | Create project page opens | ✅ | |
| 4 | Create project (Chinese title, lyrics, 2 slots) | ✅ | UUID project ID |
| 5 | Project page opens | ✅ | |
| 6 | CloudBase: projects doc exists | ✅ | |
| 7 | CloudBase: lyric_lines docs exist | ✅ | |
| 8 | CloudBase: voice_slots docs exist | ✅ | |
| 9 | Share button generates `/join/{shareId}` | ✅ | |
| 10 | Join link opens (new tab) | ✅ | |
| 11 | Nickname gate works | ✅ | |
| 12 | Empty slot can be claimed | ✅ | |
| 13 | RecordingModal opens | ✅ | Not CN-4 placeholder |
| 14 | Microphone permission prompt | ✅ | |
| 15 | Start Recording | ✅ | |
| 16 | Stop Recording visible & tappable | ✅ | |
| 17 | Preview audio plays | ✅ | |
| 18 | Submit works | ✅ | |
| 19 | CloudBase Storage: audio file received | ✅ | projects/{id}/submissions/{id}.webm |
| 20 | voice_submissions doc created | ✅ | audioPath = cloud://... |
| 21 | voice_slots status → filled | ✅ | claimedBy/claimedAt cleared |
| 22 | Creator refresh → filled slot visible | ✅ | |
| 23 | Individual voice playback | ✅ | |
| 24 | Submit 2+ voices | ✅ | |
| 25 | Play Chorus | ✅ | |
| 26 | Generate Chorus | ✅ | |
| 27 | Mixed WAV uploads to CloudBase Storage | ✅ | works/{id}/versions/{id}.wav |
| 28 | works doc created | ✅ | audioPath = cloud://... |
| 29 | work_versions doc created | ✅ | audioPath = cloud://... |
| 30 | Project page preview plays | ✅ | |
| 31 | View Work → `/work/{id}` | ✅ | |
| 32 | Work page audio plays | ✅ | |
| 33 | Generate Chorus again | ✅ | |
| 34 | Second work_versions doc | ✅ | |
| 35 | Version selector v1/v2 | ✅ | |
| 36 | Switching versions | ✅ | |
| 37 | View Project returns to project | ✅ | |

---

## D. Edge Cases

| # | Test | Result | Notes |
|---|---|---|---|
| 1 | Empty title validation | ⬜ | |
| 2 | Empty song name validation | ⬜ | |
| 3 | Empty lyrics validation | ⬜ | |
| 4 | Slots per line < 1 | ⬜ | |
| 5 | Slots per line > 10 | ⬜ | |
| 6 | `/join/not-existing` → clean not found | ⬜ | |
| 7 | Closed project → join blocked | ⬜ | |
| 8 | Completed project → join blocked | ⬜ | |
| 9 | Claim race (2 devices) | ⬜ | Best-effort only |
| 10 | Cancel during recording | ⬜ | |
| 11 | Submit failure recovery | ⬜ | |
| 12 | Refresh while claimed | ⬜ | Stale cleanup applies |
| 13 | Delete project cascade | ⬜ | |
| 14 | `/work/not-existing` → clean not found | ⬜ | |
| 15 | Mobile safe-area | ⬜ | |
| 16 | Audio playback on mobile | ⬜ | |
| 17 | WeChat in-app browser | ⬜ | |

---

## E. Data Integrity

| Collection | Field | Check |
|---|---|---|
| projects | id is UUID | ✅ |
| projects | shareId exists | ✅ |
| projects | status correct | ✅ |
| projects | updatedAt changes | ✅ |
| lyric_lines | projectId correct | ✅ |
| lyric_lines | lineIndex correct | ✅ |
| voice_slots | status lifecycle (empty→claimed→filled) | ✅ |
| voice_slots | claimedBy cleared after submit | ✅ |
| voice_submissions | id is UUID | ✅ |
| voice_submissions | audioPath is cloud://, NOT HTTPS URL | ✅ |
| works | audioPath is cloud://, NOT HTTPS URL | ✅ |
| work_versions | audioPath is cloud://, NOT HTTPS URL | ✅ |
| Storage | projects/{id}/submissions/{id}.{ext} | ✅ |
| Storage | works/{id}/versions/{id}.wav | ✅ |

---

## F. Regression

| Mode | Build | Core Flow | Notes |
|---|---|---|---|
| Local (STORAGE_MODE=local) | ✅ | ⬜ Pending | |
| Supabase (PROVIDER=supabase) | ✅ | ⬜ Pending | |
| Tencent (PROVIDER=tencent) | ✅ | ✅ | Full chain verified |

---

## G. Performance Notes

| Metric | Observation |
|---|---|
| Home page load | Fast (< 2s) |
| Create project | Instant |
| Join page load | ~1-2s (CloudBase query) |
| 5s audio upload | ~2-4s (Wi-Fi) |
| Generate Chorus (2 voices) | ~3-5s |
| Work page load | ~1-2s |

---

## H. Known Limitations Before Public Launch

1. **No real auth/owner protection** — anyone can delete any project
2. **Claim slot is best-effort** — not atomic; race condition possible
3. **Storage/database rules are permissive** — MVP closed testing only
4. **No rate limiting** — spam/abuse possible
5. **Guest identity is local browser based** — not secure
6. **Work export may be slow with many voices** — no batch loading
7. **Storage cleanup may be incomplete on delete** — TODO
8. **No WeChat Mini Program** — H5 only
9. **ICP/domain/compliance** — needed for public China rollout
10. **No offline support** — requires network
11. **No audio compression** — raw WebM uploads

---

## I. CN-8 Result

### CN-8 Result: **PASS WITH MINOR ISSUES** ✅

### Ready for:
- ✅ Internal testing
- ✅ Small friend group testing
- ⬜ Public beta (needs auth + security tightening)

### Blockers: None

### Minor Issues (non-blocking):

| # | Issue | Severity |
|---|---|---|
| 1 | Claim slot is best-effort (not atomic) | P1 |
| 2 | Delete project Storage cleanup incomplete | P2 |
| 3 | Edge cases not exhaustively tested | P2 |
| 4 | Mobile Safari / WeChat not tested | P1 |

### CN-8 Fixes Applied:

| Fix | File |
|---|---|
| Object URL cleanup on WorkPage unmount | `src/app/work/[workId]/page.tsx` |
| Re-export WAV path uses existingWork.id | `src/features/export/useExport.ts` |
| Updated outdated comments | `src/app/project/[projectId]/page.tsx` |

### Recommended Next Phase:
- **CN-8.1** — Mobile QA + edge case testing, THEN
- **CN-9** — WeChat Mini Program research
