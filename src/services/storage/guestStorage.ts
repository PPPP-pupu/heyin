import type { GuestProfile } from "@/hooks/useGuestProfile";

const STORAGE_KEY = "heyin:guest";

/**
 * guestStorage — persist guest identity in localStorage.
 *
 * Layer: Storage Layer (⬛)
 *
 * Follows the same pattern as projectStorage, audioStorage, workStorage.
 * The hook (useGuestProfile) delegates to this module — never touches
 * localStorage directly.
 */

/** Load the saved guest profile, or null if none exists / data is corrupt. */
export function loadGuestProfile(): GuestProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.id === "string" && typeof parsed.nickname === "string") {
      return parsed as GuestProfile;
    }
    return null;
  } catch {
    return null;
  }
}

/** Save (create or update) the guest profile. */
export function saveGuestProfile(profile: GuestProfile): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}

/** Remove the guest profile (logout / reset). */
export function deleteGuestProfile(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}
