/**
 * TimelineCursor — global playback position tracker.
 *
 * Used by PlaybackEngine internally.
 * Reserved for future UI features (progress bar, seek, video sync).
 *
 * Phase 5 Export will use currentTime for audio/video frame alignment.
 */

export interface TimelineCursor {
  /** Global playback time in seconds from the start of the chorus. */
  currentTime: number;
  /** Index of the currently playing line. */
  currentLineIndex: number;
}
