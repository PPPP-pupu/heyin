/**
 * ChorusWorkVersion — a single generated version of a chorus work.
 *
 * One ChorusWork can have multiple versions (e.g., 5-person, 20-person, final 45-person).
 */
export interface ChorusWorkVersion {
  id: string;
  workId: string;
  /** IndexedDB key for this version's mixed audio */
  audioId: string;
  /** Duration in seconds */
  duration: number;
  filledSlotCount: number;
  totalSlotCount: number;
  createdAt: string;
}
