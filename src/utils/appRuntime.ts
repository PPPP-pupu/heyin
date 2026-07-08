/**
 * App runtime detection utilities.
 *
 * Distinguishes between browser H5, Capacitor hybrid app, and other runtimes.
 * Used for conditional behavior (e.g., native bridge calls, app-specific UI).
 *
 * This is NOT a security check — do not use for auth or permission decisions.
 */

/** True if running inside a Capacitor hybrid app shell. */
export function isCapacitorApp(): boolean {
  if (typeof window === "undefined") return false;
  try {
    // Capacitor injects window.Capacitor on native platforms
    return !!(window as unknown as Record<string, unknown>).Capacitor;
  } catch {
    return false;
  }
}

/** Get the current runtime type for logging/debugging. */
export function getAppRuntime(): "capacitor" | "browser" | "server" {
  if (typeof window === "undefined") return "server";
  if (isCapacitorApp()) return "capacitor";
  return "browser";
}
