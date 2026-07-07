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

## CN-4 — Tencent Project Repository

**Scope:** Full implementation.

- File: `src/services/repositories/tencent/tencentProjectRepository.ts`
- All 12 methods: saveProject, loadProject, loadProjectByShareId, loadAllProjects, deleteProject, setProjectStatus, submitRecording, deleteSubmission, claimSlot, releaseClaim, cleanupStaleClaims
- Wire into repository resolver when `provider === "tencent"`

## CN-5 — Tencent Audio Repository

**Scope:** Full implementation.

- File: `src/services/repositories/tencent/tencentAudioRepository.ts`
- saveAudio → COS/Storage upload
- loadAudio → fetch from COS
- deleteAudio → remove from COS
- Wire into repository resolver

## CN-6 — Tencent Submission Flow

**Scope:** Integration.

- Wire `createVoiceSubmission` → `useSubmitRecording` to Tencent provider
- Recording submit updates Tencent DB and slot status
- Playback resolves Tencent Storage paths

## CN-7 — Tencent Work Export

**Scope:** Integration.

- Upload mixed WAV to Tencent Storage
- Save works and work_versions to Tencent DB

## CN-8 — China H5 MVP QA

**Scope:** Full E2E testing on Chinese mobile network with Tencent backend.

- create → share → join → record → upload → playback → export
- All paths verified

## CN-9 — WeChat Mini Program Research

**Scope:** Documentation only. No code.

- API differences (recording, upload, auth)
- Sharing flow, login/openid
- 备案/审核 requirements
- Rewrite cost estimate
