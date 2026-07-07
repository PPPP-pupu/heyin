import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

/**
 * Supabase client — singleton factory.
 *
 * Layer: Storage Layer (⬛)
 *
 * Storage mode: "local" or "cloud"
 * - "local" → app uses localStorage + IndexedDB (current default, v0.6).
 * - "cloud" → app uses Supabase for project + audio storage (Phase 6+).
 *
 * The client is only created when NEXT_PUBLIC_HEYIN_STORAGE_MODE === "cloud".
 * When in "local" mode, getSupabaseClient() returns null — all existing
 * local-mode code paths remain unchanged.
 */

let supabaseClient: SupabaseClient<Database> | null = null;
let initAttempted = false;

export function getSupabaseClient(): SupabaseClient<Database> | null {
  if (initAttempted) return supabaseClient;
  initAttempted = true;

  const mode = process.env.NEXT_PUBLIC_HEYIN_STORAGE_MODE;
  if (mode !== "cloud") return null;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.warn(
      "[Heyin] NEXT_PUBLIC_HEYIN_STORAGE_MODE=supabase but Supabase credentials are missing. Falling back to local mode."
    );
    return null;
  }

  supabaseClient = createClient<Database>(url, key);
  return supabaseClient;
}

/** Check whether the app is running in cloud storage mode. */
export function isCloudMode(): boolean {
  return process.env.NEXT_PUBLIC_HEYIN_STORAGE_MODE === "cloud";
}
