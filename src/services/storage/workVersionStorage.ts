import type { ChorusWorkVersion } from "@/types/workVersion";

const STORAGE_PREFIX = "heyin:version:";

function storageKey(versionId: string): string {
  return `${STORAGE_PREFIX}${versionId}`;
}

export function saveWorkVersion(version: ChorusWorkVersion): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKey(version.id), JSON.stringify(version));
  } catch {
    // Silent — version is supplementary data
  }
}

export function loadWorkVersion(versionId: string): ChorusWorkVersion | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(storageKey(versionId));
    if (!raw) return null;
    return JSON.parse(raw) as ChorusWorkVersion;
  } catch {
    return null;
  }
}
