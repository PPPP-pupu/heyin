/**
 * Repository layer — unified data access for local and cloud storage.
 *
 * Layer: Storage Layer (⬛)
 *
 * Usage:
 *   import { projectRepository, audioRepository, workRepository, guestRepository }
 *     from "@/services/repositories";
 *
 * These singletons are resolved at module load time based on
 * NEXT_PUBLIC_HEYIN_STORAGE_MODE.
 * - "local" (default) → localStorage + IndexedDB
 * - "cloud"           → Supabase (projectRepository is ready, others TBD)
 */

import type {
  ProjectRepository,
  AudioRepository,
  WorkRepository,
  GuestRepository,
} from "./types";
import { isCloudRepositoryMode } from "./repositoryMode";
import { localProjectRepository } from "./local/localProjectRepository";
import { localAudioRepository } from "./local/localAudioRepository";
import { localWorkRepository } from "./local/localWorkRepository";
import { localGuestRepository } from "./local/localGuestRepository";
import { supabaseProjectRepository } from "./supabase/supabaseProjectRepository";

// Re-export for direct access (e.g. future migration scripts, tests)
export { supabaseProjectRepository };

// --- Repository resolution ---

function resolveProjectRepository(): ProjectRepository {
  if (isCloudRepositoryMode()) {
    return supabaseProjectRepository;
  }
  return localProjectRepository;
}

// Audio / Work / Guest cloud repositories are not yet implemented.
// TODO: Commit 7 adds supabaseAudioRepository.
// TODO: Commit 9 adds supabaseWorkRepository.
// TODO: Commit 10 adds supabaseGuestRepository.

export const projectRepository: ProjectRepository = resolveProjectRepository();

export const audioRepository: AudioRepository =
  localAudioRepository;

export const workRepository: WorkRepository =
  localWorkRepository;

export const guestRepository: GuestRepository =
  localGuestRepository;
