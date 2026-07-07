import type { ChorusProject } from "@/types/project";
import { createLocalRef, createRemoteRef } from "@/features/audio/audioReference";
import { isExternalUrl, isStoragePath, getPublicAudioUrl } from "@/services/supabase/storageUrls";
import { isCloudRepositoryMode } from "@/services/repositories/repositoryMode";
import { generateId } from "@/utils/id";
import type { PlaybackTimeline, TimelineLine, TimelineTrack } from "./timelineTypes";

/**
 * Converts a ChorusProject into a PlaybackTimeline with absolute timing.
 *
 * Pure function — no side effects.
 */
export function buildTimeline(project: ChorusProject): PlaybackTimeline {
  const filled = project.voiceSlots.filter(
    (s) => s.status === "filled" && s.submission
  );

  // Index lyric lines by index for fast text lookup
  const lyricByIndex = new Map<number, string>();
  for (const line of project.lyricLines) {
    lyricByIndex.set(line.index, line.text);
  }

  const groups = new Map<number, typeof filled>();
  for (const slot of filled) {
    const arr = groups.get(slot.lineIndex) || [];
    arr.push(slot);
    groups.set(slot.lineIndex, arr);
  }

  const sortedIndices = [...groups.keys()].sort((a, b) => a - b);
  let currentTime = 0;
  const lines: TimelineLine[] = [];

  for (const lineIndex of sortedIndices) {
    const slots = groups.get(lineIndex)!;
    const tracks: TimelineTrack[] = slots.map((s) => {
      const id = s.submission!.audioId;
      let source;
      if (isExternalUrl(id)) {
        source = createRemoteRef(id);
      } else if (isCloudRepositoryMode() && isStoragePath(id)) {
        source = createRemoteRef(getPublicAudioUrl(id));
      } else {
        source = createLocalRef(id);
      }
      return {
        trackId: s.submission!.id,
        slotId: s.id,
        source,
        duration: s.submission!.duration,
        volume: 1,
      };
    });

    const duration = Math.max(...tracks.map((t) => t.duration));

    lines.push({
      lineIndex,
      text: lyricByIndex.get(lineIndex) ?? "",
      startTime: currentTime,
      duration,
      tracks,
    });

    currentTime += duration;
  }

  return { id: generateId("tl-"), totalDuration: currentTime, lines };
}
