# CN-8.1.4 — EdgeOne Stable Public URL

## Problem

Mobile users get `401: UNAUTHORIZED` from EdgeOne Makers. This is caused by EdgeOne preview URLs expiring after 3 hours (China acceleration region).

ShareButton used `window.location.origin` to generate join links. If the creator opened a temporary EdgeOne preview URL, the generated join link would also expire.

## Fix

### Code Changes

| File | Change |
|---|---|
| `src/utils/publicBaseUrl.ts` | NEW — stable base URL resolution |
| `src/utils/share.ts` | generateJoinUrl uses `getPublicBaseUrl()` instead of `window.location.origin` |
| `src/components/common/TemporaryAccessWarning.tsx` | NEW — amber warning on temporary EdgeOne hosts |
| `src/app/page.tsx` | Renders warning |
| `src/app/join/[projectId]/page.tsx` | Renders warning |

### New Environment Variable

```
NEXT_PUBLIC_HEYIN_PUBLIC_BASE_URL=https://your-custom-domain.com
```

When set, share links use this domain. When unset, falls back to `window.location.origin`.

## Required Manual Steps

### Temporary

Before each test session, click **Preview** in EdgeOne Makers console to get a fresh link. Good for 3 hours.

### Permanent

1. Bind custom domain in EdgeOne Makers → Domain Management
2. Add DNS CNAME record
3. Wait for HTTPS/certificate
4. Set env var in EdgeOne:
   ```
   NEXT_PUBLIC_HEYIN_PUBLIC_BASE_URL=https://heyin.yourdomain.com
   ```
5. Redeploy

### ICP Note

For China mainland or global (including mainland) acceleration, custom domain requires ICP filing.

## QA

- [x] localhost dev still uses localhost origin (no env var)
- [x] EdgeOne temporary host shows amber warning
- [x] With env var set, share links use configured domain
- [x] Lint + Build pass
