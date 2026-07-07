import type { PlaybackTimeline } from "./timelineTypes";
import { playLine, type PlayLineResult } from "./audioScheduler";
import type { TimelineCursor } from "./timelineCursor";
import { createAudioManager, type AudioManager } from "@/features/audio/audioManager";

export type EngineState = "idle" | "playing" | "paused" | "finished";

export interface PlaybackCallbacks {
  onLineChange: (lineIndex: number) => void;
  onStateChange: (state: EngineState) => void;
}

/**
 * PlaybackEngine — orchestrates line-by-line chorus playback.
 *
 * Pause/resume strategy:
 * - Pause: cancels timer (resolves promise so engine doesn't hang),
 *   stops audio, stores remaining time.
 * - Resume: releases engine loop → replays current line from remaining time
 *   with fresh audio. Does NOT resume old audio elements.
 *
 * Lifecycle: owned by usePlayback, persists across play/stop cycles.
 */
export class PlaybackEngine {
  private state: EngineState = "idle";
  private timeline: PlaybackTimeline | null = null;
  private currentLineIdx = 0;
  private callbacks: PlaybackCallbacks;
  private pauseResolve: (() => void) | null = null;
  private audioManager: AudioManager;
  private cursor: TimelineCursor;
  private currentLineResult: PlayLineResult | null = null;
  private currentLineRemainingMs: number = 0;
  private lineStartedAt: number = 0;

  constructor(callbacks: PlaybackCallbacks) {
    this.callbacks = callbacks;
    this.audioManager = createAudioManager();
    this.cursor = { currentTime: 0, currentLineIndex: 0 };
  }

  async play(timeline: PlaybackTimeline): Promise<void> {
    if (this.state === "playing") return;

    this.timeline = timeline;

    if (timeline.lines.length === 0) {
      this.setState("finished");
      return;
    }

    if (this.state !== "paused") {
      this.currentLineIdx = 0;
      this.cursor.currentTime = 0;
    }

    this.setState("playing");

    for (let i = this.currentLineIdx; i < timeline.lines.length; i++) {
      this.currentLineIdx = i;
      const line = timeline.lines[i];

      this.cursor.currentLineIndex = line.lineIndex;
      this.cursor.currentTime = line.startTime;
      this.callbacks.onLineChange(line.lineIndex);

      // Clean up previous line's audio
      this.audioManager.stopAll();

      // Determine duration: remainingMs (after pause) or full line duration
      const useRemaining = this.currentLineRemainingMs > 0;
      const durationMs = useRemaining
        ? this.currentLineRemainingMs
        : line.duration * 1000;
      this.currentLineRemainingMs = 0;
      this.lineStartedAt = Date.now();

      this.currentLineResult = playLine(line, this.audioManager, durationMs);
      await this.currentLineResult.promise;

      // Pause check — engine loop pauses here
      if (this.state === "paused") {
        await this.waitForResume();
        // After resume: replay the SAME line with remaining time
        i--;
        continue;
      }

      // Stop check
      if (this.state === "idle") {
        return;
      }
    }

    this.audioManager.stopAll();
    this.setState("finished");
  }

  /**
   * Pause — cancels timer, stops audio, stores remaining time.
   * The engine loop will await waitForResume() after the cancelled promise resolves.
   */
  pause(): void {
    if (this.state !== "playing") return;

    // Cancel timer and force-resolve promise so engine loop can reach waitForResume
    if (this.currentLineResult) {
      this.currentLineResult.cancel();
      this.currentLineResult = null;
    }

    // Calculate remaining time
    const line = this.timeline?.lines[this.currentLineIdx];
    if (line && this.lineStartedAt > 0) {
      const elapsed = (Date.now() - this.lineStartedAt) / 1000;
      const remaining = Math.max(0, line.duration - elapsed);
      this.currentLineRemainingMs = Math.max(remaining * 1000, 500);
    }

    // Stop audio entirely — resume will replay fresh
    this.audioManager.stopAll();
    this.setState("paused");
  }

  /**
   * Resume — releases the engine loop pause.
   * The loop will replay the current line with remainingMs.
   * Does NOT resume old audio — fresh audio elements are created.
   */
  resume(): void {
    if (this.state !== "paused") return;
    if (this.pauseResolve) {
      this.pauseResolve();
      this.pauseResolve = null;
    }
  }

  /**
   * Stop — cleans up everything. Engine persists for replay.
   */
  stop(): void {
    if (this.currentLineResult) {
      this.currentLineResult.cancel();
      this.currentLineResult = null;
    }
    this.audioManager.stopAll();
    this.cursor = { currentTime: 0, currentLineIndex: 0 };
    this.currentLineIdx = 0;
    this.currentLineRemainingMs = 0;
    this.lineStartedAt = 0;
    this.setState("idle");
    if (this.pauseResolve) {
      this.pauseResolve();
      this.pauseResolve = null;
    }
  }

  getState(): EngineState {
    return this.state;
  }

  getCursor(): TimelineCursor {
    return { ...this.cursor };
  }

  private setState(state: EngineState): void {
    this.state = state;
    this.callbacks.onStateChange(state);
  }

  private waitForResume(): Promise<void> {
    return new Promise((resolve) => {
      this.pauseResolve = resolve;
    });
  }
}
