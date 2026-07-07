"use client";

import { useCallback } from "react";
import type { ChorusProject } from "@/types/project";
import { createVoiceSubmission } from "./createVoiceSubmission";
import { submitRecording } from "@/features/project/projectActions";

/**
 * useSubmitRecording — shared hook for the submit flow.
 *
 * Replaces duplicate code in Project page and Join page.
 * Both pages had the same: createVoiceSubmission → submitRecording → setProject.
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
      });

      const updated = submitRecording(project, input.slotId, submission);
      setProject(updated);
    },
    [project, setProject]
  );

  return { submit };
}
