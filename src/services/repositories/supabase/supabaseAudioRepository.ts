import type { AudioRepository } from "../types";
import { getSupabaseClient } from "@/services/supabase/client";

/**
 * supabaseAudioRepository — AudioRepository backed by Supabase Storage.
 *
 * Bucket: heyin-audio
 * Path convention: projects/{projectId}/submissions/{submissionId}.{ext}
 *
 * saveAudio returns the Storage PATH (not the public URL).
 * Playback resolves the path to a public URL at runtime via getPublicAudioUrl().
 */

const BUCKET = "heyin-audio";

function requireClient() {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error(
      "Supabase client is not available. Set NEXT_PUBLIC_HEYIN_STORAGE_MODE=cloud and provide credentials."
    );
  }
  return client;
}

export const supabaseAudioRepository: AudioRepository = {
  async saveAudio(blob, pathHint) {
    const client = requireClient();
    const path = pathHint ?? `uploads/${crypto.randomUUID()}.webm`;

    const { error } = await client.storage
      .from(BUCKET)
      .upload(path, blob, {
        contentType: blob.type || "audio/webm",
        upsert: false,
      });

    if (error) {
      throw new Error(
        `Failed to upload audio to ${BUCKET}/${path}: ${error.message}. ` +
        `Blob type=${blob.type || "unknown"}, size=${blob.size} bytes.`
      );
    }

    // Return the Storage path, not the public URL
    return path;
  },

  async loadAudio(idOrPath) {
    const client = requireClient();

    if (idOrPath.startsWith("http://") || idOrPath.startsWith("https://")) {
      try {
        const res = await fetch(idOrPath);
        if (!res.ok) return null;
        return await res.blob();
      } catch {
        return null;
      }
    }

    try {
      const { data, error } = await client.storage
        .from(BUCKET)
        .download(idOrPath);

      if (error || !data) return null;
      return data;
    } catch {
      return null;
    }
  },

  async deleteAudio(idOrPath) {
    const client = requireClient();

    let path = idOrPath;
    if (path.startsWith("http://") || path.startsWith("https://")) {
      const match = path.match(/\/storage\/v1\/object\/public\/heyin-audio\/(.+)/);
      if (match) path = match[1];
      else return;
    }

    const { error } = await client.storage.from(BUCKET).remove([path]);
    if (error) throw new Error(`Failed to delete audio: ${error.message}`);
  },

  async deleteAllAudio() {
    throw new Error("deleteAllAudio is disabled for cloud repositories.");
  },
};
