import { loadAudio } from "@/services/storage/audioStorage";
import { isCloudRepositoryMode } from "@/services/repositories/repositoryMode";
import {
  getPublicAudioUrl,
  isExternalUrl,
  isStoragePath,
} from "@/services/supabase/storageUrls";

/**
 * Play audio by ID or path.
 *
 * - http/https URL → play directly via new Audio(url)
 * - Storage path (projects/... or works/...) in cloud mode → resolve public URL → play
 * - Local IndexedDB key → load blob from IndexedDB → play
 */
export async function playAudioId(audioIdOrPath: string): Promise<void> {
  try {
    let url: string;

    if (isExternalUrl(audioIdOrPath)) {
      // Already a full URL — play directly
      url = audioIdOrPath;
    } else if (isCloudRepositoryMode() && isStoragePath(audioIdOrPath)) {
      // Cloud Storage path — resolve to public URL
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
