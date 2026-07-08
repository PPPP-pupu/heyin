/**
 * Owner token utilities — lightweight creator identity for management actions.
 *
 * This is an MVP UI-level protection, NOT production-grade security.
 * Raw tokens are stored in localStorage and URL query params only.
 * Only the SHA-256 hash is persisted to the database.
 *
 * Future: replace with CloudBase security rules + Cloud Functions + real auth.
 */

const STORAGE_PREFIX = "heyin:ownerToken:";

/** Generate a URL-safe random owner token. */
export function generateOwnerToken(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  // Base64url-encode the random bytes
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/** Hash a token with SHA-256, return hex string. */
export async function hashOwnerToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Save raw owner token to localStorage for the creator's device. */
export function saveOwnerToken(projectId: string, token: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(`${STORAGE_PREFIX}${projectId}`, token);
  } catch {
    // localStorage full or unavailable — user can still use URL token
  }
}

/** Load raw owner token from localStorage. */
export function loadOwnerToken(projectId: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(`${STORAGE_PREFIX}${projectId}`);
  } catch {
    return null;
  }
}

/** Delete owner token from localStorage. */
export function deleteOwnerToken(projectId: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(`${STORAGE_PREFIX}${projectId}`);
  } catch {}
}

/** Extract owner token from URL search params. */
export function getOwnerTokenFromUrl(searchParams: URLSearchParams): string | null {
  return searchParams.get("owner");
}
