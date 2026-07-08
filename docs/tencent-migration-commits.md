# Tencent Migration — Commit-by-Commit Plan

## CN-1 — China H5 Deployment QA

**Scope:** Deploy current H5 to Tencent Cloud platform. No code changes.

- Deploy to EdgeOne Pages / CloudBase Hosting
- Test domestic mobile access: home, create, join, record UI
- Document Supabase upload results
- Baselining before migration

## CN-2 — Provider Mode Refactor ✅

**Scope:** Code changes — environment + resolver structure only. **DONE.**

- Files:
  - `src/services/repositories/cloudProvider.ts` — `getCloudProvider()`
  - `src/services/repositories/index.ts` — 4 resolve functions, tencent→throw
  - `src/services/repositories/tencent/notImplemented.ts` — clear error
  - `src/services/repositories/tencent/README.md` — planned files
  - `.env.example` — provider comments
- Cloud + supabase still works. Cloud + tencent throws.

## CN-3 — Tencent Backend Setup / Data Model Finalization ✅

**Scope:** Documentation + design only. **DONE.**

- Docs created:
  - `docs/tencent-cloudbase-setup.md` — step-by-step CloudBase setup
  - `docs/tencent-collections-schema.md` — 6 collections with fields/indexes
  - `docs/tencent-security-rules.md` — MVP rules + production tightening
  - `docs/tencent-storage-design.md` — path conventions + upload/delete flow
  - `docs/cn3-decision-record.md` — 10 decisions + summary
- Code:
  - `src/services/repositories/tencent/tencentTypes.ts` — TypeScript interfaces (no runtime)
  - `.env.example` — Tencent env var placeholders
- No Tencent SDK added. No runtime behavior changed.

## CN-4 — Tencent Project Repository ✅

**Scope:** Full implementation. **DONE.**

- File: `src/services/repositories/tencent/tencentProjectRepository.ts`
- All 12 methods: saveProject, loadProject, loadProjectByShareId, loadAllProjects, deleteProject, setProjectStatus, submitRecording, deleteSubmission, claimSlot, releaseClaim, cleanupStaleClaims
- Wire into repository resolver when `provider === "tencent"`

## CN-5 — Tencent Audio Repository ✅

**Scope:** Full implementation. **DONE.**

- File: `src/services/repositories/tencent/tencentAudioRepository.ts`
- New: `src/services/tencent/storageUrls.ts`
- saveAudio → CloudBase Storage upload, returns cloud:// fileID
- loadAudio → resolve fileID to temp URL → fetch → Blob
- deleteAudio → delete from CloudBase Storage
- Wire into repository resolver

## CN-5.1 — CloudBase Auth Bootstrap ✅

**Scope:** Fix. **DONE.**

- `client.ts` calls `auth.signInAnonymously()` after init
- `getTencentDatabase()` awaits auth readiness
- Requires: anonymous login enabled, security domain added, accessKey set

## CN-6 — Tencent Submission Flow ✅

**Scope:** Integration. **Merged into CN-5.**

- `createVoiceSubmission` → `useSubmitRecording` works for all providers
- Join page RecordingModal enabled in Tencent mode
- Individual voice playback resolves cloud:// fileIDs

## CN-7 — Tencent Work Export ✅

**Scope:** Full implementation. **DONE.**

- New: `tencentWorkRepository.ts` (7 methods)
- New: `tencentWorkMapper.ts`
- AudioMixer: injectable loadAudioBlob for cloud sources
- useExport: Tencent path for WAV upload + work/version persistence
- Work page: cloud mode loading via workRepository
- Multi-version export + Version Selector

## CN-8 — China H5 MVP QA ⬜

**Scope:** Full E2E testing on Chinese mobile network with Tencent backend.

- create → share → join → record → upload → playback → export
- All paths verified

## CN-9 — WeChat Mini Program Research

**Scope:** Documentation only. No code.

- API differences (recording, upload, auth)
- Sharing flow, login/openid
- 备案/审核 requirements
- Rewrite cost estimate
