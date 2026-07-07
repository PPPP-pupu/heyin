/**
 * Generate the join URL for a chorus project.
 * Uses the current page's origin so it works with both localhost and network IPs.
 */
export function generateJoinUrl(projectId: string): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/join/${projectId}`;
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
