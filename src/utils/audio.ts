import { loadAudio } from "@/services/storage/audioStorage";
import { isCloudRepositoryMode } from "@/services/repositories/repositoryMode";
import { isTencentProvider } from "@/services/repositories/cloudProvider";
import {
  getPublicAudioUrl,
  isExternalUrl,
  isStoragePath,
} from "@/services/supabase/storageUrls";
import {
  isCloudbaseFileID as isTencentFileID,
  resolveTencentAudioUrl,
} from "@/services/tencent/storageUrls";

/**
 * Play audio by ID or path.
 *
 * - http/https URL → play directly via new Audio(url)
 * - cloud:// fileID (Tencent) → resolve temp URL → play
 * - Storage path (projects/... or works/...) in Supabase mode → resolve public URL → play
 * - Storage path or fileID in Tencent mode → resolve temp URL → play
 * - Local IndexedDB key → load blob from IndexedDB → play
 */
export async function playAudioId(audioIdOrPath: string): Promise<void> {
  try {
    let url: string;

    if (isExternalUrl(audioIdOrPath)) {
      // Already a full URL — play directly
      url = audioIdOrPath;
    } else if (isTencentFileID(audioIdOrPath)) {
      // Tencent CloudBase fileID (cloud://...) — resolve to temp URL
      url = await resolveTencentAudioUrl(audioIdOrPath);
    } else if (isCloudRepositoryMode() && isTencentProvider() && isStoragePath(audioIdOrPath)) {
      // Tencent mode with plain storage path — try to resolve
      url = await resolveTencentAudioUrl(audioIdOrPath);
    } else if (isCloudRepositoryMode() && isStoragePath(audioIdOrPath)) {
      // Supabase cloud Storage path — resolve to public URL
      url = getPublicAudioUrl(audioIdOrPath);
    } else {
      // Local IndexedDB key — load blob, create object URL
      const blob = await loadAudio(audioIdOrPath);
      if (!blob) return;
      url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      await audio.play().catch(() => {});
      audio.onended = () => URL.revokeObjectURL(url);
      return;
    }

    const audio = new Audio(url);
    await audio.play().catch(() => {});
  } catch {
    // Audio not found or unsupported
  }
}
