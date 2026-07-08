/**
 * Public base URL utilities.
 *
 * EdgeOne Makers preview/deployment URLs may expire after 3 hours (China acceleration).
 * Share links must use a stable base URL, not window.location.origin when on a temporary host.
 *
 * Set NEXT_PUBLIC_HEYIN_PUBLIC_BASE_URL to a custom domain for stable sharing.
 */

/** Known EdgeOne Makers temporary hostname patterns. */
function isTemporaryEdgeOneHost(hostname: string): boolean {
  if (!hostname) return false;
  return (
    hostname.includes("edgeone.cool") ||
    hostname.includes("edgeone.ai") ||
    hostname.includes("edgeone.app")
  );
}

/** True if the current origin is an EdgeOne Makers temporary URL. */
export function isUsingTemporaryEdgeOneOrigin(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return isTemporaryEdgeOneHost(window.location.hostname);
  } catch {
    return false;
  }
}

/** Get the configured public base URL from env, or null if not set. */
export function getConfiguredPublicBaseUrl(): string | null {
  const raw = process.env.NEXT_PUBLIC_HEYIN_PUBLIC_BASE_URL;
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  // Remove trailing slash
  return trimmed.replace(/\/+$/, "");
}

/** Get the runtime origin (window.location.origin). */
export function getRuntimeOrigin(): string {
  if (typeof window !== "undefined") {
    try {
      return window.location.origin;
    } catch {}
  }
  return "";
}

/**
 * Get the public base URL for share links.
 *
 * Priority:
 *   1. NEXT_PUBLIC_HEYIN_PUBLIC_BASE_URL env var (custom domain)
 *   2. window.location.origin (runtime fallback)
 *   3. "" (SSR)
 */
export function getPublicBaseUrl(): string {
  const configured = getConfiguredPublicBaseUrl();
  if (configured) return configured;
  return getRuntimeOrigin();
}

/** True if current host is temporary EdgeOne and no custom domain is configured. */
export function isUnstableShareOrigin(): boolean {
  return (
    isUsingTemporaryEdgeOneOrigin() &&
    !getConfiguredPublicBaseUrl()
  );
}
