/**
 * AudioStorageAdapter — abstraction over audio persistence.
 *
 * Currently backed by IndexedDB.
 * Future implementations: CloudStorageAdapter, S3Adapter, SupabaseAdapter.
 */

export interface AudioStorageAdapter {
  /** Save a Blob and return a unique identifier. */
  save(blob: Blob): Promise<string>;
  /** Load a Blob by identifier. Returns null if not found. */
  load(id: string): Promise<Blob | null>;
  /** Delete a Blob by identifier. */
  delete(id: string): Promise<void>;
}
