export interface ProjectFormData {
  title: string;
  songName: string;
  lyrics: string;
  slotsPerLine: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

/**
 * Validates the project creation form.
 * Returns a ValidationResult with per-field error messages.
 */
export function validateProjectForm(data: ProjectFormData): ValidationResult {
  const errors: Record<string, string> = {};

  const title = data.title.trim();
  if (!title) {
    errors.title = "Project title is required.";
  } else if (title.length > 100) {
    errors.title = "Title must be 100 characters or fewer.";
  }

  const songName = data.songName.trim();
  if (!songName) {
    errors.songName = "Song name is required.";
  } else if (songName.length > 100) {
    errors.songName = "Song name must be 100 characters or fewer.";
  }

  const lyricLines = data.lyrics
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  if (lyricLines.length === 0) {
    errors.lyrics = "Enter at least one lyric line.";
  } else if (lyricLines.length > 100) {
    errors.lyrics = "Maximum 100 lyric lines allowed.";
  }

  const slots = data.slotsPerLine;
  if (!Number.isInteger(slots) || slots < 1 || slots > 10) {
    errors.slotsPerLine = "Slots per line must be between 1 and 10.";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
