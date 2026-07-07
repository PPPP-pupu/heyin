import type { AudioReference } from "@/features/audio/audioReference";

export interface TimelineTrack {
  trackId: string;
  slotId: string;
  source: AudioReference;
  duration: number;
  /** Volume level 0–1 for future mixing (Phase 5/6) */
  volume?: number;
}

export interface TimelineLine {
  lineIndex: number;
  /** Lyric text for this line — used by export/video rendering */
  text: string;
  startTime: number;
  duration: number;
  tracks: TimelineTrack[];
}

export interface PlaybackTimeline {
  /** Unique id for this timeline instance */
  id: string;
  /** Optional composition reference */
  compositionId?: string;
  totalDuration: number;
  lines: TimelineLine[];
}
