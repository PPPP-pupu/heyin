import type { VoiceSlot } from "@/types/project";

/**
 * VoiceSlot lifecycle controller.
 * Pure functions — no state, no React, no side effects.
 *
 * Rules:
 * - A "filled" slot is NOT selectable (already claimed).
 * - An "empty" slot IS selectable.
 * - Only one slot can be selected at a time.
 * - Clicking the already-selected slot deselects it.
 */

export function isSlotSelectable(slot: VoiceSlot): boolean {
  return slot.status === "empty";
}

/**
 * Determine the new selected slot after clicking a slot.
 * Returns the slot to select, or null to deselect.
 */
export function selectSlot(
  slot: VoiceSlot,
  currentSelectedId: string | null
): VoiceSlot | null {
  if (!isSlotSelectable(slot)) return null;

  // Clicking the already-selected slot deselects it
  if (slot.id === currentSelectedId) return null;

  return slot;
}

/**
 * Deselect any currently selected slot.
 */
export function deselectSlot(): null {
  return null;
}
