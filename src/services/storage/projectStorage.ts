import type { ChorusProject } from "@/types/project";

const STORAGE_PREFIX = "heyin:project:";

function storageKey(projectId: string): string {
  return `${STORAGE_PREFIX}${projectId}`;
}

/**
 * Save a project to localStorage.
 * Works for both create (new key) and update (existing key).
 * Throws if localStorage is full or unavailable.
 */
export function saveProject(project: ChorusProject): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKey(project.id), JSON.stringify(project));
  } catch {
    throw new Error("Failed to save project. Storage may be full or unavailable.");
  }
}

/**
 * Load a single project from localStorage by ID.
 * Returns null if the project doesn't exist or data is corrupt.
 */
export function loadProject(projectId: string): ChorusProject | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(storageKey(projectId));
    if (!raw) return null;
    return JSON.parse(raw) as ChorusProject;
  } catch {
    return null;
  }
}

/**
 * Delete a project from localStorage.
 */
export function deleteProject(projectId: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(storageKey(projectId));
}

/**
 * Load all saved projects from localStorage.
 * Returns an array sorted by updatedAt descending (newest first).
 */
export function loadAllProjects(): ChorusProject[] {
  if (typeof window === "undefined") return [];
  const projects: ChorusProject[] = [];
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i);
    if (key?.startsWith(STORAGE_PREFIX)) {
      const projectId = key.slice(STORAGE_PREFIX.length);
      const project = loadProject(projectId);
      if (project) projects.push(project);
    }
  }
  projects.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
  return projects;
}

/**
 * Delete ALL projects from localStorage.
 * Used by Profile page "Clear All Data" — irreversible.
 */
export function deleteAllProjects(): void {
  if (typeof window === "undefined") return;
  const keysToDelete: string[] = [];
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i);
    if (key?.startsWith(STORAGE_PREFIX)) keysToDelete.push(key);
  }
  for (const key of keysToDelete) window.localStorage.removeItem(key);
}
