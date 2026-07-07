import type { TimelineLine } from "./timelineTypes";
import type { AudioManager } from "@/features/audio/audioManager";
import type { AudioTrack } from "@/features/audio/audioTypes";

export interface PlayLineResult {
  /** Promise that resolves when the line duration elapses, OR when cancelled. */
  promise: Promise<void>;
  /**
   * Cancels the timer and immediately resolves the promise.
   * This allows the engine loop to reach the pause/stop check.
   * Audio elements are NOT stopped by cancel — the caller handles that.
   */
  cancel: () => void;
}

export function playLine(
  line: TimelineLine,
  manager: AudioManager,
  durationMs?: number
): PlayLineResult {
  const timeoutMs = durationMs ?? Math.max(line.duration * 1000, 500);

  let timeoutId: ReturnType<typeof setTimeout>;
  let resolvePromise: () => void;
  let cancelled = false;

  const promise = new Promise<void>((resolve) => {
    resolvePromise = resolve;

    // Play all tracks in parallel
    for (const track of line.tracks) {
      const audioTrack: AudioTrack = {
        id: track.trackId,
        slotId: track.slotId,
        source: track.source,
        duration: track.duration,
        volume: track.volume ?? 1,
      };
      manager.play(audioTrack);
    }

    timeoutId = setTimeout(() => {
      if (!cancelled) resolve();
    }, timeoutMs);
  });

  const cancel = () => {
    cancelled = true;
    clearTimeout(timeoutId);
    resolvePromise(); // Force-resolve so engine await doesn't hang
  };

  return { promise, cancel };
}
