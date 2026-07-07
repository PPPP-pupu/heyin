# Supabase Repository Implementations

## Status

Supabase repository implementations are **intentionally not added in Commit 3**.

The `src/services/repositories/index.ts` resolver currently always returns
local repositories, even when `NEXT_PUBLIC_HEYIN_STORAGE_MODE=cloud`.

## Planned commit schedule

| Commit | File | What |
|---|---|---|
| 4 | `supabaseProjectRepository.ts` | `ProjectRepository` backed by Supabase tables: projects, lyric_lines, voice_slots, voice_submissions |
| 5 | — | Wire `projectRepository` into create/join/project pages |
| 6 | — | Wire `projectRepository` into recording submit/delete flow |
| 7 | `supabaseAudioRepository.ts` | `AudioRepository` backed by Supabase Storage `heyin-audio` bucket |
| 8 | — | Wire `audioRepository` into recording upload and playback |
| 9 | `supabaseWorkRepository.ts` | `WorkRepository` backed by Supabase tables: works, work_versions |
| 10 | `supabaseGuestRepository.ts` | `GuestRepository` backed by Supabase (or future auth system) |

## Why not all at once?

Each repository implementation requires:
1. Mapping between local data shapes and Supabase row types.
2. Handling async Supabase calls with error recovery.
3. Testing that local mode still works after the wire-up.

Smaller commits make each step reviewable and revertible.
