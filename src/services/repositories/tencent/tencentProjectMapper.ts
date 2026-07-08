import type { ChorusProject, LyricLine, VoiceSlot, VoiceSubmission } from "@/types/project";

/**
 * Map Tencent CloudBase collection docs to a ChorusProject.
 *
 * Collections use camelCase field names matching the TypeScript app model.
 * This is different from Supabase which uses snake_case.
 */

export function mapTencentDocsToChorusProject(docs: {
  project: Record<string, unknown>;
  lyricLines: Record<string, unknown>[];
  voiceSlots: Record<string, unknown>[];
  voiceSubmissions: Record<string, unknown>[];
}): ChorusProject {
  const { project, lyricLines, voiceSlots, voiceSubmissions } = docs;

  const submissionBySlotId = new Map<string, VoiceSubmission>();
  for (const row of voiceSubmissions) {
    const sub = mapSubmissionDoc(row);
    submissionBySlotId.set(sub.slotId, sub);
  }

  const mappedLines: LyricLine[] = lyricLines
    .sort((a, b) => Number(a.lineIndex ?? 0) - Number(b.lineIndex ?? 0))
    .map((row) => ({
      id: String(row.id ?? ""),
      index: Number(row.lineIndex ?? 0),
      text: String(row.text ?? ""),
    }));

  const mappedSlots: VoiceSlot[] = voiceSlots
    .sort((a, b) => {
      const li = Number(a.lineIndex ?? 0) - Number(b.lineIndex ?? 0);
      if (li !== 0) return li;
      return Number(a.slotIndex ?? 0) - Number(b.slotIndex ?? 0);
    })
    .map((row) => {
      const submission = submissionBySlotId.get(String(row.id ?? ""));
      return {
        id: String(row.id ?? ""),
        lineId: String(row.lineId ?? ""),
        lineIndex: Number(row.lineIndex ?? 0),
        slotIndex: Number(row.slotIndex ?? 0),
        lyricText: String(row.lyricText ?? ""),
        status: String(row.status ?? "empty") as VoiceSlot["status"],
        claimedBy: (row.claimedBy as string) ?? undefined,
        claimedAt: (row.claimedAt as string) ?? undefined,
        submission,
      };
    });

  return {
    id: String(project.id ?? ""),
    title: String(project.title ?? ""),
    songName: String(project.songName ?? ""),
    backingTrackUrl: undefined,
    lyricLines: mappedLines,
    slotsPerLine: Number(project.slotsPerLine ?? 0),
    voiceSlots: mappedSlots,
    createdAt: String(project.createdAt ?? ""),
    updatedAt: String(project.updatedAt ?? ""),
    status: String(project.status ?? "open") as ChorusProject["status"],
    shareId: String(project.shareId ?? ""),
    ownerTokenHash: (project.ownerTokenHash as string) ?? undefined,
  };
}

function mapSubmissionDoc(row: Record<string, unknown>): VoiceSubmission {
  const vis = row.visibility as string | undefined;
  return {
    id: String(row.id ?? ""),
    slotId: String(row.slotId ?? ""),
    guestId: (row.guestId as string) ?? undefined,
    nickname: String(row.nickname ?? ""),
    province: (row.province as string) ?? undefined,
    audioId: String(row.audioPath ?? ""),
    duration: Number(row.duration ?? 0),
    visibility: (vis === "public" || vis === "creatorOnly") ? vis : "public", // legacy default
    mixVolume: (row.mixVolume as number) ?? 1,
    createdAt: String(row.createdAt ?? ""),
  };
}

/** Generate a short share ID. Uses same format as Supabase mapper. */
export function createTencentShareId(): string {
  return `h-${crypto.randomUUID().replace(/-/g, "").slice(0, 8)}`;
}
