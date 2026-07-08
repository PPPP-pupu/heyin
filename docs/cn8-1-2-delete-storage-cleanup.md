# CN-8.1.2 — Delete Project Storage Cleanup

## What Changed

When an owner deletes a Tencent CloudBase project, the system now also cleans up:

| Resource | Before | After |
|---|---|---|
| projects doc | ✅ | ✅ |
| lyric_lines docs | ✅ | ✅ |
| voice_slots docs | ✅ | ✅ |
| voice_submissions docs | ✅ | ✅ |
| works docs | ❌ | ✅ |
| work_versions docs | ❌ | ✅ |
| voice audio files (Storage) | ❌ | ✅ best-effort |
| work WAV files (Storage) | ❌ | ✅ best-effort |

## Delete Order

```
1. Collect cloud:// fileIDs from voice_submissions and works/work_versions
2. Delete DB children: voice_submissions → work_versions → voice_slots → lyric_lines → works
3. Delete Storage files via CloudBase deleteFile (best-effort)
4. Delete project document
```

## Storage Cleanup Strategy

- Only `cloud://` fileIDs are deleted (external HTTPS URLs skipped)
- FileIDs are deduplicated before the delete call
- `OBJECT_NOT_EXIST` errors are expected and not treated as warnings
- Other failures are logged to `console.warn` but do not block DB deletion
- Missing files or partial failures never crash the delete flow

## Remaining Limitations

- Plain storage paths (non-cloud://) are not deleted (insufficient info to construct fileID)
- Storage deletion is best-effort — some orphan files may remain
- No Cloud Function verification that all files were actually deleted
- Not production-grade without auth/security rules

## Files Changed

| File | Change |
|---|---|
| `tencentDeleteCleanup.ts` | NEW — collectors + best-effort delete helpers |
| `tencentProjectRepository.ts` | Updated deleteProject with full cascade |

## QA

- [x] Delete empty project → all DB docs removed
- [ ] Delete project with recordings → Storage files + DB docs removed
- [ ] Delete project with work exports → WAV files + DB docs removed
- [ ] Missing Storage file → deletion continues without crash
- [ ] Lint + Build pass
