import type { AudioRepository } from "../types";
import {
  saveAudio,
  loadAudio,
  deleteAudio,
} from "@/services/storage/audioStorage";

/**
 * localAudioRepository — wraps existing IndexedDB audio storage.
 */
export const localAudioRepository: AudioRepository = {
  async saveAudio(blob, _pathHint?: string) {
    void _pathHint;
    return saveAudio(blob);
  },

  async loadAudio(idOrPath) {
    return loadAudio(idOrPath);
  },

  async deleteAudio(idOrPath) {
    return deleteAudio(idOrPath);
  },

  async deleteAllAudio() {
    if (typeof indexedDB === "undefined") return;
    await new Promise<void>((resolve) => {
      const req = indexedDB.deleteDatabase("heyin-audio");
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
    });
  },
};
