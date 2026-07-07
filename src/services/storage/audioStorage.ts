/**
 * audioStorage — backward-compatible re-export.
 *
 * Delegates to IndexedDB adapter.
 * Future: switch adapter based on auth state (local vs cloud).
 */

import { indexedDBAudioStorage } from "./audio/indexedDBAudioStorage";

export const saveAudio = indexedDBAudioStorage.save;
export const loadAudio = indexedDBAudioStorage.load;
export const deleteAudio = indexedDBAudioStorage.delete;
