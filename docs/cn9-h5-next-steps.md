# CN-9 — H5 Next Steps Before Mini Program

## Current State

```
Heyin China H5 MVP v0.8
Status: Internal Testing Ready
CN-0 ~ CN-8: PASS
```

## Recommended Before Mini Program

### Phase 1: Internal Testing (1-2 weeks) 🔴 Priority

| # | Action | Details |
|---|---|---|
| 1 | Share with 3-10 testers | Friends, colleagues — mixed devices (iPhone, Android) |
| 2 | Create a test project | Pre-populate with some recordings so testers see filled slots |
| 3 | Collect feedback | Use `docs/china-h5-mvp-release-checklist.md` tester questions |
| 4 | Watch for these failure points | Mic permission denied, Submit fails, audio doesn't play, page loads slow |
| 5 | Record results | Document in a new `docs/internal-testing-feedback.md` |

### Phase 2: CN-8.1 Stabilization (1 week) 🟡 Priority

| # | Fix | Priority | Effort |
|---|---|---|---|
| 1 | **Add owner protection** — creator token stored in localStorage; required for delete/status change | P1 | Small |
| 2 | **Improve delete cascade** — delete associated Storage files when deleting project | P2 | Small |
| 3 | **Claim slot atomicity** — assess whether Cloud Function is needed now or can wait | P1 | Research |
| 4 | **Add loading states** — CloudBase init, upload progress, export progress improvements | P2 | Small |
| 5 | **Add error recovery** — retry buttons for failed uploads/submits | P2 | Small |
| 6 | **Mobile Safari testing** — verify iPhone join/record/playback | P1 | Manual |
| 7 | **WeChat in-app browser testing** — verify basic functionality | P1 | Manual |
| 8 | **4G/5G testing** — verify upload speed and timeout handling | P2 | Manual |

### Phase 3: Pre-Mini Program Decisions 🟢 Nice-to-have

| # | Decision | Options |
|---|---|---|
| 1 | Is WeChat distribution essential? | If yes → CN-9 → MP-1; If no → continue H5 |
| 2 | Will users primarily access via WeChat? | If yes → prioritize Mini Program; If no → browser is fine |
| 3 | Is sharing/group discovery important? | If yes → Mini Program share card is better than URL |
| 4 | Can we validate product in H5 first? | Recommended: YES — don't build two apps for an unvalidated product |

## Decision Tree

```
Internal Testing (v0.8)
  │
  ├─ Users love it, want more
  │   │
  │   └─ "I want to share in WeChat groups"
  │        → CN-8.1 fixes
  │        → CN-9 → MP-1
  │
  ├─ Users like it, but browser is fine
  │   │
  │   └─ CN-8.1 fixes
  │        → Enhance H5 (auth, social features)
  │        → Defer Mini Program
  │
  └─ Users confused / don't use
       │
       └─ Pivot product before building more
```

## What NOT to do now

- ❌ Don't start Mini Program code
- ❌ Don't add WeChat login to H5
- ❌ Don't set up Cloud Functions
- ❌ Don't change the database schema
- ❌ Don't add new features
- ❌ Don't optimize performance prematurely

## What IS ok to do now

- ✅ Share v0.8 with friends
- ✅ Observe real usage
- ✅ Document bugs and feedback
- ✅ Think about CN-9 decisions
- ✅ Prepare CloudBase for potential Mini Program binding

## Summary

**The most important thing now is getting real users on v0.8 H5.** Everything else — Mini Program, auth, Cloud Functions — should be driven by actual user feedback, not speculation.
