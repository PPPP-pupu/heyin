import type { VoiceSubmission } from "@/types/project";
import { generateId } from "@/utils/id";
import { saveAudio } from "@/services/storage/audioStorage";
import { audioRepository } from "@/services/repositories";
import { isCloudRepositoryMode } from "@/services/repositories/repositoryMode";
import { getAudioExtension } from "@/services/supabase/storageUrls";

/**
 * Factory function: creates a VoiceSubmission from raw recording data.
 *
 * Local mode: saves blob to IndexedDB, audioId = IndexedDB key.
 * Cloud mode: uploads blob to Supabase Storage, audioId = Storage path.
 *
 * In cloud mode, submission.id is a UUID (crypto.randomUUID()) because
 * Supabase voice_submissions.id is a UUID column that rejects sub-xxx.
 *
 * Cloud Storage path: projects/{projectId}/submissions/{submissionId}.{ext}
 */
export async function createVoiceSubmission(input: {
  slotId: string;
  lineIndex: number;
  guestId?: string;
  nickname: string;
  province: string;
  audioBlob: Blob;
  duration: number;
  /** Required for cloud Storage path construction. */
  projectId: string;
  visibility?: "public" | "creatorOnly";
}): Promise<VoiceSubmission> {
  const isCloud = isCloudRepositoryMode();

  // Cloud: UUID for Supabase voice_submissions.id column
  // Local: prefixed id (backward compatible)
  const submissionId = isCloud
    ? crypto.randomUUID()
    : generateId("sub-");

  let audioId: string;

  if (isCloud) {
    const ext = getAudioExtension(input.audioBlob.type);
    const path = `projects/${input.projectId}/submissions/${submissionId}.${ext}`;
    audioId = await audioRepository.saveAudio(input.audioBlob, path);
  } else {
    audioId = await saveAudio(input.audioBlob);
  }

  return {
    id: submissionId,
    slotId: input.slotId,
    lineIndex: input.lineIndex,
    guestId: input.guestId || undefined,
    nickname: input.nickname,
    province: input.province || undefined,
    audioId,
    duration: input.duration,
    visibility: input.visibility ?? "creatorOnly",
    createdAt: new Date().toISOString(),
  };
}
