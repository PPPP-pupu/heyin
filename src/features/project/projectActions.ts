import type { ChorusProject, VoiceSubmission } from "@/types/project";
import { saveProject } from "@/services/storage/projectStorage";
import { deleteAudio } from "@/services/storage/audioStorage";

/**
 * projectActions — pure business logic functions for project mutations.
 *
 * Layer: Action Layer (🟧)
 * Rules:
 * - ❌ No React hooks (no useState, no useCallback)
 * - ❌ No UI access
 * - ❌ No recording logic
 * - ✅ Pure functions: project in → new project out
 * - ✅ Calls storage layer directly
 */

/**
 * Submit a recording to a voice slot.
 *
 * 1. Finds the VoiceSlot by slotId
 * 2. Sets status to "filled" and attaches the submission
 * 3. Updates project.updatedAt
 * 4. Persists to localStorage
 * 5. Returns the new project (immutable — does not mutate input)
 */
export function submitRecording(
  project: ChorusProject,
  slotId: string,
  submission: VoiceSubmission
): ChorusProject {
  const updatedSlots = project.voiceSlots.map((slot) =>
    slot.id === slotId
      ? {
          ...slot,
          status: "filled" as const,
          submission,
          // Clean claim fields — slot is now permanently filled
          claimedBy: undefined,
          claimedAt: undefined,
        }
      : slot
  );

  const updatedProject: ChorusProject = {
    ...project,
    voiceSlots: updatedSlots,
    updatedAt: new Date().toISOString(),
  };

  // Persist to localStorage (works for all projects, including demo)
  saveProject(updatedProject);

  return updatedProject;
}

/**
 * Remove a submission from a voice slot, resetting it to empty.
 *
 * 1. Finds the VoiceSlot by slotId
 * 2. Sets status to "empty" and removes submission
 * 3. If the slot had a blob URL, revoke it to free memory
 * 4. Updates project.updatedAt
 * 5. Persists to localStorage
 * 6. Returns the new project (immutable)
 */
export function deleteSubmission(
  project: ChorusProject,
  slotId: string
): ChorusProject {
  const updatedSlots = project.voiceSlots.map((slot) => {
    if (slot.id !== slotId) return slot;

    // Delete audio from IndexedDB
    if (slot.submission?.audioId) {
      deleteAudio(slot.submission.audioId);
    }

    return {
      ...slot,
      status: "empty" as const,
      submission: undefined,
    };
  });

  const updatedProject: ChorusProject = {
    ...project,
    voiceSlots: updatedSlots,
    updatedAt: new Date().toISOString(),
  };

  saveProject(updatedProject);
  return updatedProject;
}

/**
 * Update the project status.
 *
 * Valid transitions:
 *   draft → open → locked → completed
 *
 * States:
 * - draft:    still editing, not ready for participants
 * - open:     accepting voice submissions
 * - locked:   no new submissions, but visible
 * - completed: finished chorus, visible as work
 */
export function setProjectStatus(
  project: ChorusProject,
  status: ChorusProject["status"]
): ChorusProject {
  const updated: ChorusProject = {
    ...project,
    status,
    updatedAt: new Date().toISOString(),
  };
  saveProject(updated);
  return updated;
}
