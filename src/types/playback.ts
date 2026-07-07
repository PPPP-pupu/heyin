export interface PlaybackState {
  isPlaying: boolean;
  currentLineIndex: number | null;
  currentSlotIds: string[];
}
