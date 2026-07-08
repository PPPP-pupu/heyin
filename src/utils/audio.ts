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
export async function playAudioId(audioIdOrPath: string, volume?: number): Promise<void> {
  try {
    let url: string;

    if (isExternalUrl(audioIdOrPath)) {
      url = audioIdOrPath;
    } else if (isTencentFileID(audioIdOrPath)) {
      url = await resolveTencentAudioUrl(audioIdOrPath);
    } else if (isCloudRepositoryMode() && isTencentProvider() && isStoragePath(audioIdOrPath)) {
      url = await resolveTencentAudioUrl(audioIdOrPath);
    } else if (isCloudRepositoryMode() && isStoragePath(audioIdOrPath)) {
      url = getPublicAudioUrl(audioIdOrPath);
    } else {
      const blob = await loadAudio(audioIdOrPath);
      if (!blob) return;
      url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      if (volume !== undefined) audio.volume = Math.min(1, Math.max(0, volume));
      await audio.play().catch(() => {});
      audio.onended = () => URL.revokeObjectURL(url);
      return;
    }

    const audio = new Audio(url);
    if (volume !== undefined) audio.volume = Math.min(1, Math.max(0, volume));
    await audio.play().catch(() => {});
  } catch {
    // Audio not found or unsupported
  }
}
