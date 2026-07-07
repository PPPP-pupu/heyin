# China Deployment Guide — Heyin (和音)

## A. Recommended Deployment Path

**Primary choice:** Tencent Cloud EdgeOne Pages or CloudBase Hosting (static + SSR support for Next.js).

**Fallback:** Tencent Cloud Lighthouse / Alibaba ECS Node server with `npm run start` + PM2.

## B. Environment Variables (China H5 with Supabase backend, temporary)

```
NEXT_PUBLIC_SUPABASE_URL=https://jdupleowmmdiflutwlqc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
NEXT_PUBLIC_HEYIN_STORAGE_MODE=cloud
NEXT_PUBLIC_HEYIN_CLOUD_PROVIDER=supabase
```

## C. Future Tencent Environment Variables (placeholders)

```
NEXT_PUBLIC_HEYIN_STORAGE_MODE=cloud
NEXT_PUBLIC_HEYIN_CLOUD_PROVIDER=tencent
NEXT_PUBLIC_TENCENT_CLOUDBASE_ENV_ID=
NEXT_PUBLIC_TENCENT_REGION=
NEXT_PUBLIC_TENCENT_STORAGE_BUCKET=
```

Do not commit real keys.

## D. EdgeOne / CloudBase Hosting QA Checklist

| # | Test | Expected |
|---|---|---|
| 1 | Open home page on China mobile | Page loads |
| 2 | Open `/create` | Form loads |
| 3 | Create project | Redirects to `/project/{id}` |
| 4 | Share link | Uses China platform domain |
| 5 | Open `/join/{shareId}` on phone | Join page loads |
| 6 | Microphone permission | Browser prompts |
| 7 | Recording UI | Start/stop works, preview works |
| 8 | Submit | If Supabase upload fails, document as network limitation |

Supabase upload failure is NOT a frontend deployment failure.

## E. Fallback Node Server Deployment

```bash
npm install
npm run build
npm run start
# Optional:
pm2 start npm --name heyin -- start
```

HTTPS is required for stable microphone permission in browsers.

## F. ICP / Compliance Notes

- For short-term testing, use platform temporary domain
- For public China deployment with custom domain, ICP filing is likely required
- For future WeChat Mini Program, separate 备案/审核 needed
