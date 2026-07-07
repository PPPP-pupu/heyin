# CN-3 Decision Record — Heyin (和音)

## Decisions Made

| # | Decision | Rationale |
|---|---|---|
| 1 | CloudBase first, COS later | Best WeChat ecosystem fit; sufficient for MVP |
| 2 | camelCase collection fields | Matches TypeScript app model, avoids mapper overhead |
| 3 | audioPath stores Storage path | Consistent with Supabase design; CDN swap doesn't break DB |
| 4 | Permissive MVP security rules | Closed beta testing; tighten before public launch |
| 5 | H5 first, Mini Program later | Existing H5 is complete; Mini Program is additional work |
| 6 | No Tencent SDK in CN-3 | Pure documentation; implementations start CN-4 |
| 7 | No business logic changes | CN-3 is planning only |
| 8 | CN-4 implements tencentProjectRepository | Project CRUD + claim/release/submit |
| 9 | CN-5 implements tencentAudioRepository | Storage upload/download/delete |
| 10 | CN-7 implements tencentWorkRepository | Work/version persistence |

## What CN-3 Produced

| Artifact | Content |
|---|---|
| `tencent-cloudbase-setup.md` | Step-by-step CloudBase environment setup |
| `tencent-collections-schema.md` | 6 collections with fields, types, indexes |
| `tencent-security-rules.md` | MVP rules + production tightening plan |
| `tencent-storage-design.md` | Path conventions, upload flow, delete behavior |
| `cn3-decision-record.md` | This file |
| `tencentTypes.ts` | TypeScript interfaces (optional scaffold) |
| `.env.example` updated | Tencent placeholders added |

## What Was NOT Done

- No Tencent SDK installed
- No repository implementations
- No runtime behavior changed
- No Supabase code removed
- No local mode changed
