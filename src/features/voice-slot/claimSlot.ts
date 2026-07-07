import type { ChorusProject } from "@/types/project";
import { saveProject } from "@/services/storage/projectStorage";

/**
 * claimSlot — reserve a voice slot for a guest before recording.
 *
 * Layer: Action Layer (🟧)
 *
 * Rules:
 * - Only "empty" slots can be claimed.
 * - "claimed" or "filled" slots are rejected (return null).
 * - Sets status to "claimed", records claimedBy (guest UUID) and claimedAt (ISO).
 * - claimedBy stores a GuestProfile.id, NOT a display nickname.
 *   This decouples identity from presentation — nickname changes don't
 *   require updating every slot.
 * - Persists to localStorage.
 * - Returns a NEW project object (immutable — does not mutate input).
 *
 * Lifecycle: empty → claimed (with timestamp) → filled
 */
export function claimSlot(
  project: ChorusProject,
  slotId: string,
  guestId: string
): ChorusProject | null {
  const slot = project.voiceSlots.find((s) => s.id === slotId);
  if (!slot) return null;

  // Only empty slots can be claimed
  if (slot.status !== "empty") return null;

  const now = new Date().toISOString();

  const updatedSlots = project.voiceSlots.map((s) =>
    s.id === slotId
      ? {
          ...s,
          status: "claimed" as const,
          claimedBy: guestId,
          claimedAt: now,
        }
      : s
  );

  const updatedProject: ChorusProject = {
    ...project,
    voiceSlots: updatedSlots,
    updatedAt: now,
  };

  saveProject(updatedProject);
  return updatedProject;
}

/**
 * Release a claim on a slot, resetting it back to "empty".
 *
 * Used when a guest cancels recording or closes the modal without submitting.
 * Clears claimedBy and claimedAt.
 */
export function releaseClaim(
  project: ChorusProject,
  slotId: string
): ChorusProject | null {
  const slot = project.voiceSlots.find((s) => s.id === slotId);
  if (!slot) return null;

  // Only "claimed" slots can be released
  if (slot.status !== "claimed") return null;

  const updatedSlots = project.voiceSlots.map((s) =>
    s.id === slotId
      ? {
          ...s,
          status: "empty" as const,
          claimedBy: undefined,
          claimedAt: undefined,
        }
      : s
  );

  const updatedProject: ChorusProject = {
    ...project,
    voiceSlots: updatedSlots,
    updatedAt: new Date().toISOString(),
  };

  saveProject(updatedProject);
  return updatedProject;
}

/**
 * Check if a claim has expired.
 *
 * Returns true if the slot is "claimed" and the claim is older than maxAgeMs.
 *
 * @param maxAgeMs — default 15 minutes
 */
export function isClaimExpired(
  slot: { status: string; claimedAt?: string },
  maxAgeMs = 15 * 60 * 1000
): boolean {
  if (slot.status !== "claimed" || !slot.claimedAt) return false;
  return Date.now() - new Date(slot.claimedAt).getTime() > maxAgeMs;
}

/**
 * Scan a project and auto-release all expired claims.
 *
 * Call this on project load to prevent stale "claimed" locks
 * (e.g. user opened recording, locked phone, came back next day).
 *
 * Returns a NEW project if any claims were released, or the original if none.
 * Persists to localStorage if changes were made.
 */
export function cleanupStaleClaims(
  project: ChorusProject,
  maxAgeMs = 15 * 60 * 1000
): ChorusProject {
  let changed = false;

  const cleanedSlots = project.voiceSlots.map((slot) => {
    if (isClaimExpired(slot, maxAgeMs)) {
      changed = true;
      return {
        ...slot,
        status: "empty" as const,
        claimedBy: undefined,
        claimedAt: undefined,
      };
    }
    return slot;
  });

  if (!changed) return project;

  const cleaned: ChorusProject = {
    ...project,
    voiceSlots: cleanedSlots,
    updatedAt: new Date().toISOString(),
  };

  saveProject(cleaned);
  return cleaned;
}
