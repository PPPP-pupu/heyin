"use client";

import { useState, useRef, useCallback } from "react";
import type { ChorusProject } from "@/types/project";
import { buildTimeline } from "./buildTimeline";
import { PlaybackEngine } from "./playbackEngine";
import type { EngineState } from "./playbackEngine";

export type PlaybackState = "idle" | "playing" | "paused" | "finished";

export interface UsePlaybackReturn {
  state: PlaybackState;
  currentLineIndex: number;
  play: () => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
}

/**
 * usePlayback — React hook bridging PlaybackEngine to React state.
 *
 * Engine is created once and persists across play/stop cycles.
 * stop() resets state without destroying the engine.
 *
 * Layer: Interaction Layer
 */
export function usePlayback(project: ChorusProject | null): UsePlaybackReturn {
  const [state, setState] = useState<PlaybackState>("idle");
  const [currentLineIndex, setCurrentLineIndex] = useState<number>(0);

  const engineRef = useRef<PlaybackEngine | null>(null);

  const getEngine = useCallback(() => {
    if (!engineRef.current) {
      engineRef.current = new PlaybackEngine({
        onLineChange: (lineIndex: number) => setCurrentLineIndex(lineIndex),
        onStateChange: (s: EngineState) => setState(s as PlaybackState),
      });
    }
    return engineRef.current;
  }, []);

  const play = useCallback(() => {
    if (!project) return;
    const timeline = buildTimeline(project);
    const engine = getEngine();
    const currentEngineState = engine.getState();

    if (currentEngineState === "paused") {
      engine.resume();
      setState("playing");
    } else {
      engine.play(timeline);
    }
  }, [project, getEngine]);

  const pause = useCallback(() => {
    engineRef.current?.pause();
    setState("paused");
  }, []);

  const resume = useCallback(() => {
    engineRef.current?.resume();
    setState("playing");
  }, []);

  const stop = useCallback(() => {
    engineRef.current?.stop();
    // Engine is NOT destroyed — reset for replay
    setState("idle");
    setCurrentLineIndex(0);
  }, []);

  return { state, currentLineIndex, play, pause, resume, stop };
}
