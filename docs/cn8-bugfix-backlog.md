# CN-8 Bugfix Backlog

## Severity Levels

| Level | Description |
|---|---|
| P0 | Blocker — app crash, cannot create/join/record/upload/play/export |
| P1 | Important — bad mobile layout, confusing error, stale claim, race condition |
| P2 | Polish — copywriting, progress feedback, loading states, cleanup |

---

## Active Issues

### P0 Blockers

_None found in CN-8._

---

### P1 Important

#### P1-001: Claim slot is best-effort (not atomic)

- **Reproduction**: Two devices click same empty slot simultaneously
- **Expected**: Only one succeeds
- **Actual**: Both may succeed (read-then-update race)
- **File**: `src/services/repositories/tencent/tencentProjectRepository.ts` → `claimSlot()`
- **Fix**: Cloud Function with atomic conditional update, or CloudBase transaction
- **Status**: Known limitation — documented for CN-9+
- **Note**: Low probability in small group testing

#### P1-002: Mobile Safari / WeChat browser not tested

- **Reproduction**: Open on iPhone Safari, Android Chrome, WeChat in-app browser
- **Expected**: All core flows work
- **Actual**: Unknown
- **Status**: Needs manual testing

---

### P2 Polish

#### P2-001: Delete project Storage cleanup incomplete

- **Reproduction**: Delete a project with voice submissions and exported works
- **Expected**: All associated Storage files deleted
- **Actual**: Database records deleted; CloudBase Storage files may remain
- **File**: `src/services/repositories/tencent/tencentProjectRepository.ts` → `deleteProject()`
- **Status**: TODO — add Storage file cleanup in delete cascade

#### P2-002: No loading state during CloudBase init

- **Reproduction**: Open app on slow network; CloudBase SDK initializing
- **Expected**: Loading indicator
- **Actual**: Page renders with generic UI; may briefly show create form before auth ready
- **Status**: Low priority — init is fast on normal connections

#### P2-003: Edge cases not exhaustively tested

- Form validation edge cases
- Invalid shareId handling  
- Closed/completed project join handling
- Claim race recovery
- Submit failure retry
- Refresh during claimed state

#### P2-004: Play Chorus for Tencent mode may be slow

- **Reproduction**: Play Chorus with many cloud:// voices
- **Expected**: Smooth playback
- **Actual**: May have brief delay while resolving cloud:// fileIDs
- **File**: `src/features/audio/audioManager.ts`
- **Status**: Acceptable for MVP; optimize in CN-9+

---

## Resolved in CN-8

| Issue | Fix |
|---|---|
| WorkPage object URL memory leak | Added useRef cleanup + revoke on unmount |
| Re-export WAV uses wrong workId path | Now uses existingWork.id for path |
| Outdated comments ("until Commit 7") | Updated to current state |

---

## Summary

| Total | P0 | P1 | P2 |
|---|---|---|---|
| 6 | 0 | 2 | 4 |

**CN-8 Verdict**: No blockers. Ready for internal/small-group testing.
