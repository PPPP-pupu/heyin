# CN-8.1.1 — Owner Token / Management Protection

## Why

Without any owner protection, anyone with the project URL can delete, lock, or close the project. This is not acceptable even for small-group testing.

## What It Protects

| Action | Before | After |
|---|---|---|
| Delete Project | Anyone | Owner only |
| Lock Submissions | Anyone | Owner only |
| Mark Completed | Anyone | Owner only |
| Re-open | Anyone | Owner only |
| Generate Chorus | Anyone | Owner only |
| View project / slots | Anyone | Anyone |
| Play Chorus | Anyone | Anyone |
| Share link | Anyone | Anyone (shares join link, not owner URL) |
| Join + Record + Submit | Anyone | Anyone (unchanged) |

## How It Works

```
Create project
  → generate random owner token (crypto.getRandomValues)
  → SHA-256 hash → store in projects.ownerTokenHash
  → save raw token to localStorage
  → redirect to /project/{id}?owner={rawToken}

Owner visits project page:
  1. Check ?owner= URL param → hash matches? → YES → save to localStorage → owner
  2. Check localStorage token → hash matches? → YES → owner
  3. No match → viewer mode

Join page:
  → Share button always generates /join/{shareId} (no owner token)
  → Recording + submit unchanged
```

## What It Does NOT Protect

- Anyone with the project URL can still VIEW all slots and recordings
- Join link is still public
- Claim is still best-effort (not atomic)
- Delete Storage cleanup is still incomplete
- This is NOT production auth — it's a UI-level guard for internal testing

## Storage

| Location | What | Format |
|---|---|---|
| CloudBase `projects.ownerTokenHash` | SHA-256 hash | hex string |
| localStorage `heyin:ownerToken:{id}` | raw token | URL-safe base64 |
| URL `?owner=` | raw token | URL-safe base64 |

Raw token is NEVER stored in the database.

## Future Production Plan

- CloudBase security rules: restrict delete/update to owner
- Cloud Functions: validate owner token server-side
- WeChat openid: real user identity
- Or: proper login/register system

## QA

- [x] Create project → URL has ?owner=, creator sees management buttons
- [x] Open /project/{id} without ?owner= → viewer mode, no management buttons
- [x] Share button → gives join link, not owner URL
- [x] Join + record + submit still works
- [x] Refresh with ?owner= → still recognized as owner (localStorage)
- [x] Legacy project (no ownerTokenHash) → backward compatible with warning
- [x] Lint passes
- [x] Build passes
