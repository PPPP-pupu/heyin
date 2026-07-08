import type { AudioTrack } from "./audioTypes";
import { loadAudio } from "@/services/storage/audioStorage";
import { isCloudbaseFileID, resolveTencentAudioUrl } from "@/services/tencent/storageUrls";

/**
 * AudioManager — centralized audio element controller.
 *
 * Handles local (IndexedDB), remote URL, and Tencent CloudBase (cloud://) audio sources.
 * Supports live volume updates via updateTrackVolume() for real-time mix control.
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
  /** Update volume of a currently-playing track in real time. 0=mute, 1=normal, capped at 1 for HTMLAudioElement. */
  updateTrackVolume(trackKey: string, volume: number): void;
  /** Batch-update volumes from a map of trackKey → volume. */
  updateVolumes(volumeMap: Record<string, number>): void;
}

export function createAudioManager(): AudioManager {
  const elements = new Map<string, HTMLAudioElement>();
  const blobUrls = new Map<string, string>();
  /** Active audio elements keyed by slotId for live volume control. */
  const activeAudios = new Map<string, HTMLAudioElement>();

  async function getPlayableUrl(track: AudioTrack): Promise<string> {
    const existing = elements.get(track.id);
    if (existing && existing.src && existing.src !== window.location.href) return existing.src;

    const ref = track.source;
    if (ref.type === "local") {
      const blob = await loadAudio(ref.id);
      if (blob) {
        const url = URL.createObjectURL(blob);
        blobUrls.set(track.id, url);
        return url;
      }
      return "";
    }

    if (isCloudbaseFileID(ref.id)) {
      try {
        return await resolveTencentAudioUrl(ref.id);
      } catch {
        return "";
      }
    }

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
    const vol = Math.min(1, Math.max(0, track.volume ?? 1));
    audio.volume = vol;

    // Track active audio for live volume control (use slotId as stable key)
    if (track.slotId) activeAudios.set(track.slotId, audio);
    // Also track by track ID
    activeAudios.set(track.id, audio);

    audio.onended = () => {
      if (track.slotId) activeAudios.delete(track.slotId);
      activeAudios.delete(track.id);
    };

    await audio.play().catch(() => {
      if (track.slotId) activeAudios.delete(track.slotId);
      activeAudios.delete(track.id);
    });
  }

  function updateTrackVolume(trackKey: string, volume: number): void {
    const audio = activeAudios.get(trackKey);
    if (!audio) return;
    audio.volume = Math.min(1, Math.max(0, volume));
  }

  function updateVolumes(volumeMap: Record<string, number>): void {
    for (const [key, vol] of Object.entries(volumeMap)) {
      updateTrackVolume(key, vol);
    }
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
    for (const url of blobUrls.values()) {
      URL.revokeObjectURL(url);
    }
    blobUrls.clear();
    elements.clear();
    activeAudios.clear();
  }

  function cleanup(): void {
    stopAll();
  }

  return { preload, play, pauseAll, resumeAll, stopAll, cleanup, updateTrackVolume, updateVolumes };
}
