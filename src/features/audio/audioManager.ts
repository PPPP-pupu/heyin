import type { AudioTrack } from "./audioTypes";
import { loadAudio } from "@/services/storage/audioStorage";
import { isCloudbaseFileID, resolveTencentAudioUrl } from "@/services/tencent/storageUrls";

/**
 * AudioManager — centralized audio element controller.
 *
 * Handles local (IndexedDB), remote URL, and Tencent CloudBase (cloud://) audio sources.
 * For local audio: loads Blob from IndexedDB → creates object URL → plays.
 * For remote URL: uses URL directly.
 * For Tencent cloud:// fileID: resolves to temp URL at play time.
 *
 * Lifecycle: owned by PlaybackEngine. One manager per playback session.
 *
 * Layer: Audio Runtime
 */

export interface AudioManager {
  preload(track: AudioTrack): Promise<void>;
  play(track: AudioTrack): Promise<void>;
  pauseAll(): void;
  resumeAll(): void;
  stopAll(): void;
  cleanup(): void;
}

export function createAudioManager(): AudioManager {
  const elements = new Map<string, HTMLAudioElement>();
  // Track object URLs created from IndexedDB blobs for cleanup
  const blobUrls = new Map<string, string>();

  async function getPlayableUrl(track: AudioTrack): Promise<string> {
    // If we already have an element with a loaded URL, reuse it
    const existing = elements.get(track.id);
    if (existing && existing.src && existing.src !== window.location.href) return existing.src;

    // For local audio, load from IndexedDB
    const ref = track.source;
    if (ref.type === "local") {
      const blob = await loadAudio(ref.id);
      if (blob) {
        const url = URL.createObjectURL(blob);
        blobUrls.set(track.id, url);
        return url;
      }
      // Fallback: audio not found in IndexedDB — silent
      return "";
    }

    // For CloudBase fileID (cloud://...), resolve to temp URL first
    if (isCloudbaseFileID(ref.id)) {
      try {
        return await resolveTencentAudioUrl(ref.id);
      } catch {
        // Resolution failed — silent
        return "";
      }
    }

    // Remote audio (http/https URL or resolved path) — use directly
    return ref.id;
  }

  async function preload(track: AudioTrack): Promise<void> {
    const url = await getPlayableUrl(track);
    if (!url) return;

    let audio = elements.get(track.id);
    if (!audio) {
      audio = new Audio(url);
      audio.preload = "auto";
      elements.set(track.id, audio);
    }
    audio.load();
  }

  async function play(track: AudioTrack): Promise<void> {
    const url = await getPlayableUrl(track);
    if (!url) return;

    let audio = elements.get(track.id);
    if (!audio) {
      audio = new Audio(url);
      audio.preload = "auto";
      elements.set(track.id, audio);
    } else if (audio.src !== url) {
      audio.src = url;
    }
    audio.load();
    await audio.play().catch(() => {
      // Audio failed — missing file, expired blob URL, autoplay blocked
    });
  }

  function pauseAll(): void {
    for (const audio of elements.values()) {
      audio.pause();
    }
  }

  function resumeAll(): void {
    for (const audio of elements.values()) {
      audio.play().catch(() => {});
    }
  }

  function stopAll(): void {
    for (const audio of elements.values()) {
      audio.pause();
      audio.currentTime = 0;
      audio.src = "";
    }
    // Revoke all blob URLs created for this session
    for (const url of blobUrls.values()) {
      URL.revokeObjectURL(url);
    }
    blobUrls.clear();
    elements.clear();
  }

  function cleanup(): void {
    stopAll();
  }

  return { preload, play, pauseAll, resumeAll, stopAll, cleanup };
}
