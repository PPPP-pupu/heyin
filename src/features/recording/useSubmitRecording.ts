"use client";

import { useCallback } from "react";
import type { ChorusProject } from "@/types/project";
import { createVoiceSubmission } from "./createVoiceSubmission";
import { projectRepository } from "@/services/repositories";

/**
 * useSubmitRecording — shared hook for the submit flow.
 *
 * Works for both local and cloud modes:
 * - createVoiceSubmission handles audio persistence (IndexedDB or Supabase Storage)
 * - projectRepository.submitRecording handles project mutation (local or Supabase DB)
 *
 * Layer: Interaction Layer (🟨)
 */
export function useSubmitRecording(
  project: ChorusProject | null,
  setProject: (p: ChorusProject) => void
) {
  const submit = useCallback(
    async (input: {
      slotId: string;
      lineIndex: number;
      guestId?: string;
      nickname: string;
      province: string;
      audioBlob: Blob;
      durationSec: number;
      projectId: string;
      visibility?: "public" | "creatorOnly";
    }) => {
      if (!project) return;

      const submission = await createVoiceSubmission({
        slotId: input.slotId,
        lineIndex: input.lineIndex,
        guestId: input.guestId,
        nickname: input.nickname,
        province: input.province,
        audioBlob: input.audioBlob,
        duration: input.durationSec,
        projectId: input.projectId,
        visibility: input.visibility,
      });

      const updated = await projectRepository.submitRecording(
        project,
        input.slotId,
        submission
      );
      setProject(updated);
    },
    [project, setProject]
  );

  return { submit };
}
