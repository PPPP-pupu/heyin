# APP-1 — QA Checklist

## A. Android

| # | Test | Expected | Result |
|---|---|---|---|
| 1 | App launches | Splash → H5 loads | ⬜ |
| 2 | Home page | Create / Explore buttons visible | ⬜ |
| 3 | Join link opens | Nickname gate appears | ⬜ |
| 4 | Microphone permission | App-level dialog appears | ⬜ |
| 5 | Start Recording | Timer counts up | ⬜ |
| 6 | Stop Recording | Preview available | ⬜ |
| 7 | Submit | Upload succeeds, slot filled | ⬜ |
| 8 | Playback (individual) | Voice plays | ⬜ |
| 9 | Play Chorus | Multi-track plays | ⬜ |
| 10 | Generate Chorus | Export succeeds | ⬜ |
| 11 | Work page | Audio plays, versions switch | ⬜ |

## B. iOS

| # | Test | Expected | Result |
|---|---|---|---|
| 1 | App launches | Splash → H5 loads | ⬜ |
| 2 | Microphone permission text | Shows "Heyin needs microphone access..." | ⬜ |
| 3 | Recording | Works in WKWebView | ⬜ |
| 4 | Submit | Upload succeeds | ⬜ |
| 5 | Playback | Audio plays | ⬜ |
| 6 | Work page | Works correctly | ⬜ |

## C. Network

| # | Test | Expected | Result |
|---|---|---|---|
| 1 | Wi-Fi | All features work | ⬜ |
| 2 | 4G/5G | Upload completes | ⬜ |
| 3 | Expired Preview URL | App shows error, not crash | ⬜ |

## D. Known Potential Issues

| Issue | Check |
|---|---|
| MediaRecorder not available in Android WebView | May require native bridge (APP-1.1) |
| Microphone permission denied silently | Check platform permission settings |
| Audio playback blocked by autoplay policy | Requires user gesture; recording flow already has this |
| CloudBase CORS from app origin | Check security domain list |
| WKWebView cookie/storage persistence | localStorage may differ from Safari |
