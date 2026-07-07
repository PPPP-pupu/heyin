import type { ChorusProject, VoiceSubmission } from "@/types/project";
import type { ChorusWork } from "@/types/work";
import type { ChorusWorkVersion } from "@/types/workVersion";
import type { GuestProfile } from "@/hooks/useGuestProfile";

// ============================================================================
// Repository Interfaces
// ============================================================================
// These interfaces define the contract for data access, abstracting over
// local (localStorage + IndexedDB) and cloud (Supabase) storage backends.
//
// All methods return Promises — even for local sync operations — so that
// the interface is uniform across backends.
// ============================================================================

/** CRUD + business actions for chorus projects and their slots. */
export interface ProjectRepository {
  /** Save a project. Returns the persisted project (may have new IDs in cloud mode). */
  saveProject(project: ChorusProject): Promise<ChorusProject>;
  loadProject(projectId: string): Promise<ChorusProject | null>;
  /** Find a project by its public share_id (used by /join/[shareId]). */
  loadProjectByShareId(shareId: string): Promise<ChorusProject | null>;
  loadAllProjects(): Promise<ChorusProject[]>;
  deleteProject(projectId: string): Promise<void>;
  deleteAllProjects?(): Promise<void>;

  // Business actions (was projectActions + claimSlot)
  setProjectStatus(project: ChorusProject, status: ChorusProject["status"]): Promise<ChorusProject>;
  submitRecording(project: ChorusProject, slotId: string, submission: VoiceSubmission): Promise<ChorusProject>;
  deleteSubmission(project: ChorusProject, slotId: string): Promise<ChorusProject>;
  claimSlot(project: ChorusProject, slotId: string, guestId: string): Promise<ChorusProject | null>;
  releaseClaim(project: ChorusProject, slotId: string): Promise<ChorusProject | null>;
  cleanupStaleClaims(project: ChorusProject, maxAgeMs?: number): Promise<ChorusProject>;
}

/** Audio blob persistence — local IndexedDB or cloud Storage. */
export interface AudioRepository {
  /** Save a blob and return a unique identifier (IndexedDB key or storage path). */
  saveAudio(blob: Blob, pathHint?: string): Promise<string>;
  /** Load a blob by identifier. Returns null if not found. */
  loadAudio(idOrPath: string): Promise<Blob | null>;
  /** Delete a blob by identifier. */
  deleteAudio(idOrPath: string): Promise<void>;
  /** Delete all audio data (for dev/test reset). */
  deleteAllAudio?(): Promise<void>;
}

/** CRUD for chorus works and their version history. */
export interface WorkRepository {
  saveWork(work: ChorusWork): Promise<void>;
  loadWork(workId: string): Promise<ChorusWork | null>;
  loadAllWorks(): Promise<ChorusWork[]>;
  deleteWork(workId: string): Promise<void>;

  saveWorkVersion(version: ChorusWorkVersion): Promise<void>;
  loadWorkVersion(versionId: string): Promise<ChorusWorkVersion | null>;
  /** Batch-load multiple versions (for the Work page version switcher). */
  loadWorkVersions(versionIds: string[]): Promise<ChorusWorkVersion[]>;
}

/** Guest identity persistence — localStorage or cloud profile table. */
export interface GuestRepository {
  loadGuestProfile(): Promise<GuestProfile | null>;
  saveGuestProfile(profile: GuestProfile): Promise<void>;
  deleteGuestProfile(): Promise<void>;
}
