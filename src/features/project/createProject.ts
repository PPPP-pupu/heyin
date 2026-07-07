import type { ChorusProject, LyricLine, VoiceSlot } from "@/types/project";
import { generateId } from "@/utils/id";
import { saveProject } from "@/services/storage/projectStorage";
import type { ProjectFormData } from "@/utils/validation";

/**
 * Pure builder: creates a ChorusProject object from form input WITHOUT side effects.
 * Does NOT persist to storage — callers must save via repository.
 *
 * Steps:
 * 1. Generate a unique project ID.
 * 2. Parse non-empty lyric lines from the textarea.
 * 3. Create LyricLine objects (one per line).
 * 4. Create VoiceSlot objects (slotsPerLine × lyricLines, all empty).
 * 5. Assemble the ChorusProject.
 */
export function buildProjectFromForm(data: ProjectFormData): ChorusProject {
  const projectId = generateId("proj-");
  const now = new Date().toISOString();

  const rawLines = data.lyrics
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const lyricLines: LyricLine[] = rawLines.map((text, index) => ({
    id: generateId("line-"),
    index,
    text,
  }));

  const voiceSlots: VoiceSlot[] = [];
  for (const line of lyricLines) {
    for (let si = 0; si < data.slotsPerLine; si++) {
      voiceSlots.push({
        id: generateId("slot-"),
        lineId: line.id,
        lineIndex: line.index,
        slotIndex: si,
        lyricText: line.text,
        status: "empty",
      });
    }
  }

  return {
    id: projectId,
    title: data.title.trim(),
    songName: data.songName.trim(),
    backingTrackUrl: undefined,
    lyricLines,
    slotsPerLine: data.slotsPerLine,
    voiceSlots,
    createdAt: now,
    updatedAt: now,
    status: "open",
  };
}

/**
 * Creates a ChorusProject from form input and persists it to localStorage.
 *
 * @deprecated Prefer buildProjectFromForm + projectRepository.saveProject().
 * Kept for backward compatibility with existing local-mode callers.
 */
export function createProjectFromForm(data: ProjectFormData): ChorusProject {
  const project = buildProjectFromForm(data);
  saveProject(project);
  return project;
}
