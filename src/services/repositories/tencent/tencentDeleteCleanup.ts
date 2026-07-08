/**
 * Best-effort delete helpers for Tencent CloudBase project cleanup.
 *
 * Storage file deletion is best-effort — missing files or partial failures
 * do not block database deletion.
 *
 * Layer: Storage Layer (⬛)
 */

import { getTencentApp } from "@/services/tencent/client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function unwrap(res: any) {
  if (res.error) throw new Error(res.error.message || "CloudBase error");
  return res.data ?? res;
}

/** Collect all cloud:// fileIDs from voice_submissions for a project. */
export async function collectVoiceSubmissionFileIds(
  db: unknown,
  projectId: string
): Promise<string[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d = db as any;
  try {
    const res = await d.collection("voice_submissions").where({ projectId }).get();
    const data = unwrap(res);
    const docs = Array.isArray(data) ? data : [];
    const ids: string[] = [];
    for (const doc of docs) {
      const path = doc.audioPath as string | undefined;
      if (path && path.startsWith("cloud://")) {
        ids.push(path);
      }
    }
    return ids;
  } catch {
    return [];
  }
}

/** Collect all cloud:// fileIDs from works and work_versions for a project. */
export async function collectWorkFileIds(
  db: unknown,
  projectId: string
): Promise<string[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d = db as any;
  const ids: string[] = [];
  try {
    // Collect works
    const workRes = await d.collection("works").where({ projectId }).get();
    const workDocs = Array.isArray(unwrap(workRes)) ? unwrap(workRes) : [];
    const workIds: string[] = [];
    for (const doc of workDocs) {
      workIds.push(doc.id ?? (doc as Record<string, unknown>)._id as string);
      const path = doc.audioPath as string | undefined;
      if (path && path.startsWith("cloud://")) ids.push(path);
    }

    // Collect work_versions for each work
    for (const wid of workIds) {
      try {
        const verRes = await d.collection("work_versions").where({ workId: wid }).get();
        const verDocs = Array.isArray(unwrap(verRes)) ? unwrap(verRes) : [];
        for (const vd of verDocs) {
          const path = vd.audioPath as string | undefined;
          if (path && path.startsWith("cloud://")) ids.push(path);
        }
      } catch {
        // Best-effort
      }
    }
    return ids;
  } catch {
    return [];
  }
}

/** Delete CloudBase Storage files by fileID. Best-effort — does not throw on missing files. */
export async function deleteTencentFilesBestEffort(
  fileIds: string[]
): Promise<string[]> {
  const app = await getTencentApp();
  if (!app || fileIds.length === 0) return [];

  // Deduplicate
  const unique = [...new Set(fileIds)];
  const warnings: string[] = [];

  try {
    const result = await app.deleteFile({ fileList: unique });
    const fileList = result?.fileList ?? [];

    for (let i = 0; i < fileList.length; i++) {
      const info = fileList[i];
      if (info && info.code !== "SUCCESS") {
        const fid = unique[i] ?? "unknown";
        if (info.code !== "OBJECT_NOT_EXIST") {
          warnings.push(`Failed to delete ${fid}: ${info.code}`);
        }
        // OBJECT_NOT_EXIST is expected for already-deleted files — not a warning
      }
    }
  } catch (err) {
    warnings.push(
      `Storage file deletion failed: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  return warnings;
}

/** Delete all documents in a collection matching a field value. */
export async function deleteDocsByField(
  db: unknown,
  collection: string,
  field: string,
  value: string
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d = db as any;
  try {
    const res = await d.collection(collection).where({ [field]: value }).get();
    const data = unwrap(res);
    const docs = Array.isArray(data) ? data : [];
    for (const doc of docs) {
      await d.collection(collection)
        .doc(doc.id ?? (doc as Record<string, unknown>)._id)
        .remove();
    }
  } catch {
    // Best-effort — collection may be empty
  }
}
