/**
 * Generates a unique ID using crypto.randomUUID().
 * Optionally accepts a prefix for human-readable categorization
 * (e.g., "proj-" for projects, "line-" for lyric lines, "slot-" for voice slots).
 */
export function generateId(prefix = ""): string {
  return `${prefix}${crypto.randomUUID()}`;
}
