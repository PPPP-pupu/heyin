# China H5 QA Checklist — Heyin (和音)

## CN-1 — China H5 Deployment QA (Supabase backend, temporary)

| # | Test | Device | Expected | Result |
|---|---|---|---|---|
| 1 | Open home page | China mobile | Page loads | ⬜ |
| 2 | `/create` page | China mobile | Form loads, can fill in | ⬜ |
| 3 | Create project → `/project/{id}` | China mobile | Redirects, UUID format | ⬜ |
| 4 | Share link domain | China mobile | Uses China platform domain | ⬜ |
| 5 | `/join/{shareId}` | China mobile | Join page loads with project info | ⬜ |
| 6 | Microphone permission prompt | China mobile | Browser asks for mic | ⬜ |
| 7 | Recording starts | China mobile | Red pulsing dot, timer counts | ⬜ |
| 8 | Recording stops + preview | China mobile | Audio preview works | ⬜ |
| 9 | Submit recording | China mobile | Document result: success or error message | ⬜ |
| 10 | Claim/release | China mobile | Slot status toggles | ⬜ |

## CN-8 — China H5 MVP QA (Tencent backend)

| # | Test | Expected |
|---|---|---|
| 1 | Create project | Tencent DB has project row |
| 2 | Share link | `/join/{shareId}` works |
| 3 | Join on Chinese mobile | Join page loads |
| 4 | Claim slot | Slot becomes claimed in Tencent DB |
| 5 | Record audio | Recording UI works |
| 6 | Submit → upload to Tencent Storage | File exists in COS/Storage |
| 7 | Submission row created | Tencent DB has voice_submission |
| 8 | Slot becomes filled | claimed_by=null, claimed_at=null |
| 9 | Creator refreshes → sees filled slot | Slot shows filled |
| 10 | Play recording | Audio plays from Tencent URL |
| 11 | Generate chorus | WAV uploaded to Tencent Storage |
| 12 | Work version saved | Tencent DB has work + version |
| 13 | Local mode regression | localStorage + IndexedDB still works |

## Notes

- Supabase upload failure in CN-1 is NOT a frontend deployment failure
- It is the expected network limitation of using overseas backend from China
- If upload remains unstable in CN-1, proceed to CN-2+ for Tencent backend migration
