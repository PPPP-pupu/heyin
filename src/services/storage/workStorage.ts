import type { ChorusWork } from "@/types/work";

const STORAGE_PREFIX = "heyin:work:";

function storageKey(workId: string): string {
  return `${STORAGE_PREFIX}${workId}`;
}

export function saveWork(work: ChorusWork): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKey(work.id), JSON.stringify(work));
  } catch {
    throw new Error("Failed to save work.");
  }
}

export function loadWork(workId: string): ChorusWork | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(storageKey(workId));
    if (!raw) return null;
    return JSON.parse(raw) as ChorusWork;
  } catch {
    return null;
  }
}

export function loadAllWorks(): ChorusWork[] {
  if (typeof window === "undefined") return [];
  const works: ChorusWork[] = [];
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i);
    if (key?.startsWith(STORAGE_PREFIX)) {
      const workId = key.slice(STORAGE_PREFIX.length);
      const work = loadWork(workId);
      if (work) works.push(work);
    }
  }
  works.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return works;
}

export function deleteWork(workId: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(storageKey(workId));
}
