import type { ProjectRepository } from "../types";
import {
  saveProject,
  loadProject,
  loadAllProjects,
  deleteProject,
  deleteAllProjects,
} from "@/services/storage/projectStorage";
import {
  submitRecording,
  deleteSubmission,
  setProjectStatus,
} from "@/features/project/projectActions";
import {
  claimSlot,
  releaseClaim,
  cleanupStaleClaims,
} from "@/features/voice-slot/claimSlot";

/**
 * localProjectRepository — wraps existing localStorage + action functions.
 *
 * All existing functions are sync (they mutate localStorage and return a value).
 * We wrap them in Promise.resolve() for async interface uniformity.
 */
export const localProjectRepository: ProjectRepository = {
  async saveProject(project) {
    saveProject(project);
    return project;
  },

  async loadProject(projectId) {
    return loadProject(projectId);
  },

  async loadProjectByShareId(shareId) {
    // Scan all projects — share_id is the project id in local mode (or shareId field if set)
    const all = loadAllProjects();
    return all.find((p) => p.shareId === shareId || p.id === shareId) ?? null;
  },

  async loadAllProjects() {
    return loadAllProjects();
  },

  async deleteProject(projectId) {
    deleteProject(projectId);
  },

  async deleteAllProjects() {
    deleteAllProjects?.();
  },

  async setProjectStatus(project, status) {
    return setProjectStatus(project, status);
  },

  async submitRecording(project, slotId, submission) {
    return submitRecording(project, slotId, submission);
  },

  async deleteSubmission(project, slotId) {
    return deleteSubmission(project, slotId);
  },

  async claimSlot(project, slotId, guestId) {
    return claimSlot(project, slotId, guestId);
  },

  async releaseClaim(project, slotId) {
    return releaseClaim(project, slotId);
  },

  async cleanupStaleClaims(project, maxAgeMs) {
    return cleanupStaleClaims(project, maxAgeMs);
  },
};
