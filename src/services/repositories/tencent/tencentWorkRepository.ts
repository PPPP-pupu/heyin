import type { ChorusWork } from "@/types/work";
import type { ChorusWorkVersion } from "@/types/workVersion";
import type { WorkRepository } from "../types";
import { getTencentDatabase } from "@/services/tencent/client";
import {
  mapTencentDocToChorusWork,
  mapTencentDocToChorusWorkVersion,
} from "./tencentWorkMapper";

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

async function loadWorkVersionsByWorkId(workId: string): Promise<ChorusWorkVersion[]> {
  const d = await db();
  const res = await d.collection("work_versions").where({ workId }).get();
  const data = unwrap(res);
  const docs = Array.isArray(data) ? data : [];
  return docs
    .map((doc: Record<string, unknown>) => mapTencentDocToChorusWorkVersion(doc))
    .sort((a: ChorusWorkVersion, b: ChorusWorkVersion) =>
      a.createdAt.localeCompare(b.createdAt)
    );
}

export const tencentWorkRepository: WorkRepository = {
  async saveWork(work) {
    const d = await db();
    const now = new Date().toISOString();

    await d.collection("works").doc(work.id).set({
      id: work.id,
      projectId: work.projectId,
      title: work.title,
      songName: work.songName,
      latestVersionId: work.latestVersionId ?? null,
      audioPath: work.audioId,
      audioDuration: work.audioDuration,
      participants: work.participants,
      lyricLineCount: work.lyricLineCount,
      filledSlotCount: work.filledSlotCount,
      totalSlotCount: work.totalSlotCount,
      versions: work.versions,
      createdAt: work.createdAt,
      updatedAt: now,
    });
  },

  async loadWork(workId) {
    const d = await db();
    const res = await d.collection("works").doc(workId).get();
    const data = unwrap(res);
    const doc = Array.isArray(data) ? data[0] : data;
    if (!doc) return null;

    const versions = await loadWorkVersionsByWorkId(workId);
    return mapTencentDocToChorusWork(doc, versions);
  },

  async loadAllWorks() {
    const d = await db();
    const res = await d.collection("works").get();
    const data = unwrap(res);
    const docs = Array.isArray(data) ? data : [];

    // Sort by updatedAt desc in memory
    docs.sort((a: Record<string, unknown>, b: Record<string, unknown>) =>
      String(b.updatedAt ?? "").localeCompare(String(a.updatedAt ?? ""))
    );

    const results: ChorusWork[] = [];
    for (const doc of docs) {
      const versions = await loadWorkVersionsByWorkId(String(doc.id ?? ""));
      results.push(mapTencentDocToChorusWork(doc, versions));
    }
    return results;
  },

  async deleteWork(workId) {
    const d = await db();

    // Delete child versions first
    try {
      const res = await d.collection("work_versions").where({ workId }).get();
      const data = unwrap(res);
      const docs = Array.isArray(data) ? data : [];
      for (const doc of docs) {
        await d.collection("work_versions").doc(doc.id ?? doc._id).remove();
      }
    } catch {
      // Best-effort
    }

    // Delete the work document
    await d.collection("works").doc(workId).remove();

    // TODO: CN-8 delete associated audio files from CloudBase Storage
  },

  async saveWorkVersion(version) {
    const d = await db();

    // Infer projectId from the parent work
    let projectId = "";
    try {
      const workRes = await d.collection("works").doc(version.workId).get();
      const workData = unwrap(workRes);
      const workDoc = Array.isArray(workData) ? workData[0] : workData;
      if (workDoc) projectId = String(workDoc.projectId ?? "");
    } catch {
      // projectId is optional for work_versions
    }

    await d.collection("work_versions").doc(version.id).set({
      id: version.id,
      workId: version.workId,
      projectId,
      audioPath: version.audioId,
      duration: version.duration,
      filledSlotCount: version.filledSlotCount,
      totalSlotCount: version.totalSlotCount,
      createdAt: version.createdAt,
    });
  },

  async loadWorkVersion(versionId) {
    const d = await db();
    const res = await d.collection("work_versions").doc(versionId).get();
    const data = unwrap(res);
    const doc = Array.isArray(data) ? data[0] : data;
    if (!doc) return null;
    return mapTencentDocToChorusWorkVersion(doc);
  },

  async loadWorkVersions(versionIds) {
    const results: ChorusWorkVersion[] = [];
    for (const id of versionIds) {
      const v = await this.loadWorkVersion(id);
      if (v) results.push(v);
    }
    return results;
  },
};
