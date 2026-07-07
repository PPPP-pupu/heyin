import type { ChorusWorkVersion } from "@/types/workVersion";
import type { WorkRepository } from "../types";
import {
  saveWork,
  loadWork,
  loadAllWorks,
  deleteWork,
} from "@/services/storage/workStorage";
import {
  saveWorkVersion,
  loadWorkVersion,
} from "@/services/storage/workVersionStorage";

/**
 * localWorkRepository — wraps existing localStorage work + version storage.
 *
 * loadWorkVersions is implemented here (batch load) since workVersionStorage
 * only has single-version load.
 */
export const localWorkRepository: WorkRepository = {
  async saveWork(work) {
    saveWork(work);
  },

  async loadWork(workId) {
    return loadWork(workId);
  },

  async loadAllWorks() {
    return loadAllWorks();
  },

  async deleteWork(workId) {
    deleteWork(workId);
  },

  async saveWorkVersion(version) {
    saveWorkVersion(version);
  },

  async loadWorkVersion(versionId) {
    return loadWorkVersion(versionId);
  },

  async loadWorkVersions(versionIds) {
    const results: ChorusWorkVersion[] = [];
    for (const id of versionIds) {
      const v = loadWorkVersion(id);
      if (v) results.push(v);
    }
    return results;
  },
};
