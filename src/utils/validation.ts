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
    errors.title = "请输入项目标题。";
  } else if (title.length > 100) {
    errors.title = "标题不能超过 100 个字符。";
  }

  const songName = data.songName.trim();
  if (!songName) {
    errors.songName = "请输入歌曲名称。";
  } else if (songName.length > 100) {
    errors.songName = "歌曲名称不能超过 100 个字符。";
  }

  const lyricLines = data.lyrics
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  if (lyricLines.length === 0) {
    errors.lyrics = "请至少输入一行歌词。";
  } else if (lyricLines.length > 100) {
    errors.lyrics = "最多允许 100 行歌词。";
  }

  const slots = data.slotsPerLine;
  if (!Number.isInteger(slots) || slots < 1 || slots > 10) {
    errors.slotsPerLine = "每句可录人数需在 1 到 10 之间。";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
