"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  createRecordingEngine,
  type RecordingEngine,
} from "./recordingEngine";

/**
 * useRecorder — recording state machine hook.
 *
 * States: idle → recording → recorded → (reset) → idle
 *
 * Layer: Interaction Layer (🟨)
 * Uses: recordingEngine (pure capability)
 * Used by: RecordingModal (UI)
 *
 * Prohibited:
 * - ❌ Does NOT touch project data
 * - ❌ Does NOT touch localStorage
 */

export type RecorderState = "idle" | "recording" | "recorded";

export interface UseRecorderReturn {
  state: RecorderState;
  elapsedMs: number;
  audioBlob: Blob | null;
  audioBlobUrl: string | null;
  error: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  resetRecording: () => void;
}

export function useRecorder(): UseRecorderReturn {
  const [state, setState] = useState<RecorderState>("idle");
  const [elapsedMs, setElapsedMs] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioBlobUrl, setAudioBlobUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const engineRef = useRef<RecordingEngine | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Initialize engine once
  useEffect(() => {
    engineRef.current = createRecordingEngine();
    return () => {
      // Cleanup on unmount
      if (timerRef.current) clearInterval(timerRef.current);
      engineRef.current?.cleanup();
    };
  }, []);

  const startTimer = useCallback(() => {
    setElapsedMs(0);
    const startTime = Date.now();
    timerRef.current = setInterval(() => {
      setElapsedMs(Date.now() - startTime);
    }, 100);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startRecording = useCallback(async () => {
    const engine = engineRef.current;
    if (!engine) return;

    setError(null);

    try {
      await engine.start();
      setState("recording");
      startTimer();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to start recording."
      );
    }
  }, [startTimer]);

  const stopRecording = useCallback(async () => {
    const engine = engineRef.current;
    if (!engine) return;

    try {
      const blob = await engine.stop();
      stopTimer();
      setAudioBlob(blob);

      // Revoke old URL if exists
      if (audioBlobUrl) {
        URL.revokeObjectURL(audioBlobUrl);
      }

      const url = URL.createObjectURL(blob);
      setAudioBlobUrl(url);
      setState("recorded");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to stop recording."
      );
      setState("idle");
    }
  }, [stopTimer, audioBlobUrl]);

  const resetRecording = useCallback(() => {
    stopTimer();
    if (audioBlobUrl) {
      URL.revokeObjectURL(audioBlobUrl);
    }
    setAudioBlob(null);
    setAudioBlobUrl(null);
    setElapsedMs(0);
    setError(null);
    setState("idle");

    // Re-create engine for fresh state
    engineRef.current?.cleanup();
    engineRef.current = createRecordingEngine();
  }, [stopTimer, audioBlobUrl]);

  return {
    state,
    elapsedMs,
    audioBlob,
    audioBlobUrl,
    error,
    startRecording,
    stopRecording,
    resetRecording,
  };
}
