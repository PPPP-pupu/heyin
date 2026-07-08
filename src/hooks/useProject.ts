"use client";

import { useState, useCallback, useEffect } from "react";
import type { ChorusProject, VoiceSlot } from "@/types/project";
import { demoProject } from "@/data/demoProject";
import { seedDemoAudio } from "@/data/seedDemoAudio";
import { selectSlot } from "@/features/voice-slot/voiceSlotController";
import { projectRepository } from "@/services/repositories";
import { isLocalRepositoryMode } from "@/services/repositories/repositoryMode";

/**
 * useProject — project state container.
 *
 * Layer: State Layer (🟥)
 *
 * In local mode: loads from localStorage, seeds demo audio.
 * In cloud mode: loads via projectRepository (Supabase).
 *
 * Hydration safety:
 * - SSR always renders the hardcoded demo or null.
 * - After mount, useEffect loads from storage/repository.
 */

export function useProject(projectId: string) {
  const isLocal = isLocalRepositoryMode();

  const [project, setProject] = useState<ChorusProject | null>(() => {
    if (projectId === "demo" && isLocal) return demoProject;
    return null;
  });

  const [selectedSlot, setSelectedSlot] = useState<VoiceSlot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshProject = useCallback(async (options?: { silent?: boolean }): Promise<ChorusProject | null> => {
    if (projectId === "demo" && isLocal) {
      setProject(demoProject);
      return demoProject;
    }
    if (!options?.silent) {
      setIsLoading(true);
    }
    setError(null);
    try {
      const p = await projectRepository.loadProject(projectId);
      if (p) {
        const cleaned = await projectRepository.cleanupStaleClaims(p);
        setProject(cleaned);
        return cleaned;
      } else {
        setProject(null);
        return null;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载项目失败。");
      return null;
    } finally {
      if (!options?.silent) {
        setIsLoading(false);
      }
    }
  }, [projectId, isLocal]);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    if (projectId === "demo" && isLocal) {
      setProject(demoProject);
      setIsLoading(false);
      seedDemoAudio();
      return;
    }

    setIsLoading(true);
    setError(null);

    projectRepository
      .loadProject(projectId)
      .then(async (p) => {
        if (p) {
          const cleaned = await projectRepository.cleanupStaleClaims(p);
          setProject(cleaned);
        } else {
          setProject(null);
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "加载项目失败。");
      })
      .finally(() => {
        setIsLoading(false);
      });
    /* eslint-enable react-hooks/set-state-in-effect */

    if (projectId === "demo" && isLocal) {
      seedDemoAudio();
    }
  }, [projectId, isLocal]);

  const handleSelectSlot = useCallback(
    (slot: VoiceSlot) => {
      const result = selectSlot(slot, selectedSlot?.id ?? null);
      setSelectedSlot(result);
    },
    [selectedSlot?.id]
  );

  const clearSelection = useCallback(() => {
    setSelectedSlot(null);
  }, []);

  return {
    project,
    selectedSlot,
    setProject,
    setSelectedSlot,
    selectSlot: handleSelectSlot,
    clearSelection,
    isLoading,
    error,
    refreshProject,
  };
}
