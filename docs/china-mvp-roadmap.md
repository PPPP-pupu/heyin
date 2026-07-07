# China MVP Roadmap — Heyin (和音)

## Goal

Deploy Heyin for China domestic users. Let Chinese mobile users create chorus projects, share links, record audio, and eventually generate and share chorus works. Replace Supabase with Tencent Cloud backend for stable domestic access.

## Phases

### CN-0 — Planning & Deployment Prep (current)

- Create roadmap, deployment docs, backend design, migration commit plan
- Add `NEXT_PUBLIC_HEYIN_CLOUD_PROVIDER` env variable (placeholder)
- No business logic changes
- No Tencent SDK

### CN-1 — China H5 Deployment QA

- Deploy current H5 to Tencent Cloud EdgeOne Pages / CloudBase Hosting
- Use existing Supabase backend temporarily
- Verify Chinese mobile users can: open pages, share links, grant microphone, use recording UI
- Upload stability is not guaranteed because Supabase is overseas
- Document results

### CN-2 — Backend Provider Abstraction

- Introduce `NEXT_PUBLIC_HEYIN_CLOUD_PROVIDER=supabase | tencent`
- `supabase` keeps current behavior; `tencent` is reserved
- Repository resolver structure prepared for future Tencent implementations
- No Tencent repository implementation yet

### CN-3 — Tencent Data Model Design

- Map all Supabase tables to Tencent CloudBase collections
- Document fields, indexes, type mappings, relation strategies
- No code implementation

### CN-4 — Tencent Audio Storage

- Replace Supabase Storage with Tencent COS / CloudBase Storage
- Keep audio_path as storage path (not public URL)
- Audio upload/download/delete via Tencent SDK

### CN-5 — Tencent Project Repository

- Implement `tencentProjectRepository` — all 12 ProjectRepository methods
- Project CRUD + claim/release/submit via Tencent DB

### CN-6 — Tencent Audio Repository

- Implement `tencentAudioRepository` — AudioRepository interface
- Upload to Tencent COS / CloudBase Storage

### CN-7 — Tencent Work Repository

- Implement `tencentWorkRepository` — WorkRepository interface
- Work/version persistence via Tencent DB

### CN-8 — China H5 MVP QA

- Full E2E: create → share → join → record → upload → playback → export
- All on Chinese mobile network with Tencent backend

### CN-9 — WeChat Mini Program Research

- Feasibility study
- API differences (recording, upload, auth)
- Sharing flow, login/openid, 备案/审核 requirements
- No code implementation
