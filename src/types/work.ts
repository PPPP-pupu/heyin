/**
 * ChorusWork — a completed, shareable chorus composition.
 *
 * This is the core social object for future community features
 * (sharing, likes, comments, remixing).
 */
export interface ChorusWork {
  id: string;
  projectId: string;
  title: string;
  songName: string;
  /** IndexedDB key for the latest generated mixed audio */
  audioId: string;
  /** Total duration in seconds */
  audioDuration: number;
  /** Nicknames of all contributors */
  participants: string[];
  lyricLineCount: number;
  filledSlotCount: number;
  totalSlotCount: number;
  /** Version history — each generation creates a new version */
  versions: string[];
  /** ID of the latest version */
  latestVersionId?: string;
  /** Share metadata — reserved for future sharing features */
  shareMetadata?: {
    coverImage?: string;
    description?: string;
  };
  createdAt: string;
}
