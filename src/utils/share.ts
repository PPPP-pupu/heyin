import { getPublicBaseUrl } from "./publicBaseUrl";

/**
 * Generate the join URL for a chorus project.
 *
 * Uses NEXT_PUBLIC_HEYIN_PUBLIC_BASE_URL if configured (production/stable domain),
 * otherwise falls back to window.location.origin (local dev or non-EdgeOne deploy).
 *
 * Do NOT generate share links from temporary EdgeOne Preview URLs —
 * they expire after 3 hours. Set NEXT_PUBLIC_HEYIN_PUBLIC_BASE_URL
 * to a custom domain before wider testing.
 */
export function generateJoinUrl(projectId: string): string {
  const baseUrl = getPublicBaseUrl();
  if (baseUrl) {
    return `${baseUrl}/join/${projectId}`;
  }
  return `/join/${projectId}`;
}

/** Check if the current URL is localhost (not shareable to other devices). */
export function isLocalhost(): boolean {
  if (typeof window === "undefined") return true;
  const host = window.location.hostname;
  return host === "localhost" || host === "127.0.0.1" || host.startsWith("192.168.") === false && host === "::1";
}

/**
 * Copy text to clipboard. Returns true on success.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const el = document.createElement("textarea");
      el.value = text;
      el.style.position = "fixed";
      el.style.opacity = "0";
      if (!document.body) return false;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      if (el.parentNode) el.parentNode.removeChild(el);
      return true;
    } catch {
      return false;
    }
  }
}
