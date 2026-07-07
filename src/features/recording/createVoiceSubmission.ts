import type { VoiceSubmission } from "@/types/project";
import { generateId } from "@/utils/id";
import { saveAudio } from "@/services/storage/audioStorage";

/**
 * Factory function: creates a VoiceSubmission from raw recording data.
 *
 * Saves the audio Blob to IndexedDB for persistent storage.
 * Returns a VoiceSubmission with audioId (NOT a blob URL).
 *
 * Pure function with one async side effect: IndexedDB write.
 */
export async function createVoiceSubmission(input: {
  slotId: string;
  lineIndex: number;
  guestId?: string;
  nickname: string;
  province: string;
  audioBlob: Blob;
  duration: number;
}): Promise<VoiceSubmission> {
  const audioId = await saveAudio(input.audioBlob);

  return {
    id: generateId("sub-"),
    slotId: input.slotId,
    lineIndex: input.lineIndex,
    guestId: input.guestId || undefined,
    nickname: input.nickname,
    province: input.province || undefined,
    audioId,
    duration: input.duration,
    createdAt: new Date().toISOString(),
  };
}
