# Heyin (和音) — Project Memory

## What is Heyin
Collaborative chorus creation H5 app. Users create chorus projects with lyrics, share links, participants claim voice slots, record audio, and generate mixed chorus works (WAV export).

## Tech Stack
- Next.js 16.2.7 (App Router) + React 19.2.4 + TailwindCSS v4 + TypeScript
- Supabase (existing cloud backend) / Tencent CloudBase (China migration target)
- Local mode: localStorage + IndexedDB
- Repository pattern: 4 interfaces (Project/Audio/Work/Guest), resolved by STORAGE_MODE + CLOUD_PROVIDER env

## China Migration (CN-x)
- CN-2 ✅ Provider abstraction done
- CN-3 ✅ Tencent data model designed (6 collections)
- CN-4 ✅ tencentProjectRepository implemented (all 12 methods)
- CN-5 ✅ tencentAudioRepository implemented (CloudBase Storage)
- CN-7 ⬜ tencentWorkRepository NOT implemented — uses placeholder that throws
- CN-1/CN-8 ⬜ Deployment QA not started

## Key Files
- `src/services/repositories/index.ts` — resolver hub
- `src/services/repositories/cloudProvider.ts` — provider detection
- `src/services/tencent/client.ts` — CloudBase SDK singleton
- `docs/china-mvp-roadmap.md` — phase plan
- `docs/tencent-migration-commits.md` — commit-by-commit plan
