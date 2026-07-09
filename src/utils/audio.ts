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
export interface PlayAudioOptions {
  volume?: number;
  onStart?: () => void;
  onEnded?: () => void;
  onError?: () => void;
}

const audioUrlCache = new Map<string, string>();

/** Clear cached audio URL(s). Call when recording is replaced or deleted. */
export function clearAudioCache(audioId?: string): void {
  if (audioId) {
    const cached = audioUrlCache.get(audioId);
    if (cached?.startsWith("blob:")) URL.revokeObjectURL(cached);
    audioUrlCache.delete(audioId);
  } else {
    for (const [, u] of audioUrlCache) { if (u.startsWith("blob:")) URL.revokeObjectURL(u); }
    audioUrlCache.clear();
  }
}

export async function playAudioId(audioIdOrPath: string, options?: number | PlayAudioOptions): Promise<void> {
  const opts: PlayAudioOptions = typeof options === "number" ? { volume: options } : (options ?? {});

  // Check cache for resolved URL
  const cacheKey = audioIdOrPath;
  const cached = audioUrlCache.get(cacheKey);
  if (cached && (isExternalUrl(cached) || cached.startsWith("blob:"))) {
    const audio = new Audio(cached);
    if (opts.volume !== undefined) audio.volume = Math.min(1, Math.max(0, opts.volume));
    opts.onStart?.();
    audio.onended = () => opts.onEnded?.();
    audio.onerror = () => { audioUrlCache.delete(cacheKey); opts.onError?.(); };
    await audio.play().catch(() => { audioUrlCache.delete(cacheKey); opts.onError?.(); });
    return;
  }

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
    }

    // Cache the resolved URL for repeat playback
    if (!url.startsWith("blob:")) audioUrlCache.set(cacheKey, url);

    const audio = new Audio(url);
    if (opts.volume !== undefined) audio.volume = Math.min(1, Math.max(0, opts.volume));
    opts.onStart?.();
    audio.onended = () => opts.onEnded?.();
    audio.onerror = () => { audioUrlCache.delete(cacheKey); opts.onError?.(); };
    await audio.play().catch(() => { audioUrlCache.delete(cacheKey); opts.onError?.(); });
  } catch {
    opts.onError?.();
  }
}
