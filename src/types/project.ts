export interface LyricLine {
  id: string;
  index: number;
  text: string;
}

export interface VoiceSubmission {
  id: string;
  slotId: string;
  /** GuestProfile.id — links submission to a persistent identity for future account system */
  guestId?: string;
  /** Snapshot of nickname at submission time — preserved even if user later changes name */
  nickname: string;
  avatarUrl?: string;
  province?: string;
  /** IndexedDB audio storage id — persistent across browser refreshes */
  audioId: string;
  duration: number;
  lineIndex?: number;
  createdAt: string;
  /** Who can play this individual recording. "creatorOnly" = owner + self only. */
  visibility?: "public" | "creatorOnly";
  /** Per-submission mix gain for chorus export. 0=mute, 1=normal, 1.5=+50%. */
  mixVolume?: number;
}

export interface VoiceSlot {
  id: string;
  lineId: string;
  lineIndex: number;
  slotIndex: number;
  lyricText: string;
  /**
   * VoiceSlot lifecycle:
   *   empty   → slot is available
   *   claimed → a guest has reserved this slot (recording in progress)
   *   filled  → recording submitted
   *
   * Future server can auto-release: if (now - claimedAt > 30min) release.
   */
  status: "empty" | "claimed" | "filled";
  /** Guest UUID who claimed this slot (references GuestProfile.id, NOT display name) */
  claimedBy?: string;
  /** ISO timestamp when the slot was claimed — enables stale-claim detection */
  claimedAt?: string;
  submission?: VoiceSubmission;
}

export interface ChorusProject {
  id: string;
  title: string;
  songName: string;
  backingTrackUrl?: string;
  lyricLines: LyricLine[];
  slotsPerLine: number;
  voiceSlots: VoiceSlot[];
  createdAt: string;
  updatedAt: string;
  status: "draft" | "open" | "locked" | "completed";
  /** Public share identifier — can differ from internal id */
  shareId?: string;
  /** SHA-256 hash of the owner token. Raw token only in URL/localStorage, never persisted. */
  ownerTokenHash?: string;
}
