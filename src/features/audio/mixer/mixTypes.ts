import type { PlaybackTimeline } from "@/features/playback/timelineTypes";

export type MixInput = PlaybackTimeline;

export interface MixResult {
  audioBuffer: AudioBuffer;
  sampleRate: number;
  duration: number;
}

export interface MixProgress {
  stage: "loading" | "decoding" | "mixing" | "encoding" | "complete";
  /** 0–1 progress within current stage */
  progress: number;
  /** Total track count (available during loading/decoding stages) */
  totalTracks?: number;
  /** Current track index */
  currentTrack?: number;
}
