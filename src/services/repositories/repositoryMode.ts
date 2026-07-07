/**
 * Repository mode detection.
 *
 * Reads NEXT_PUBLIC_HEYIN_STORAGE_MODE from environment.
 *
 * Allowed values:
 *   "local" (default) → localStorage + IndexedDB (Phase 1–5)
 *   "cloud"            → Supabase (Phase 6+)
 *
 * The mode is baked at build time (NEXT_PUBLIC_ prefix).
 * For runtime switching, use the Supabase client's isCloudMode() instead.
 */

export type RepositoryMode = "local" | "cloud";

let cached: RepositoryMode | null = null;

export function getRepositoryMode(): RepositoryMode {
  if (cached !== null) return cached;
  const mode = process.env.NEXT_PUBLIC_HEYIN_STORAGE_MODE;
  if (mode === "cloud") {
    cached = "cloud";
  } else {
    cached = "local";
  }
  return cached;
}

export function isCloudRepositoryMode(): boolean {
  return getRepositoryMode() === "cloud";
}

export function isLocalRepositoryMode(): boolean {
  return getRepositoryMode() === "local";
}
