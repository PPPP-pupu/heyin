"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { ChorusProject } from "@/types/project";
import { buildComposition } from "./buildComposition";
import { AudioMixer } from "@/features/audio/mixer/audioMixer";
import type { LoadAudioBlob } from "@/features/audio/mixer/audioMixer";
import { exportWav } from "@/features/audio/mixer/exportWav";
import { saveAudio } from "@/services/storage/audioStorage";
import { saveWork } from "@/services/storage/workStorage";
import { saveWorkVersion } from "@/services/storage/workVersionStorage";
import { audioRepository, workRepository } from "@/services/repositories";
import { isCloudRepositoryMode } from "@/services/repositories/repositoryMode";
import { isTencentProvider } from "@/services/repositories/cloudProvider";
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

  const isTencent = isCloudRepositoryMode() && isTencentProvider();

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

      // Tencent mode: inject cloud blob loader so mixer can resolve cloud:// fileIDs
      let loadAudioBlob: LoadAudioBlob | undefined;
      if (isTencent) {
        loadAudioBlob = (id: string) => audioRepository.loadAudio(id);
      }

      const mixer = new AudioMixer(
        loadAudioBlob ? { loadAudioBlob } : undefined
      );

      const result = await mixer.mix(composition.timeline, {
        onProgress: (progress) => {
          if (progress.stage === "loading" || progress.stage === "decoding") {
            setStatus({ state: "loading", progress });
          } else if (progress.stage === "mixing" || progress.stage === "encoding") {
            setStatus({ state: "mixing", progress });
          }
        },
      });

      // Encode WAV
      const wavBlob = exportWav(result);

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

      if (isTencent) {
        // ============================================
        // Tencent CloudBase export path
        // ============================================
        const versionId = crypto.randomUUID();

        // Check for existing work BEFORE building the upload path
        let existingWork: ChorusWork | null = null;
        try {
          const allWorks = await workRepository.loadAllWorks();
          existingWork = allWorks.find((w) => w.projectId === project.id) ?? null;
        } catch {
          // Best-effort — create new work on failure
        }

        const chorusWorkId = existingWork?.id ?? crypto.randomUUID();
        const wavPath = `works/${chorusWorkId}/versions/${versionId}.wav`;

        // Upload mixed WAV to CloudBase Storage
        const audioId = await audioRepository.saveAudio(wavBlob, wavPath);

        let chorusWork: ChorusWork;

        if (existingWork) {
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
        } else {
          chorusWork = {
            id: chorusWorkId,
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
        }

        const version: ChorusWorkVersion = {
          id: versionId,
          workId: chorusWork.id,
          audioId,
          duration: result.duration,
          filledSlotCount: filledSlots,
          totalSlotCount: project.voiceSlots.length,
          createdAt: new Date().toISOString(),
        };

        await workRepository.saveWorkVersion(version);
        await workRepository.saveWork(chorusWork);
        setWork(chorusWork);
      } else {
        // ============================================
        // Local / Supabase export path (unchanged)
        // ============================================
        const audioId = await saveAudio(wavBlob);

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

        // Try to load existing work
        let existingWork: ChorusWork | null = null;
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
        } else {
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
        }

        saveWorkVersion({ ...version, workId: chorusWork.id });
        saveWork(chorusWork);
        setWork(chorusWork);
      }

      setStatus({ state: "ready" });
    } catch (err) {
      setStatus({
        state: "error",
        error: err instanceof Error ? err.message : "Export failed.",
      });
    }
  }, [project, cleanupUrl, isTencent]);

  const reset = useCallback(() => {
    cleanupUrl();
    setAudioUrl(null);
    setWork(null);
    setStatus({ state: "idle" });
  }, [cleanupUrl]);

  return { status, audioUrl, work, startExport, reset };
}
