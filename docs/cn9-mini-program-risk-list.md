# CN-9 — Mini Program Risk List

## P0 — Blockers (must resolve before MP-1)

| # | Risk | Impact | Mitigation |
|---|---|---|---|
| P0-1 | **Mini Program recording API differences** — `wx.getRecorderManager()` returns `.mp3`/`.aac`, not WebM. Playback expectations differ. | Recording/playback broken if format not handled | Test recording format early; ensure CloudBase Storage paths use correct extension |
| P0-2 | **Review rejection** — WeChat review may reject UGC audio app without proper moderation plan | Cannot launch | Research successful audio mini programs; prepare content moderation plan |
| P0-3 | **No OfflineAudioContext** — Work export (multi-track mixing) cannot run client-side | Generate Chorus broken | Cloud Function FFmpeg mixing or keep H5 for export |
| P0-4 | **InnerAudioContext limitations** — Fewer concurrent audio streams than browser; may not support Play Chorus (multi-track) | Play Chorus broken | Limit concurrent playback or use sequential playback |
| P0-5 | **CloudBase Storage upload path** — `wx.cloud.uploadFile` API differs from Web SDK `uploadFile` | Upload code needs full rewrite | Abstract upload behind same repository pattern |

## P1 — Important (should address before public use)

| # | Risk | Impact | Mitigation |
|---|---|---|---|
| P1-1 | **UI rewrite cost** — All React/Next.js components need rewrite (~25 components) | 2-4 weeks development | Use Taro framework for React→MP compilation; or accept rewrite cost |
| P1-2 | **Sharing flow differs** — Mini Program shares are cards, not URLs; deep-linking to specific project requires scene parameter | Join flow needs redesign | Use `onShareAppMessage` with `path` containing shareId |
| P1-3 | **Two codebases** — H5 + Mini Program = double maintenance | Bug fixes need to be applied twice | Share business logic via Cloud Functions; keep UI separate |
| P1-4 | **No IndexedDB fallback** — H5 can work offline; MP must always be online | Offline mode unavailable | All audio must go through CloudBase Storage (already the case for Tencent mode) |
| P1-5 | **Audio format consistency** — H5 records WebM, MP records MP3. Playback must handle both | Cross-platform playback complexity | Normalize format expectations; document clearly |
| P1-6 | **CloudBase rules tightening** — opening permissions for Mini Program might expose H5 to abuse | Security regression | Apply consistent security rules; add openid-based ownership where possible |

## P2 — Polish (deferrable)

| # | Risk | Impact | Mitigation |
|---|---|---|---|
| P2-1 | **Visual polish** — Mini Program has different UI conventions than H5 | Looks different from H5 | Design consistency review before launch |
| P2-2 | **Analytics** — No built-in analytics without adding tracking | Can't measure usage | Add WeChat Analytics or custom logging |
| P2-3 | **Onboarding** — Mini Program users have different expectations for first-time experience | Confusion if flow differs from H5 | Align onboarding between H5 and MP |
| P2-4 | **File size limit** — 10MB per file upload in Mini Program vs virtually unlimited in browser | Long recordings may fail | Document limit; show warning for long recordings |

## Summary

| Priority | Count | Action |
|---|---|---|
| P0 | 5 | Must resolve before starting MP-1 |
| P1 | 6 | Should resolve before public use |
| P2 | 4 | Defer to post-launch polish |

**Overall risk level: MEDIUM** — feasible but non-trivial. The P0 risks around recording and mixing require architectural decisions before code begins.
