import { loadAudio } from "@/services/storage/audioStorage";

/**
 * Play audio from IndexedDB by audioId.
 * Loads blob → creates object URL → plays → cleans up.
 */
export async function playAudioId(audioId: string): Promise<void> {
  try {
    const blob = await loadAudio(audioId);
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    await audio.play().catch(() => {});
    audio.onended = () => URL.revokeObjectURL(url);
  } catch {
    // Audio not found or unsupported
  }
}
