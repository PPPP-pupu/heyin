# Tencent Security Rules — Heyin (和音)

## A. MVP Closed Testing Rules

For closed beta testing (small trusted group):

```
Database: allow read/write for all collections
Storage:  allow read/write for all paths
```

⚠️ **UNSAFE for production.** Mark as temporary.

## B. Before Public Launch

Must prevent these attack vectors:

| Risk | Mitigation |
|---|---|
| Anyone deleting any project | Restrict delete to project creator or admin |
| Anyone overwriting any slot | Validate slot ownership before update |
| Spam submissions | Rate limit per guest or IP |
| Arbitrary Storage delete | Restrict to project creator |
| Massive file upload abuse | File size limit, rate limit |

## C. Suggested Future Security Models

### Option 1: Guest Token Model
- On first visit, generate a guest UUID
- Store in localStorage
- Use guest UUID as lightweight identity
- Scope writes to guest's own slots/submissions

### Option 2: WeChat OpenID Model
- Use WeChat login / wx.login() in Mini Program
- Get openid from Cloud Function
- Use openid as identity
- Best for WeChat Mini Program integration

### Option 3: Project Creator Token
- When creating a project, generate a creator token
- Store token in URL or localStorage
- Use token to authorize project mutations
- Participants use guest UUID for slot operations

### Option 4: Slot Claim Token
- When claiming a slot, generate a one-time claim token
- Token required for subsequent submit/update
- Token expires after submission or timeout
- Prevents other guests from hijacking claimed slots

## D. Claim Race Condition

CN-5 must address the claim race condition:

**Problem:** Two guests may try to claim the same empty slot simultaneously.

**MVP approach:** Best-effort conditional update. If CloudBase supports atomic `where` conditions, use them. Otherwise, accept rare race for closed beta.

**Production approach:** Use a Cloud Function that atomically checks status and updates in one transaction, OR use a conditional write primitive if CloudBase supports it.

## E. Recommended Rollout

```
CN-3: Permissive rules for internal testing (this phase)
CN-5: Guest token for basic slot ownership (MVP)
CN-8: Tighten rules before public testing
Post-MVP: WeChat openid or proper auth
```
