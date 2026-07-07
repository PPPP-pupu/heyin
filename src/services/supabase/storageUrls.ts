/**
 * Supabase Storage URL utilities.
 *
 * audio_path stores the internal Storage path (e.g. projects/{pid}/submissions/{sid}.webm).
 * At playback time, resolve to the public URL for the browser.
 */

/**
 * Resolve a Supabase Storage path to a public URL.
 *
 * Path format: projects/{projectId}/submissions/{submissionId}.ext
 * Returns: https://{project}.supabase.co/storage/v1/object/public/heyin-audio/{path}
 */
export function getPublicAudioUrl(path: string): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    // Fallback — should never happen in cloud mode
    return path;
  }
  return `${url}/storage/v1/object/public/heyin-audio/${path}`;
}

/**
 * Check whether a string is already an external URL (http/https).
 */
export function isExternalUrl(str: string): boolean {
  return str.startsWith("http://") || str.startsWith("https://");
}

/**
 * Check whether a string looks like a Supabase Storage path
 * (starts with "projects/" or "works/").
 */
export function isStoragePath(str: string): boolean {
  return str.startsWith("projects/") || str.startsWith("works/");
}

/**
 * Map audio MIME type to file extension.
 *
 * Supported: audio/webm → webm, audio/ogg → ogg, audio/mp4 → m4a,
 *            audio/mpeg → mp3. Fallback: webm.
 */
export function getAudioExtension(mimeType: string): string {
  if (mimeType.includes("webm")) return "webm";
  if (mimeType.includes("ogg")) return "ogg";
  if (mimeType.includes("mp4")) return "m4a";
  if (mimeType.includes("mpeg") || mimeType.includes("mp3")) return "mp3";
  return "webm";
}
