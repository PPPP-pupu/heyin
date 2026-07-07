/**
 * Repository layer — unified data access for local and cloud storage.
 *
 * Layer: Storage Layer (⬛)
 *
 * Resolution logic:
 *
 *   STORAGE_MODE=local  → local repos (localStorage + IndexedDB)
 *   STORAGE_MODE=cloud + PROVIDER=supabase → Supabase repos
 *   STORAGE_MODE=cloud + PROVIDER=tencent  → Tencent project + unsupported audio/work
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
import { tencentProjectRepository } from "./tencent/tencentProjectRepository";
import {
  unsupportedTencentAudioRepository,
  unsupportedTencentWorkRepository,
} from "./tencent/unsupportedTencentRepositories";

// Re-export
export {
  supabaseProjectRepository,
  supabaseAudioRepository,
  tencentProjectRepository,
};

// --- Repository resolution ---

function resolveProjectRepository(): ProjectRepository {
  if (!isCloudRepositoryMode()) return localProjectRepository;
  if (isTencentProvider()) return tencentProjectRepository;
  return supabaseProjectRepository;
}

function resolveAudioRepository(): AudioRepository {
  if (!isCloudRepositoryMode()) return localAudioRepository;
  if (isTencentProvider()) return unsupportedTencentAudioRepository;
  return supabaseAudioRepository;
}

function resolveWorkRepository(): WorkRepository {
  if (!isCloudRepositoryMode()) return localWorkRepository;
  if (isTencentProvider()) return unsupportedTencentWorkRepository;
  return localWorkRepository; // TODO: Commit 9 supabaseWorkRepository
}

function resolveGuestRepository(): GuestRepository {
  if (!isCloudRepositoryMode()) return localGuestRepository;
  // Tencent cloud mode: keep local guest profile for now
  return localGuestRepository;
}

export const projectRepository: ProjectRepository = resolveProjectRepository();
export const audioRepository: AudioRepository = resolveAudioRepository();
export const workRepository: WorkRepository = resolveWorkRepository();
export const guestRepository: GuestRepository = resolveGuestRepository();
