import type { ChorusProject, LyricLine, VoiceSlot, VoiceSubmission } from "@/types/project";

/**
 * Map Supabase rows (snake_case) to a ChorusProject (camelCase).
 *
 * Input: raw rows from projects, lyric_lines, voice_slots, voice_submissions tables
 *        (Record<string, unknown> — the Supabase client's untyped query result).
 * Output: a fully assembled ChorusProject matching the local data model.
 *
 * Once `supabase gen types` produces typed rows, the input types can be
 * narrowed to ProjectRow, LyricLineRow, etc.
 */
export function mapSupabaseProjectToChorusProject(input: {
  project: Record<string, unknown>;
  lyricLines: Record<string, unknown>[];
  voiceSlots: Record<string, unknown>[];
  voiceSubmissions: Record<string, unknown>[];
}): ChorusProject {
  const { project, lyricLines, voiceSlots, voiceSubmissions } = input;

  // Build a map of slot_id → submission for fast lookup
  const submissionBySlotId = new Map<string, VoiceSubmission>();
  for (const row of voiceSubmissions) {
    const sub = mapSubmissionRow(row);
    submissionBySlotId.set(sub.slotId, sub);
  }

  // Map lyric lines (sorted by line_index)
  const mappedLines: LyricLine[] = lyricLines
    .sort((a, b) => Number(a.line_index ?? 0) - Number(b.line_index ?? 0))
    .map((row) => ({
      id: String(row.id ?? ""),
      index: Number(row.line_index ?? 0),
      text: String(row.text ?? ""),
    }));

  // Map voice slots (attach submissions where present)
  const mappedSlots: VoiceSlot[] = voiceSlots.map((row) => {
    const submission = submissionBySlotId.get(String(row.id ?? ""));
    return {
      id: String(row.id ?? ""),
      lineId: String(row.line_id ?? ""),
      lineIndex: Number(row.line_index ?? 0),
      slotIndex: Number(row.slot_index ?? 0),
      lyricText: String(row.lyric_text ?? ""),
      status: String(row.status ?? "empty") as VoiceSlot["status"],
      claimedBy: (row.claimed_by as string) ?? undefined,
      claimedAt: (row.claimed_at as string) ?? undefined,
      submission,
    };
  });

  return {
    id: String(project.id ?? ""),
    title: String(project.title ?? ""),
    songName: String(project.song_name ?? ""),
    backingTrackUrl: undefined,
    lyricLines: mappedLines,
    slotsPerLine: Number(project.slots_per_line ?? 0),
    voiceSlots: mappedSlots,
    createdAt: String(project.created_at ?? ""),
    updatedAt: String(project.updated_at ?? ""),
    status: String(project.status ?? "open") as ChorusProject["status"],
    shareId: String(project.share_id ?? ""),
  };
}

/** Map a single submission row (Record<string, unknown>) to VoiceSubmission. */
function mapSubmissionRow(row: Record<string, unknown>): VoiceSubmission {
  return {
    id: String(row.id ?? ""),
    slotId: String(row.slot_id ?? ""),
    guestId: (row.guest_id as string) ?? undefined,
    nickname: String(row.nickname ?? ""),
    province: (row.province as string) ?? undefined,
    // In cloud mode this stores an audio path or public URL.
    // AudioRepository will resolve it to a playable URL later (Commit 7).
    audioId: String(row.audio_path ?? ""),
    duration: Number(row.duration ?? 0),
    createdAt: String(row.created_at ?? ""),
  };
}

/**
 * Generate a short, URL-safe share identifier.
 *
 * Format: "h-" + 8 random alphanumeric characters.
 * Uses crypto.randomUUID() — available in all modern browsers.
 * No external dependencies.
 */
export function createShareId(): string {
  const uuid = crypto.randomUUID();
  // Take the first 8 chars of the UUID (after removing dashes)
  const short = uuid.replace(/-/g, "").slice(0, 8);
  return `h-${short}`;
}
