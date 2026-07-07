/**
 * Repository layer — unified data access for local and cloud storage.
 *
 * Layer: Storage Layer (⬛)
 *
 * Resolution logic:
 *
 *   STORAGE_MODE=local  → local repos (localStorage + IndexedDB)
 *   STORAGE_MODE=cloud + PROVIDER=supabase → Supabase repos
 *   STORAGE_MODE=cloud + PROVIDER=tencent  → THROW not-implemented error
 *
 *   Local mode ignores the provider env entirely.
 */

import type {
  ProjectRepository,
  AudioRepository,
  WorkRepository,
  GuestRepository,
} from "./types";
import { isCloudRepositoryMode } from "./repositoryMode";
import { isTencentProvider } from "./cloudProvider";
import { localProjectRepository } from "./local/localProjectRepository";
import { localAudioRepository } from "./local/localAudioRepository";
import { localWorkRepository } from "./local/localWorkRepository";
import { localGuestRepository } from "./local/localGuestRepository";
import { supabaseProjectRepository } from "./supabase/supabaseProjectRepository";
import { supabaseAudioRepository } from "./supabase/supabaseAudioRepository";
import { throwTencentNotImplemented } from "./tencent/notImplemented";

// Re-export for direct access
export { supabaseProjectRepository, supabaseAudioRepository };

// --- Repository resolution ---

function resolveProjectRepository(): ProjectRepository {
  if (!isCloudRepositoryMode()) return localProjectRepository;
  if (isTencentProvider()) return throwTencentNotImplemented("Project");
  return supabaseProjectRepository;
}

function resolveAudioRepository(): AudioRepository {
  if (!isCloudRepositoryMode()) return localAudioRepository;
  if (isTencentProvider()) return throwTencentNotImplemented("Audio");
  return supabaseAudioRepository;
}

function resolveWorkRepository(): WorkRepository {
  if (!isCloudRepositoryMode()) return localWorkRepository;
  if (isTencentProvider()) return throwTencentNotImplemented("Work");
  // TODO: Commit 9 adds supabaseWorkRepository. Fallback to local for now.
  return localWorkRepository;
}

function resolveGuestRepository(): GuestRepository {
  if (!isCloudRepositoryMode()) return localGuestRepository;
  if (isTencentProvider()) return throwTencentNotImplemented("Guest");
  // TODO: Commit 10 adds supabaseGuestRepository. Fallback to local for now.
  return localGuestRepository;
}

export const projectRepository: ProjectRepository = resolveProjectRepository();
export const audioRepository: AudioRepository = resolveAudioRepository();
export const workRepository: WorkRepository = resolveWorkRepository();
export const guestRepository: GuestRepository = resolveGuestRepository();
