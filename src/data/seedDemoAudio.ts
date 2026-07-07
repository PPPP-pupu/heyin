import { loadAudio } from "@/services/storage/audioStorage";

/**
 * Generates a simple test tone (sine wave) as a WAV Blob.
 */
function generateTone(
  frequencyHz: number,
  durationSec: number,
  sampleRate = 44100
): Blob {
  const numSamples = Math.floor(sampleRate * durationSec);
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + numSamples * 2, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, "data");
  view.setUint32(40, numSamples * 2, true);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const envelope = Math.min(t / 0.05, 1, (durationSec - t) / 0.05);
    const sample = Math.sin(2 * Math.PI * frequencyHz * t) * 0.3 * envelope;
    view.setInt16(44 + i * 2, sample * 32767, true);
  }

  return new Blob([buffer], { type: "audio/wav" });
}

function writeString(view: DataView, offset: number, str: string): void {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

/** Check if a demo audio key already exists in IndexedDB. */
async function demoAudioExists(key: string): Promise<boolean> {
  const blob = await loadAudio(key);
  return blob !== null;
}

/**
 * Seeds demo audio into IndexedDB — only if not already present.
 * Checks existence first to avoid re-generating tones on every page visit.
 */
export async function seedDemoAudio(): Promise<void> {
  const demoIds = [
    { id: "demo-voice-1", freq: 392, dur: 4.2 },
    { id: "demo-voice-2", freq: 440, dur: 3.9 },
    { id: "demo-voice-3", freq: 349, dur: 4.5 },
    { id: "demo-voice-4", freq: 523, dur: 4.1 },
    { id: "demo-voice-5", freq: 466, dur: 3.7 },
  ];

  for (const { id, freq, dur } of demoIds) {
    try {
      // Skip if already seeded
      if (await demoAudioExists(id)) continue;

      const blob = generateTone(freq, dur);
      await forceStore(id, blob);
    } catch {
      // IndexedDB not available
    }
  }
}

/** Store a blob under a specific key in IndexedDB. */
async function forceStore(key: string, blob: Blob): Promise<void> {
  return new Promise((resolve) => {
    const request = indexedDB.open("heyin-audio", 1);
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction("blobs", "readwrite");
      tx.objectStore("blobs").put(blob, key);
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = () => { db.close(); resolve(); };
    };
    request.onerror = () => resolve();
  });
}
