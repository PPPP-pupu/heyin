import type { ChorusProject } from "@/types/project";
import { buildTimeline } from "@/features/playback/buildTimeline";
import type { ChorusComposition } from "./exportTypes";

/**
 * Builds a ChorusComposition from a ChorusProject.
 *
 * Data pipeline:
 *   ChorusProject → buildTimeline() → PlaybackTimeline → ChorusComposition
 */
export function buildComposition(project: ChorusProject): ChorusComposition {
  const timeline = buildTimeline(project);

  return {
    projectId: project.id,
    timeline,
    metadata: {
      title: project.title,
      songName: project.songName,
      createdAt: new Date().toISOString(),
    },
    rendering: {
      sampleRate: 44100,
      format: "wav",
    },
  };
}
