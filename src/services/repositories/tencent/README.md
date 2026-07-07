# Tencent Repository Implementations

## Status

Tencent repositories are **planned but not implemented** (CN-2).

Setting `NEXT_PUBLIC_HEYIN_CLOUD_PROVIDER=tencent` will throw a clear
not-implemented error at startup until the implementations exist.

## Planned files

| File | Phase | Implements |
|---|---|---|
| `tencentProjectRepository.ts` | CN-4 | `ProjectRepository` — Tencent CloudBase DB |
| `tencentAudioRepository.ts` | CN-5 | `AudioRepository` — Tencent COS / CloudBase Storage |
| `tencentWorkRepository.ts` | CN-7 | `WorkRepository` — Tencent CloudBase DB |
| `tencentGuestRepository.ts` | CN-7+ | `GuestRepository` — guest profiles |

## Architecture

Each Tencent repository follows the same interface contracts as
local and Supabase repositories (`ProjectRepository`, `AudioRepository`, etc.).

When implemented, `src/services/repositories/index.ts` will resolve
to Tencent repositories when:
```
NEXT_PUBLIC_HEYIN_STORAGE_MODE=cloud
NEXT_PUBLIC_HEYIN_CLOUD_PROVIDER=tencent
```
