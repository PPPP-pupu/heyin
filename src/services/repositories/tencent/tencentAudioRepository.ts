import type { AudioRepository } from "../types";
import { getTencentApp } from "@/services/tencent/client";
import {
  isExternalUrl,
  isCloudbaseFileID,
  getAudioExtension,
  resolveTencentAudioUrl,
} from "@/services/tencent/storageUrls";

/**
 * tencentAudioRepository — AudioRepository backed by CloudBase Storage.
 *
 * saveAudio uploads a Blob to CloudBase Storage and returns the CloudBase fileID.
 * The fileID (cloud://...) is stored in voice_submissions.audioPath.
 * At playback time, resolveTencentAudioUrl() converts fileID to a temp HTTPS URL.
 *
 * Layer: Storage Layer (⬛)
 */

/** Wraps a Blob as a File if needed — CloudBase uploadFile expects a File. */
function blobToFile(blob: Blob, filename: string): File {
  if (blob instanceof File) return blob;
  return new File([blob], filename, { type: blob.type || "audio/webm" });
}

export const tencentAudioRepository: AudioRepository = {
  async saveAudio(blob, pathHint) {
    const app = await getTencentApp();
    if (!app) {
      throw new Error(
        "Tencent CloudBase is not initialized. Set NEXT_PUBLIC_TENCENT_CLOUDBASE_ENV_ID."
      );
    }

    const ext = getAudioExtension(blob.type);
    const cloudPath =
      pathHint ?? `uploads/${crypto.randomUUID()}.${ext}`;
    const filename = cloudPath.split("/").pop() ?? `audio.${ext}`;
    const file = blobToFile(blob, filename);

    try {
      const result = await app.uploadFile({
        cloudPath,
        filePath: file,
      });

      if (!result?.fileID) {
        throw new Error(
          `CloudBase uploadFile returned no fileID for ${cloudPath}. ` +
          `Result: ${JSON.stringify(result)}`
        );
      }

      // Return the CloudBase fileID (cloud://...), not a public URL
      return result.fileID;
    } catch (err) {
      throw new Error(
        `Failed to upload audio to CloudBase Storage at "${cloudPath}": ` +
        `${err instanceof Error ? err.message : String(err)}. ` +
        `Blob type=${blob.type || "unknown"}, size=${blob.size} bytes.`
      );
    }
  },

  async loadAudio(idOrPath) {
    // Already a direct URL — fetch it
    if (isExternalUrl(idOrPath)) {
      try {
        const res = await fetch(idOrPath);
        if (!res.ok) return null;
        return await res.blob();
      } catch {
        return null;
      }
    }

    // CloudBase fileID or storage path — resolve to temp URL, then fetch
    try {
      const url = await resolveTencentAudioUrl(idOrPath);
      const res = await fetch(url);
      if (!res.ok) return null;
      return await res.blob();
    } catch {
      return null;
    }
  },

  async deleteAudio(idOrPath) {
    const app = await getTencentApp();
    if (!app) {
      throw new Error(
        "Tencent CloudBase is not initialized. Cannot delete audio."
      );
    }

    // If it's an external URL, we can't delete from CloudBase — skip
    if (isExternalUrl(idOrPath)) {
      return;
    }

    let fileID: string;

    if (isCloudbaseFileID(idOrPath)) {
      fileID = idOrPath;
    } else {
      // Plain storage path — can't delete without fileID
      // Best-effort: skip with a warning
      console.warn(
        `Cannot delete audio at "${idOrPath}": only CloudBase fileIDs (cloud://...) are supported for deletion.`
      );
      return;
    }

    try {
      const result = await app.deleteFile({
        fileList: [fileID],
      });

      const fileInfo = result?.fileList?.[0];
      if (fileInfo && fileInfo.code !== "SUCCESS") {
        // File not found is not an error worth throwing
        console.warn(
          `CloudBase deleteFile for ${fileID}: ${fileInfo.code}`
        );
      }
    } catch (err) {
      throw new Error(
        `Failed to delete audio ${fileID}: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  },

  async deleteAllAudio() {
    throw new Error("deleteAllAudio is disabled for Tencent cloud repositories.");
  },
};
