# Tencent Migration — Commit-by-Commit Plan

## CN-1 — China H5 Deployment QA

**Scope:** Deploy current H5 to Tencent Cloud platform. No code changes.

- Deploy to EdgeOne Pages / CloudBase Hosting
- Test domestic mobile access: home, create, join, record UI
- Document Supabase upload results
- Baselining before migration

## CN-2 — Provider Mode Refactor

**Scope:** Code changes — environment + resolver structure only.

- Files:
  - `src/services/repositories/cloudProvider.ts` — read `NEXT_PUBLIC_HEYIN_CLOUD_PROVIDER`
  - `src/services/repositories/index.ts` — prepare Tencent fallback paths
  - `.env.example` — add provider variable
- Keep current Supabase behavior unchanged
- Tencent repositories not implemented yet

## CN-3 — Tencent Client Placeholder

**Scope:** Configuration + SDK research only.

- Files:
  - `src/services/tencent/client.ts` — placeholder
  - `src/services/tencent/types.ts` — placeholder
  - `docs/tencent-sdk-notes.md` — SDK choice documentation
- No real SDK dependency yet
- May install `@cloudbase/js-sdk` if confirmed

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
