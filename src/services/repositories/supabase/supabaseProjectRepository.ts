import type { ChorusProject } from "@/types/project";
import type { ProjectRepository } from "../types";
import { mapSupabaseProjectToChorusProject } from "@/services/supabase/mappers/projectMapper";
import { createShareId } from "@/services/supabase/mappers/projectMapper";
import { isClaimExpired } from "@/features/voice-slot/claimSlot";
import { getSupabaseClient } from "@/services/supabase/client";

// ============================================================================
// Client wrapper
//
// The Supabase client requires auto-generated Database types (from
// `supabase gen types`) for full type inference on table names and columns.
// Until then, we use a raw client wrapper that returns the underlying
// SupabaseClient<GenericSchema> so that .from("projects") resolves to
// a usable query builder instead of `never`.
//
// This file will be simplified once auto-generated types are available.
// ============================================================================

function requireClient() {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error(
      "Supabase client is not available. Set NEXT_PUBLIC_HEYIN_STORAGE_MODE=supabase and provide credentials."
    );
  }
  return client;
}

// Raw accessor — bypasses the typed Database generic so table names resolve.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db() { return requireClient() as any; }

// ============================================================================
// Query helpers
// ============================================================================

async function loadFullProject(projectId: string): Promise<ChorusProject | null> {
  const d = db();

  const [projRes, linesRes, slotsRes, subsRes] = await Promise.all([
    d.from("projects").select("*").eq("id", projectId).single(),
    d.from("lyric_lines").select("*").eq("project_id", projectId).order("line_index"),
    d.from("voice_slots").select("*").eq("project_id", projectId),
    d.from("voice_submissions").select("*").eq("project_id", projectId),
  ]);

  if (projRes.error || !projRes.data) return null;

  return mapSupabaseProjectToChorusProject({
    project: projRes.data,
    lyricLines: linesRes.data ?? [],
    voiceSlots: slotsRes.data ?? [],
    voiceSubmissions: subsRes.data ?? [],
  });
}

// ============================================================================
// Repository Implementation
// ============================================================================

export const supabaseProjectRepository: ProjectRepository = {
  async saveProject(project) {
    const d = db();
    const shareId = project.shareId ?? createShareId();

    // Detect whether this is a local-prefixed ID (e.g. proj-xxx) or a real UUID.
    // Supabase UUID columns reject non-UUID strings.
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    let projectId = project.id;

    if (isUuid.test(project.id)) {
      // Existing Supabase project — upsert by id
      const { error: projErr } = await d.from("projects").upsert({
        id: project.id,
        share_id: shareId,
        title: project.title,
        song_name: project.songName,
        slots_per_line: project.slotsPerLine,
        status: project.status,
        created_at: project.createdAt,
        updated_at: project.updatedAt,
      });
      if (projErr) throw new Error(`Failed to save project: ${projErr.message}`);

      // TODO: Full upsert sync — delete+reinsert vs merge for existing projects.
      // For now, existing project updates only touch the projects table row.
      // Lyric lines and voice slots are only fully synced on initial create.

      return loadFullProject(projectId).then((p) => {
        if (!p) throw new Error("Project not found after save.");
        return p;
      });
    }

    // Cloud create: let Supabase generate UUIDs for all rows.
    // Insert project WITHOUT the local prefixed id.
    const { data: newProj, error: projErr } = await d
      .from("projects")
      .insert({
        share_id: shareId,
        title: project.title,
        song_name: project.songName,
        slots_per_line: project.slotsPerLine,
        status: project.status,
        created_at: project.createdAt,
        updated_at: project.updatedAt,
      })
      .select("id")
      .single();

    if (projErr || !newProj) {
      throw new Error(`Failed to create project: ${projErr?.message ?? "Unknown error"}`);
    }

    projectId = newProj.id;

    // Insert lyric lines — let Supabase generate ids, track the mapping
    // by line_index so we can wire voice_slots to the correct line.
    const lineIndexToNewId = new Map<number, string>();

    for (const line of project.lyricLines) {
      const { data: newLine, error: lineErr } = await d
        .from("lyric_lines")
        .insert({
          project_id: projectId,
          line_index: line.index,
          text: line.text,
        })
        .select("id")
        .single();

      if (lineErr || !newLine) {
        throw new Error(`Failed to insert lyric line: ${lineErr?.message ?? "Unknown error"}`);
      }
      lineIndexToNewId.set(line.index, newLine.id);
    }

    // Insert voice slots with generated project_id and line_ids
    if (project.voiceSlots.length > 0) {
      const slotRows = project.voiceSlots.map((s) => ({
        project_id: projectId,
        line_id: lineIndexToNewId.get(s.lineIndex) ?? s.lineId,
        line_index: s.lineIndex,
        slot_index: s.slotIndex,
        lyric_text: s.lyricText,
        status: s.status,
        claimed_by: s.claimedBy ?? null,
        claimed_at: s.claimedAt ?? null,
        updated_at: new Date().toISOString(),
      }));

      const { error: slotsErr } = await d.from("voice_slots").insert(slotRows);
      if (slotsErr) throw new Error(`Failed to insert voice slots: ${slotsErr.message}`);
    }

    // Reload the full project with real UUIDs
    const saved = await loadFullProject(projectId);
    if (!saved) throw new Error("Project not found after create.");
    return saved;
  },

  async loadProject(projectId) {
    return loadFullProject(projectId);
  },

  async loadProjectByShareId(shareId) {
    const d = db();
    const { data, error } = await d
      .from("projects")
      .select("id")
      .eq("share_id", shareId)
      .single();

    if (error || !data) return null;
    return loadFullProject(data.id);
  },

  async loadAllProjects() {
    const d = db();
    const { data, error } = await d
      .from("projects")
      .select("id")
      .order("updated_at", { ascending: false });

    if (error) throw new Error(`Failed to load projects: ${error.message}`);

    // TODO: Optimize — load all projects in a single batch query
    // rather than N+1 individual loadFullProject calls.
    const results: ChorusProject[] = [];
    for (const row of data ?? []) {
      const project = await loadFullProject(row.id);
      if (project) results.push(project);
    }
    return results;
  },

  async deleteProject(projectId) {
    const d = db();
    const { error } = await d.from("projects").delete().eq("id", projectId);
    if (error) throw new Error(`Failed to delete project: ${error.message}`);
  },

  async deleteAllProjects() {
    throw new Error("deleteAllProjects is disabled for cloud repositories.");
  },

  async setProjectStatus(project, status) {
    const d = db();
    const now = new Date().toISOString();

    const { error } = await d
      .from("projects")
      .update({ status, updated_at: now })
      .eq("id", project.id);

    if (error) throw new Error(`Failed to update project status: ${error.message}`);

    const reloaded = await loadFullProject(project.id);
    if (!reloaded) throw new Error("Project not found after status update.");
    return reloaded;
  },

  async submitRecording(project, slotId, submission) {
    const d = db();

    // TODO (Commit 7): actual cloud audio upload via AudioRepository.

    const { error: subErr } = await d.from("voice_submissions").insert({
      id: submission.id,
      project_id: project.id,
      slot_id: slotId,
      guest_id: submission.guestId ?? null,
      nickname: submission.nickname,
      province: submission.province ?? null,
      audio_path: submission.audioId,
      duration: submission.duration,
      created_at: submission.createdAt,
    });
    if (subErr) throw new Error(`Failed to save submission: ${subErr.message}`);

    const { error: slotErr } = await d
      .from("voice_slots")
      .update({
        status: "filled",
        claimed_by: null,
        claimed_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", slotId);

    if (slotErr) throw new Error(`Failed to update slot: ${slotErr.message}`);

    const p = await loadFullProject(project.id);
    if (!p) throw new Error("Project not found after submit.");
    return p;
  },

  async deleteSubmission(project, slotId) {
    const d = db();

    const { error: delErr } = await d
      .from("voice_submissions")
      .delete()
      .eq("slot_id", slotId);

    if (delErr) throw new Error(`Failed to delete submission: ${delErr.message}`);

    const { error: slotErr } = await d
      .from("voice_slots")
      .update({
        status: "empty",
        claimed_by: null,
        claimed_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", slotId);

    if (slotErr) throw new Error(`Failed to reset slot: ${slotErr.message}`);

    const p = await loadFullProject(project.id);
    if (!p) throw new Error("Project not found after delete.");
    return p;
  },

  async claimSlot(project, slotId, guestId) {
    const d = db();
    const now = new Date().toISOString();

    const { error, count } = await d
      .from("voice_slots")
      .update({
        status: "claimed",
        claimed_by: guestId,
        claimed_at: now,
        updated_at: now,
      })
      .eq("id", slotId)
      .eq("status", "empty");

    if (error) throw new Error(`Failed to claim slot: ${error.message}`);
    if (count === 0) return null;

    return loadFullProject(project.id);
  },

  async releaseClaim(project, slotId) {
    const d = db();
    const now = new Date().toISOString();

    const { error, count } = await d
      .from("voice_slots")
      .update({
        status: "empty",
        claimed_by: null,
        claimed_at: null,
        updated_at: now,
      })
      .eq("id", slotId)
      .eq("status", "claimed");

    if (error) throw new Error(`Failed to release claim: ${error.message}`);
    if (count === 0) return null;

    return loadFullProject(project.id);
  },

  async cleanupStaleClaims(project, maxAgeMs) {
    const expiredSlots = project.voiceSlots.filter((s) =>
      isClaimExpired(s, maxAgeMs)
    );

    if (expiredSlots.length === 0) return project;

    const d = db();
    const now = new Date().toISOString();

    for (const slot of expiredSlots) {
      await d
        .from("voice_slots")
        .update({
          status: "empty",
          claimed_by: null,
          claimed_at: null,
          updated_at: now,
        })
        .eq("id", slot.id)
        .eq("status", "claimed");
    }

    const p = await loadFullProject(project.id);
    return p ?? project;
  },
};
