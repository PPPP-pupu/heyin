import type { VoiceSubmission } from "@/types/project";
import type { AudioTrack } from "./audioTypes";
import { createLocalRef } from "./audioReference";

/**
 * Adapter: converts a VoiceSubmission into an AudioTrack.
 *
 * All audio is stored in IndexedDB via audioId.
 */
export function createAudioTrack(submission: VoiceSubmission): AudioTrack {
  return {
    id: submission.id,
    slotId: submission.slotId,
    source: createLocalRef(submission.audioId),
    duration: submission.duration,
  };
}
