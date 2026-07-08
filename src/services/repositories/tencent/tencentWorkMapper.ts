import type { ChorusWork } from "@/types/work";
import type { ChorusWorkVersion } from "@/types/workVersion";

/**
 * Map Tencent CloudBase collection docs to ChorusWork and ChorusWorkVersion.
 *
 * Collections use camelCase field names matching the TypeScript app model.
 * audioPath in the document maps to audioId in the app type.
 */

export function mapTencentDocToChorusWork(
  doc: Record<string, unknown>,
  versions: ChorusWorkVersion[]
): ChorusWork {
  return {
    id: String(doc.id ?? ""),
    projectId: String(doc.projectId ?? ""),
    title: String(doc.title ?? ""),
    songName: String(doc.songName ?? ""),
    // audioPath stores the CloudBase fileID or storage path
    audioId: String(doc.audioPath ?? ""),
    audioDuration: Number(doc.audioDuration ?? 0),
    participants: Array.isArray(doc.participants) ? doc.participants as string[] : [],
    lyricLineCount: Number(doc.lyricLineCount ?? 0),
    filledSlotCount: Number(doc.filledSlotCount ?? 0),
    totalSlotCount: Number(doc.totalSlotCount ?? 0),
    versions: doc.versions as string[] ?? versions.map((v) => v.id),
    latestVersionId: (doc.latestVersionId as string) ?? undefined,
    createdAt: String(doc.createdAt ?? ""),
  };
}

export function mapTencentDocToChorusWorkVersion(
  doc: Record<string, unknown>
): ChorusWorkVersion {
  return {
    id: String(doc.id ?? ""),
    workId: String(doc.workId ?? ""),
    // audioPath stores the CloudBase fileID or storage path
    audioId: String(doc.audioPath ?? ""),
    duration: Number(doc.duration ?? 0),
    filledSlotCount: Number(doc.filledSlotCount ?? 0),
    totalSlotCount: Number(doc.totalSlotCount ?? 0),
    createdAt: String(doc.createdAt ?? ""),
  };
}
