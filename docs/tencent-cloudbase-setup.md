# Tencent CloudBase Setup Guide — Heyin (和音)

## A. Recommended Tencent Architecture for China MVP

```
Frontend H5:     Tencent EdgeOne Pages (already deployed) or CloudBase Hosting
Database:        Tencent CloudBase Database (NoSQL, document-based)
Audio Storage:   CloudBase Storage or Tencent COS
Future:          WeChat Mini Program + CloudBase
```

## B. Why CloudBase First

- Better integration with WeChat ecosystem
- Easier future Mini Program migration (shared auth, shared DB)
- No need to run own server at this stage
- CloudBase Storage handles audio file upload/download for MVP scale
- Unified SDK for DB + Storage + Functions

## C. When to Use COS Directly

Switch from CloudBase Storage to COS when:
- Audio file volume grows beyond CloudBase Storage limits
- Need CDN acceleration for audio playback
- Need fine-grained ACL/bucket policies
- Large file management (multiple GB)

For MVP, CloudBase Storage is sufficient.

## D. Manual Tencent CloudBase Setup Steps

### 1. Create Tencent Cloud Account
- https://cloud.tencent.com
- Requires Chinese ID verification (实名认证)

### 2. Create CloudBase Environment
- Console → CloudBase (云开发)
- Create new environment
- Choose **Pay-as-you-go** (按量计费) for MVP
- Record:
  - Environment ID (ENV_ID)
  - Region (ap-shanghai, ap-guangzhou, etc.)

### 3. Create Database Collections
- Console → CloudBase → Database
- Create these collections:
  - `projects`
  - `lyric_lines`
  - `voice_slots`
  - `voice_submissions`
  - `works`
  - `work_versions`

### 4. Create Indexes
- `projects`: shareId (unique)
- `lyric_lines`: projectId + lineIndex
- `voice_slots`: projectId, projectId + status
- `voice_submissions`: projectId, slotId
- `works`: projectId
- `work_versions`: workId, projectId

### 5. Configure Storage
- Console → CloudBase → Storage
- Create folder structure (optional, will be created on upload):
  - `projects/`
  - `works/`

### 6. Security Rules (MVP closed testing)
- Database: allow read/write for all collections (temporary)
- Storage: allow read/write for all paths (temporary)
- Mark as UNSAFE for production — tighten before public launch

### 7. Environment Variables
Add to deployment platform (EdgeOne / Vercel):
```
NEXT_PUBLIC_HEYIN_STORAGE_MODE=cloud
NEXT_PUBLIC_HEYIN_CLOUD_PROVIDER=tencent
NEXT_PUBLIC_TENCENT_CLOUDBASE_ENV_ID=your-env-id
NEXT_PUBLIC_TENCENT_REGION=ap-shanghai
NEXT_PUBLIC_TENCENT_STORAGE_BUCKET=heyin-audio
```

### 8. Warning
Setting `PROVIDER=tencent` WILL throw "not implemented" until CN-4/CN-5 complete.
Keep `PROVIDER=supabase` for current deployment.

## F. Required Frontend Env Vars (placeholders)

```
NEXT_PUBLIC_HEYIN_STORAGE_MODE=cloud
NEXT_PUBLIC_HEYIN_CLOUD_PROVIDER=tencent
NEXT_PUBLIC_TENCENT_CLOUDBASE_ENV_ID=
NEXT_PUBLIC_TENCENT_REGION=
NEXT_PUBLIC_TENCENT_STORAGE_BUCKET=
```

Do NOT commit real values.
