// Recording types — MVP placeholder

export interface RecordingState {
  isRecording: boolean;
  elapsedMs: number;
  audioBlob?: Blob;
}

export interface RecordedTrack {
  id: string;
  slotId: string;
  blob: Blob;
  duration: number;
  createdAt: string;
}
