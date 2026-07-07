/**
 * Tencent CloudBase collection document types.
 *
 * These are TypeScript interfaces ONLY — no runtime logic.
 * Used as documentation and future type reference for CN-4+.
 *
 * Field names use camelCase to match the TypeScript app model.
 */

export interface TencentProjectDoc {
  id: string;
  shareId: string;
  title: string;
  songName: string;
  slotsPerLine: number;
  status: "draft" | "open" | "locked" | "completed";
  createdAt: string;
  updatedAt: string;
}

export interface TencentLyricLineDoc {
  id: string;
  projectId: string;
  lineIndex: number;
  text: string;
}

export interface TencentVoiceSlotDoc {
  id: string;
  projectId: string;
  lineId: string;
  lineIndex: number;
  slotIndex: number;
  lyricText: string;
  status: "empty" | "claimed" | "filled";
  claimedBy?: string;
  claimedAt?: string;
  updatedAt: string;
}

export interface TencentVoiceSubmissionDoc {
  id: string;
  projectId: string;
  slotId: string;
  guestId?: string;
  nickname: string;
  province?: string;
  /** Storage path, not public URL */
  audioPath: string;
  duration: number;
  createdAt: string;
}

export interface TencentWorkDoc {
  id: string;
  projectId: string;
  title: string;
  songName: string;
  latestVersionId?: string;
  audioPath?: string;
  audioDuration?: number;
  participants: string[];
  lyricLineCount: number;
  filledSlotCount: number;
  totalSlotCount: number;
  versions: string[];
  createdAt: string;
}

export interface TencentWorkVersionDoc {
  id: string;
  workId: string;
  projectId: string;
  audioPath: string;
  duration: number;
  filledSlotCount: number;
  totalSlotCount: number;
  createdAt: string;
}
