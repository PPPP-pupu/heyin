"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { ChorusProject } from "@/types/project";
import { buildComposition } from "./buildComposition";
import { AudioMixer } from "@/features/audio/mixer/audioMixer";
import { exportWav } from "@/features/audio/mixer/exportWav";
import { saveAudio } from "@/services/storage/audioStorage";
import { saveWork } from "@/services/storage/workStorage";
import { saveWorkVersion } from "@/services/storage/workVersionStorage";
import type { ChorusWork } from "@/types/work";
import type { ChorusWorkVersion } from "@/types/workVersion";
import { generateId } from "@/utils/id";
import type { ExportStatus } from "./exportState";

export interface UseExportReturn {
  status: ExportStatus;
  audioUrl: string | null;
  work: ChorusWork | null;
  startExport: () => Promise<void>;
  reset: () => void;
}

export function useExport(project: ChorusProject | null): UseExportReturn {
  const [status, setStatus] = useState<ExportStatus>({ state: "idle" });
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [work, setWork] = useState<ChorusWork | null>(null);
  const prevUrlRef = useRef<string | null>(null);

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (prevUrlRef.current) {
        URL.revokeObjectURL(prevUrlRef.current);
        prevUrlRef.current = null;
      }
    };
  }, []);

  const cleanupUrl = useCallback(() => {
    if (prevUrlRef.current) {
      URL.revokeObjectURL(prevUrlRef.current);
      prevUrlRef.current = null;
    }
  }, []);

  const startExport = useCallback(async () => {
    if (!project) return;

    cleanupUrl();
    setAudioUrl(null);

    try {
      setStatus({ state: "loading" });

      const composition = buildComposition(project);
      const mixer = new AudioMixer();

      const result = await mixer.mix(composition.timeline, {
        onProgress: (progress) => {
          if (progress.stage === "loading" || progress.stage === "decoding") {
            setStatus({ state: "loading", progress });
          } else if (progress.stage === "mixing" || progress.stage === "encoding") {
            setStatus({ state: "mixing", progress });
          }
        },
      });

      // Save generated audio to IndexedDB
      const wavBlob = exportWav(result);
      const audioId = await saveAudio(wavBlob);

      // Create preview URL
      const url = URL.createObjectURL(wavBlob);
      prevUrlRef.current = url;
      setAudioUrl(url);

      // Collect participants
      const participants = new Set<string>();
      for (const slot of project.voiceSlots) {
        if (slot.submission?.nickname) {
          participants.add(slot.submission.nickname);
        }
      }

      const filledSlots = project.voiceSlots.filter((s) => s.status === "filled").length;

      // Create version
      const versionId = generateId("ver-");
      const version: ChorusWorkVersion = {
        id: versionId,
        workId: "",
        audioId,
        duration: result.duration,
        filledSlotCount: filledSlots,
        totalSlotCount: project.voiceSlots.length,
        createdAt: new Date().toISOString(),
      };

      // Try to load existing work, or create new one
      let existingWork: ChorusWork | null = null;
      // Check for existing work by iterating localStorage (simple approach)
      try {
        const allWorks = [];
        for (let i = 0; i < window.localStorage.length; i++) {
          const key = window.localStorage.key(i);
          if (key?.startsWith("heyin:work:")) {
            const raw = window.localStorage.getItem(key);
            if (raw) {
              try { allWorks.push(JSON.parse(raw)); } catch {}
            }
          }
        }
        existingWork = allWorks.find((w: ChorusWork) => w.projectId === project.id) ?? null;
      } catch {}

      let chorusWork: ChorusWork;

      if (existingWork) {
        // Update existing work with new version
        chorusWork = {
          ...existingWork,
          audioId,
          audioDuration: result.duration,
          participants: [...participants],
          filledSlotCount: filledSlots,
          totalSlotCount: project.voiceSlots.length,
          versions: [...existingWork.versions, versionId],
          latestVersionId: versionId,
        };
        version.workId = existingWork.id;
      } else {
        // Create new work
        const workId = generateId("work-");
        chorusWork = {
          id: workId,
          projectId: project.id,
          title: project.title,
          songName: project.songName,
          audioId,
          audioDuration: result.duration,
          participants: [...participants],
          lyricLineCount: project.lyricLines.length,
          filledSlotCount: filledSlots,
          totalSlotCount: project.voiceSlots.length,
          versions: [versionId],
          latestVersionId: versionId,
          createdAt: new Date().toISOString(),
        };
        version.workId = workId;
        saveWorkVersion({ ...version, workId });
      }

      // Persist version entity
      saveWorkVersion({ ...version, workId: chorusWork.id });
      saveWork(chorusWork);
      setWork(chorusWork);

      setStatus({ state: "ready" });
    } catch (err) {
      setStatus({
        state: "error",
        error: err instanceof Error ? err.message : "Export failed.",
      });
    }
  }, [project, cleanupUrl]);

  const reset = useCallback(() => {
    cleanupUrl();
    setAudioUrl(null);
    setWork(null);
    setStatus({ state: "idle" });
  }, [cleanupUrl]);

  return { status, audioUrl, work, startExport, reset };
}
