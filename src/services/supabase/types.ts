/**
 * Supabase database type definitions.
 *
 * These are hand-written placeholder types that mirror our schema.sql.
 * When the database is linked, run:
 *   npx supabase gen types typescript --linked > src/services/supabase/types.ts
 *
 * The auto-generated types will replace this entire file.
 */

// ============================================================================
// Database interface — gives the Supabase client table name → Row mapping
// ============================================================================

export interface Database {
  public: {
    Tables: {
      projects: {
        Row: ProjectRow;
        Insert: ProjectInsert;
        Update: ProjectUpdate;
      };
      lyric_lines: {
        Row: LyricLineRow;
        Insert: LyricLineInsert;
        Update: LyricLineUpdate;
      };
      voice_slots: {
        Row: VoiceSlotRow;
        Insert: VoiceSlotInsert;
        Update: VoiceSlotUpdate;
      };
      voice_submissions: {
        Row: VoiceSubmissionRow;
        Insert: VoiceSubmissionInsert;
        Update: VoiceSubmissionUpdate;
      };
      works: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      work_versions: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
    };
  };
}

// ============================================================================
// Row types (snake_case, matching schema.sql column names)
// ============================================================================

export interface ProjectRow {
  id: string;
  share_id: string;
  title: string;
  song_name: string;
  slots_per_line: number;
  status: string;
  created_at: string;
  updated_at: string;
}
export type ProjectInsert = Partial<ProjectRow>;
export type ProjectUpdate = Partial<ProjectRow>;

export interface LyricLineRow {
  id: string;
  project_id: string;
  line_index: number;
  text: string;
}
export type LyricLineInsert = Partial<LyricLineRow>;
export type LyricLineUpdate = Partial<LyricLineRow>;

export interface VoiceSlotRow {
  id: string;
  project_id: string;
  line_id: string;
  line_index: number;
  slot_index: number;
  lyric_text: string;
  status: string;
  claimed_by: string | null;
  claimed_at: string | null;
  created_at: string;
  updated_at: string;
}
export type VoiceSlotInsert = Partial<VoiceSlotRow>;
export type VoiceSlotUpdate = Partial<VoiceSlotRow>;

export interface VoiceSubmissionRow {
  id: string;
  project_id: string;
  slot_id: string;
  guest_id: string | null;
  nickname: string;
  province: string | null;
  audio_path: string;
  duration: number;
  created_at: string;
}
export type VoiceSubmissionInsert = Partial<VoiceSubmissionRow>;
export type VoiceSubmissionUpdate = Partial<VoiceSubmissionRow>;
