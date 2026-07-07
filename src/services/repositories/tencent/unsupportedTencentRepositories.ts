import type { AudioRepository, WorkRepository } from "../types";

/**
 * Placeholder repositories for Tencent features not yet implemented.
 *
 * These return objects whose methods throw only when CALLED,
 * not at module import time. This allows cloud + tencent mode
 * to boot (projectRepository works) while audio/work are pending.
 */

function throwUnsupported(name: string): never {
  throw new Error(
    `Tencent ${name} repository is not implemented yet. Complete the relevant CN migration commit first.`
  );
}

export const unsupportedTencentAudioRepository: AudioRepository = {
  saveAudio: () => throwUnsupported("Audio"),
  loadAudio: () => throwUnsupported("Audio"),
  deleteAudio: () => throwUnsupported("Audio"),
  deleteAllAudio: () => throwUnsupported("Audio"),
};

export const unsupportedTencentWorkRepository: WorkRepository = {
  saveWork: () => throwUnsupported("Work"),
  loadWork: () => throwUnsupported("Work"),
  loadAllWorks: () => throwUnsupported("Work"),
  deleteWork: () => throwUnsupported("Work"),
  saveWorkVersion: () => throwUnsupported("Work"),
  loadWorkVersion: () => throwUnsupported("Work"),
  loadWorkVersions: () => throwUnsupported("Work"),
};
