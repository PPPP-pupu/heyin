import type { PlaybackTimeline } from "@/features/playback/timelineTypes";

export interface ChorusComposition {
  projectId: string;
  timeline: PlaybackTimeline;

  metadata: {
    title: string;
    songName: string;
    createdAt: string;
  };

  rendering: {
    sampleRate: number;
    format: "wav" | "mp3";
  };
}
