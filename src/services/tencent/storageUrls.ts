/**
 * Tencent CloudBase Storage URL utilities.
 *
 * audioPath stores the CloudBase fileID (e.g. cloud://env-id.xxx/projects/...)
 * or a plain storage path. At playback time, resolve to a temporary HTTPS URL
 * via CloudBase getTempFileURL API.
 *
 * Layer: Storage Layer (⬛)
 */

import { getTencentApp } from "./client";

/**
 * Check whether a string is a CloudBase fileID.
 *
 * CloudBase fileID format: cloud://env-id.bucket-id/path/to/file
 */
export function isCloudbaseFileID(str: string): boolean {
  return str.startsWith("cloud://");
}

/**
 * Check whether a string is already an external URL (http/https).
 */
export function isExternalUrl(str: string): boolean {
  return str.startsWith("http://") || str.startsWith("https://");
}

/**
 * Check whether a string looks like a storage path
 * (starts with "projects/" or "works/").
 */
export function isStoragePath(str: string): boolean {
  return str.startsWith("projects/") || str.startsWith("works/");
}

/**
 * Map audio MIME type to file extension.
 *
 * Supported: audio/webm → webm, audio/ogg → ogg, audio/mp4 → m4a,
 *            audio/mpeg → mp3, audio/wav → wav. Fallback: webm.
 */
export function getAudioExtension(mimeType: string | undefined): string {
  if (!mimeType) return "webm";
  if (mimeType.includes("webm")) return "webm";
  if (mimeType.includes("ogg")) return "ogg";
  if (mimeType.includes("mp4")) return "m4a";
  if (mimeType.includes("mpeg") || mimeType.includes("mp3")) return "mp3";
  if (mimeType.includes("wav")) return "wav";
  return "webm";
}

/**
 * Build a Tencent CloudBase Storage path for a voice submission.
 *
 * Format: projects/{projectId}/submissions/{submissionId}.{ext}
 */
export function buildTencentSubmissionPath(input: {
  projectId: string;
  submissionId: string;
  mimeType?: string;
}): string {
  const ext = getAudioExtension(input.mimeType);
  return `projects/${input.projectId}/submissions/${input.submissionId}.${ext}`;
}

/**
 * Resolve a CloudBase fileID or storage path to a temporary playable HTTPS URL.
 *
 * - http/https URL → return as-is
 * - cloud:// fileID → call CloudBase getTempFileURL
 * - plain storage path → try to resolve via CloudBase (construct fileID and get temp URL)
 */
export async function resolveTencentAudioUrl(idOrPath: string): Promise<string> {
  // Already a playable URL
  if (isExternalUrl(idOrPath)) {
    return idOrPath;
  }

  const app = await getTencentApp();
  if (!app) {
    throw new Error("Tencent CloudBase is not initialized. Cannot resolve audio URL.");
  }

  let fileID: string;

  if (isCloudbaseFileID(idOrPath)) {
    fileID = idOrPath;
  } else {
    // Plain storage path — need to construct fileID.
    // CloudBase fileID format: cloud://{envId}.{bucketId}/{path}
    // The env ID is known but bucket ID varies. Try to construct from common patterns.
    // If this fails, the caller should store the fileID from upload.
    throw new Error(
      `Cannot resolve plain storage path "${idOrPath}" without CloudBase fileID. ` +
      `Store the fileID returned by uploadFile() instead of the path.`
    );
  }

  try {
    const result = await app.getTempFileURL({
      fileList: [fileID],
    });

    const fileInfo = result?.fileList?.[0];
    if (!fileInfo || fileInfo.code !== "SUCCESS") {
      throw new Error(
        `Failed to get temp URL for ${fileID}: ${fileInfo?.code ?? "unknown error"}`
      );
    }

    return fileInfo.tempFileURL;
  } catch (err) {
    throw new Error(
      `Failed to resolve Tencent audio URL for ${fileID}: ${err instanceof Error ? err.message : String(err)}`
    );
  }
}
