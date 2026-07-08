import type { ChorusProject } from "@/types/project";
import type { ProjectRepository } from "../types";
import { getTencentDatabase } from "@/services/tencent/client";
import {
  mapTencentDocsToChorusProject,
  createTencentShareId,
} from "./tencentProjectMapper";
import { isClaimExpired } from "@/features/voice-slot/claimSlot";

// ============================================================================
// Helpers
// ============================================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _db: any = null;

async function db() {
  if (!_db) _db = await getTencentDatabase();
  return _db;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function unwrap(res: any) {
  if (res.error) throw new Error(res.error.message || "CloudBase error");
  return res.data ?? res;
}

async function loadFullProject(projectId: string): Promise<ChorusProject | null> {
  const d = await db();

  const [projRes, linesRes, slotsRes, subsRes] = await Promise.all([
    d.collection("projects").doc(projectId).get(),
    d.collection("lyric_lines").where({ projectId }).get(),
    d.collection("voice_slots").where({ projectId }).get(),
    d.collection("voice_submissions").where({ projectId }).get(),
  ]);

  const project = unwrap(projRes);
  if (!project || (Array.isArray(project) && project.length === 0)) return null;

  // Note: CloudBase .doc().get() may return the doc directly or wrapped.
  // Normalize to a plain object.
  const projDoc = Array.isArray(project) ? project[0] : project;
  if (!projDoc) return null;

  return mapTencentDocsToChorusProject({
    project: projDoc,
    lyricLines: Array.isArray(unwrap(linesRes)) ? unwrap(linesRes) : [],
    voiceSlots: Array.isArray(unwrap(slotsRes)) ? unwrap(slotsRes) : [],
    voiceSubmissions: Array.isArray(unwrap(subsRes)) ? unwrap(subsRes) : [],
  });
}

// ============================================================================
// Repository Implementation
// ============================================================================

export const tencentProjectRepository: ProjectRepository = {
  async saveProject(project) {
    const d = await db();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    let projectId = project.id;
    const shareId = project.shareId ?? createTencentShareId();

    if (isUuid.test(project.id)) {
      // Existing Tencent project — update metadata only
      // Preserve existing ownerTokenHash if not provided
      const existing = await loadFullProject(project.id);
      const ownerTokenHash = project.ownerTokenHash ?? existing?.ownerTokenHash;
      await d.collection("projects").doc(project.id).set({
        id: project.id,
        shareId,
        title: project.title,
        songName: project.songName,
        slotsPerLine: project.slotsPerLine,
        status: project.status,
        ownerTokenHash: ownerTokenHash ?? null,
        createdAt: project.createdAt,
        updatedAt: new Date().toISOString(),
      });
      return loadFullProject(projectId).then((p) => {
        if (!p) throw new Error("Project not found after save.");
        return p;
      });
    }

    // Cloud create: generate UUIDs
    projectId = crypto.randomUUID();

    const lineDocs = project.lyricLines.map((l) => ({
      id: crypto.randomUUID(),
      projectId,
      lineIndex: l.index,
      text: l.text,
    }));

    const lineIdByIndex = new Map<number, string>();
    for (const ld of lineDocs) lineIdByIndex.set(ld.lineIndex, ld.id);

    const slotDocs = project.voiceSlots.map((s) => ({
      id: crypto.randomUUID(),
      projectId,
      lineId: lineIdByIndex.get(s.lineIndex) ?? "",
      lineIndex: s.lineIndex,
      slotIndex: s.slotIndex,
      lyricText: s.lyricText,
      status: "empty",
      claimedBy: null,
      claimedAt: null,
      updatedAt: new Date().toISOString(),
    }));

    // Insert project
    await d.collection("projects").doc(projectId).set({
      id: projectId,
      shareId,
      title: project.title,
      songName: project.songName,
      slotsPerLine: project.slotsPerLine,
      status: project.status,
      ownerTokenHash: project.ownerTokenHash ?? null,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    });

    // Insert lyric lines
    for (const ld of lineDocs) {
      await d.collection("lyric_lines").doc(ld.id).set(ld);
    }

    // Insert voice slots
    for (const sd of slotDocs) {
      await d.collection("voice_slots").doc(sd.id).set(sd);
    }

    return loadFullProject(projectId).then((p) => {
      if (!p) throw new Error("Project not found after create.");
      return p;
    });
  },

  async loadProject(projectId) {
    return loadFullProject(projectId);
  },

  async loadProjectByShareId(shareId) {
    const d = await db();
    const res = await d.collection("projects").where({ shareId }).get();
    const data = unwrap(res);
    const docs = Array.isArray(data) ? data : [];
    if (docs.length === 0) return null;
    return loadFullProject(docs[0].id);
  },

  async loadAllProjects() {
    const d = await db();
    const res = await d.collection("projects").get();
    const data = unwrap(res);
    const docs = Array.isArray(data) ? data : [];

    // CloudBase .get() may not support orderBy easily — sort in memory
    docs.sort((a: Record<string, unknown>, b: Record<string, unknown>) =>
      String(b.updatedAt ?? "").localeCompare(String(a.updatedAt ?? ""))
    );

    // TODO: Optimize — N+1 loadFullProject calls. Batch where projectId IN (...) later.
    const results: ChorusProject[] = [];
    for (const doc of docs) {
      const p = await loadFullProject(doc.id as string);
      if (p) results.push(p);
    }
    return results;
  },

  async deleteProject(projectId) {
    const d = await db();

    // CloudBase does not cascade — delete children first
    const collections = ["voice_submissions", "voice_slots", "lyric_lines"];
    for (const col of collections) {
      try {
        const res = await d.collection(col).where({ projectId }).get();
        const data = unwrap(res);
        const docs = Array.isArray(data) ? data : [];
        for (const doc of docs) {
          await d.collection(col).doc(doc.id ?? (doc as Record<string, unknown>)._id).remove();
        }
      } catch {
        // Best-effort — some collections may be empty or not exist
      }
    }

    // TODO: cascade works/work_versions when CN-7 is implemented

    await d.collection("projects").doc(projectId).remove();
  },

  async deleteAllProjects() {
    throw new Error("deleteAllProjects is disabled for Tencent cloud repositories.");
  },

  async setProjectStatus(project, status) {
    const d = await db();
    const now = new Date().toISOString();
    await d.collection("projects").doc(project.id).update({ status, updatedAt: now });
    return loadFullProject(project.id).then((p) => {
      if (!p) throw new Error("Project not found after status update.");
      return p;
    });
  },

  // Metadata-only — audio upload is CN-5
  async submitRecording(project, slotId, submission) {
    const d = await db();
    const now = new Date().toISOString();

    await d.collection("voice_submissions").doc(submission.id).set({
      id: submission.id,
      projectId: project.id,
      slotId,
      guestId: submission.guestId ?? null,
      nickname: submission.nickname,
      province: submission.province ?? null,
      audioPath: submission.audioId,
      duration: submission.duration,
      createdAt: submission.createdAt,
    });

    await d.collection("voice_slots").doc(slotId).update({
      status: "filled",
      claimedBy: null,
      claimedAt: null,
      updatedAt: now,
    });

    return loadFullProject(project.id).then((p) => {
      if (!p) throw new Error("Project not found after submit.");
      return p;
    });
  },

  async deleteSubmission(project, slotId) {
    const d = await db();

    // Delete submission docs for this slot
    const res = await d.collection("voice_submissions").where({ slotId }).get();
    const data = unwrap(res);
    const docs = Array.isArray(data) ? data : [];
    for (const doc of docs) {
      await d.collection("voice_submissions").doc(doc.id ?? (doc as Record<string, unknown>)._id).remove();
    }

    // Reset slot to empty
    await d.collection("voice_slots").doc(slotId).update({
      status: "empty",
      claimedBy: null,
      claimedAt: null,
      updatedAt: new Date().toISOString(),
    });

    return loadFullProject(project.id).then((p) => {
      if (!p) throw new Error("Project not found after delete.");
      return p;
    });
  },

  // MVP best-effort claim. Must be atomic with Cloud Function / transaction before public launch.
  async claimSlot(project, slotId, guestId) {
    const d = await db();
    const now = new Date().toISOString();

    // Read current status
    const slotRes = await d.collection("voice_slots").doc(slotId).get();
    const slot = unwrap(slotRes);
    if (!slot || (Array.isArray(slot) ? slot[0]?.status : slot.status) !== "empty") {
      return null;
    }

    await d.collection("voice_slots").doc(slotId).update({
      status: "claimed",
      claimedBy: guestId,
      claimedAt: now,
      updatedAt: now,
    });

    return loadFullProject(project.id);
  },

  async releaseClaim(project, slotId) {
    const d = await db();
    const now = new Date().toISOString();

    const slotRes = await d.collection("voice_slots").doc(slotId).get();
    const slot = unwrap(slotRes);
    const status = Array.isArray(slot) ? slot[0]?.status : slot?.status;
    if (status !== "claimed") return null;

    await d.collection("voice_slots").doc(slotId).update({
      status: "empty",
      claimedBy: null,
      claimedAt: null,
      updatedAt: now,
    });

    return loadFullProject(project.id);
  },

  async cleanupStaleClaims(project, maxAgeMs) {
    const expiredSlots = project.voiceSlots.filter((s) =>
      isClaimExpired(s, maxAgeMs)
    );
    if (expiredSlots.length === 0) return project;

    const d = await db();
    const now = new Date().toISOString();

    for (const slot of expiredSlots) {
      await d.collection("voice_slots").doc(slot.id).update({
        status: "empty",
        claimedBy: null,
        claimedAt: null,
        updatedAt: now,
      });
    }

    return loadFullProject(project.id).then((p) => p ?? project);
  },
};
