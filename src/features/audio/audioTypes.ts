import type { AudioReference } from "./audioReference";

/**
 * Shared audio types — the common contract for Playback, Export,
 * and future cloud storage.
 *
 * Layer: Audio Runtime (pure data, no logic)
 */

export interface AudioTrack {
  /** VoiceSubmission id */
  id: string;
  /** Parent VoiceSlot id */
  slotId: string;
  /** Audio source reference (local IndexedDB or remote URL) */
  source: AudioReference;
  /** Duration in seconds */
  duration: number;
  /** Volume level 0–1 (reserved for Phase 6 mixing) */
  volume?: number;
  /** Stereo pan -1 (left) to 1 (right) */
  pan?: number;
  /** Whether this track is muted */
  muted?: boolean;
  /** Fade-in duration in seconds */
  fadeIn?: number;
  /** Fade-out duration in seconds */
  fadeOut?: number;
}

export interface AudioPlaybackState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
}
