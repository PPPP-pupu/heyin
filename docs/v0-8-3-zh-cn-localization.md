# v0.8.3 — 中文本地化 / zh-CN Localization

## What Was Localized

All user-facing English text → Simplified Chinese across:

| Area | Files |
|---|---|
| Metadata | `layout.tsx` description |
| Home page | tagline, buttons |
| Create page | labels, placeholders, helpers, errors, submit button |
| Explore page | title, empty state, progress text |
| Join page | title, nickname gate, onboarding, slot labels, claim errors, submit success, cloud notice, temp URL warning |
| Project page | title, status buttons, playback controls, export, delete, owner/viewer notices, error/empty states |
| Work page | hero stats, version selector, audio player, progress, participants, links, not-found state |
| Profile page | all labels, helpers, buttons, danger zone |
| RecordingModal | all state copy, labels, buttons, error messages |
| VoiceBubble | empty/claimed/filled copy |
| ExportButton | button text, progress labels, ready/error states |
| ShareButton | button text, copied state, share message |
| WorkHero/WorkProgress/WorkParticipants/VersionSelector/WorkAudioPlayer | all labels |
| TemporaryAccessWarning | full Chinese |
| Error messages | all user-facing errors |

## What Was NOT Translated

- Code identifiers, type names, function names, variable names
- Collection names, storage paths, env var names
- Console.error developer messages
- Code comments
- Product name "Heyin" / "和音"
- Technical terms: WAV, UUID, URL, WebM (in context)

## Remaining English Allowed

- "WAV" (file format)
- "Heyin" (product name)
- Browser-native audio control labels (play, pause, volume — rendered by browser)
