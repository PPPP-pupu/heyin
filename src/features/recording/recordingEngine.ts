/**
 * recordingEngine — pure JS wrapper around MediaRecorder API.
 *
 * Responsibilities:
 * - Request microphone access via getUserMedia
 * - Create and manage MediaRecorder instance
 * - Start / stop recording and return audio Blob
 * - Cleanup media tracks
 *
 * Layer: Audio Runtime (pure capability, no React, no state, no project)
 */

export type RecorderEngineState = "idle" | "recording" | "recorded";

export interface RecordingEngine {
  /** Request microphone and start recording. Throws on permission denied. */
  start(): Promise<void>;
  /** Stop recording and return the audio Blob. */
  stop(): Promise<Blob>;
  /** Release microphone and reset internal state. */
  cleanup(): void;
  /** Current engine state. */
  getState(): RecorderEngineState;
}

export function createRecordingEngine(): RecordingEngine {
  let mediaStream: MediaStream | null = null;
  let mediaRecorder: MediaRecorder | null = null;
  let audioChunks: Blob[] = [];
  let state: RecorderEngineState = "idle";
  let stopResolve: ((blob: Blob) => void) | null = null;

  async function start(): Promise<void> {
    if (state !== "idle") {
      throw new Error(`Cannot start recording in state: ${state}`);
    }

    try {
      mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      const error = err as DOMException;
      if (error.name === "NotAllowedError") {
        throw new Error(
          "Microphone access was denied. Please allow microphone access in your browser settings and try again."
        );
      }
      if (error.name === "NotFoundError") {
        throw new Error(
          "No microphone found. Please connect a microphone and try again."
        );
      }
      throw new Error(
        "Could not access microphone. Please check your device settings."
      );
    }

    // Determine supported MIME type
    const mimeType = getSupportedMimeType();

    mediaRecorder = new MediaRecorder(mediaStream, {
      mimeType: mimeType || undefined,
    });

    audioChunks = [];

    mediaRecorder.ondataavailable = (event: BlobEvent) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data);
      }
    };

    mediaRecorder.onerror = () => {
      state = "idle";
      cleanup();
    };

    mediaRecorder.start();
    state = "recording";
  }

  function stop(): Promise<Blob> {
    if (state !== "recording" || !mediaRecorder) {
      return Promise.reject(
        new Error(`Cannot stop recording in state: ${state}`)
      );
    }

    return new Promise<Blob>((resolve) => {
      stopResolve = resolve;

      mediaRecorder!.addEventListener(
        "stop",
        () => {
          const blob = new Blob(audioChunks, {
            type: mediaRecorder!.mimeType || "audio/webm",
          });
          state = "recorded";

          // Release microphone
          if (mediaStream) {
            mediaStream.getTracks().forEach((track) => track.stop());
            mediaStream = null;
          }

          if (stopResolve) {
            stopResolve(blob);
            stopResolve = null;
          }
        },
        { once: true }
      );

      mediaRecorder!.stop();
    });
  }

  function cleanup(): void {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
    }
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
      mediaStream = null;
    }
    mediaRecorder = null;
    audioChunks = [];
    state = "idle";
    stopResolve = null;
  }

  function getState(): RecorderEngineState {
    return state;
  }

  return { start, stop, cleanup, getState };
}

/**
 * Choose the best supported audio MIME type for the current browser.
 */
function getSupportedMimeType(): string | null {
  const types = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/mp4",
  ];
  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  return null; // Browser default
}
