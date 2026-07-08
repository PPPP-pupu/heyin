# v0.8.2 — UX Polish Feedback Test Plan

## What This Round Is For

v0.8.1 proved the technical chain works. v0.8.2 makes it easier for ordinary testers to use without explanation.

## Tester Instructions (copy-paste)

```
Hi! I made a chorus recording tool and want to test if it's easy to use.

Please:
1. Open this link: 【join link】
2. Enter a nickname
3. Choose an empty line
4. Allow microphone
5. Record your part
6. Tap Submit
7. Tap your filled slot to hear your voice

You only need to record one line!
```

## What to Collect

| Tester | Device | Browser | Knew which slot? | Knew to Submit? | Upload success? | Heard playback? | Confusing part? | Would use again? |
|---|---|---|---|---|---|---|---|
| 1 | | | ⬜ | ⬜ | ⬜ | ⬜ | | |
| 2 | | | ⬜ | ⬜ | ⬜ | ⬜ | | |
| 3 | | | ⬜ | ⬜ | ⬜ | ⬜ | | |
| 4 | | | ⬜ | ⬜ | ⬜ | ⬜ | | |
| 5 | | | ⬜ | ⬜ | ⬜ | ⬜ | | |

## UX Checklist (self-test)

| # | Check | Result |
|---|---|---|
| 1 | "How to join" guide visible on join page | ⬜ |
| 2 | Empty slot says "Tap to record this line" | ⬜ |
| 3 | Claimed slot says "Reserved for you" (self) or "Someone is recording" (other) | ⬜ |
| 4 | Recording modal says "Record this line" + "You can preview before submitting" | ⬜ |
| 5 | Recording timer shows "Tap Stop when you finish" | ⬜ |
| 6 | Preview says "Preview your recording" | ⬜ |
| 7 | Submit button says "Submit Voice" / "Uploading..." | ⬜ |
| 8 | Submit failure says "Your recording is still here" | ⬜ |
| 9 | Submit success "Voice submitted!" appears | ⬜ |
| 10 | ExportButton shows "Loading voices" / "Mixing chorus" / "Creating WAV" | ⬜ |
| 11 | Work page says "Final chorus from N voices" | ⬜ |
| 12 | Version selector says "Chorus versions" with explanation | ⬜ |
| 13 | Error messages are friendly, not technical | ⬜ |

## Success Criteria

- [ ] At least 3 testers complete the flow without help
- [ ] No tester asks "what do I click?"
- [ ] No tester forgets to Submit
- [ ] No tester confuses the Work page
