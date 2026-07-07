/**
 * AudioReference — unified audio source identifier.
 *
 * Replaces the split between audioUrl (string) and AudioSource (type + url)
 * with a single canonical reference type.
 *
 * "local"  → stored in IndexedDB, accessed via audioId
 * "remote" → http/https URL (demo audio, future cloud storage)
 */

export interface AudioReference {
  /** Unique identifier — audioId for local, URL for remote */
  id: string;
  /** Storage type */
  type: "local" | "remote";
}

export function createLocalRef(audioId: string): AudioReference {
  return { id: audioId, type: "local" };
}

export function createRemoteRef(url: string): AudioReference {
  return { id: url, type: "remote" };
}
