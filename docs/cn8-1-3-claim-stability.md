# CN-8.1.3 — Claim Slot Stability

## Claim Lifecycle

```
empty → claimed (15 min TTL) → filled  (submit succeeds)
empty → claimed (15 min TTL) → empty  (cancel / release / stale cleanup)
```

## What CN-8.1.3 Improves

| Scenario | Before | After |
|---|---|---|
| **Claim conflict** (two users same slot) | Error shown, no refresh | Auto-refresh + "Refreshing slots..." → clear message |
| **Release failure** | Silently ignored | Silently refresh project |
| **Submit failure** | Error in modal, closeable | Error visible, recording intact, retry without re-recording |
| **Tab return** (user switches away, comes back) | Shows stale slot states | Auto-refreshes on visibility change + focus |
| **Manual refresh** | No way to refresh | "Refresh Slots" button next to claim error |
| **Claim error** | Generic message, no recovery | Auto-refresh project, clear selection |

## Key Changes

| File | Change |
|---|---|
| `claimConstants.ts` | NEW — CLAIM_TTL_MS (15 min), CLAIM_WARNING_MS (12 min) |
| `useProject.ts` | `refreshProject({ silent: true })` returns `Promise<ChorusProject \| null>` |
| `JoinPage` | Visibility refresh, conflict auto-refresh, release always cleans local state, refresh button |

## What Remains Best-Effort

- claim is still read-then-update in Tencent mode (not atomic)
- Two simultaneous clicks on same slot may both succeed
- stale cleanup on project load only (no background cleanup timer)
- Cloud Function atomic claim is the production solution

## QA

- [x] Single user: claim → record → submit → filled
- [x] Cancel: claim → close modal → slot returns empty
- [x] Conflict: two-device same-slot → second sees "slot taken" + auto-refresh
- [ ] Submit fail retry: error visible, recording stays, can retry
- [ ] Visibility refresh: tab return shows updated slots
- [ ] Lint + Build pass
