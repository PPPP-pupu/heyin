import type { PlaybackTimeline, TimelineTrack } from "@/features/playback/timelineTypes";
import { loadAudio } from "@/services/storage/audioStorage";
import type { MixResult, MixProgress } from "./mixTypes";

export interface MixOptions {
  onProgress?: (progress: MixProgress) => void;
}

/** Load a blob by audio identifier. Injected for cloud mode support. */
export type LoadAudioBlob = (id: string) => Promise<Blob | null>;

export interface AudioMixerConfig {
  /** Injected blob loader. If not provided, defaults to local IndexedDB loadAudio. */
  loadAudioBlob?: LoadAudioBlob;
}

/**
 * AudioMixer — renders a PlaybackTimeline into a single mixed AudioBuffer.
 *
 * Uses OfflineAudioContext for non-real-time rendering.
 * Supports progress callback for UI feedback during long mixes.
 *
 * In Tencent cloud mode, inject loadAudioBlob = audioRepository.loadAudio
 * to resolve cloud:// fileIDs to playable blobs.
 */
export class AudioMixer {
  private sampleRate = 44100;
  private loadAudioBlob: LoadAudioBlob;

  constructor(config?: AudioMixerConfig) {
    this.loadAudioBlob = config?.loadAudioBlob ?? loadAudio;
  }

  async mix(timeline: PlaybackTimeline, options?: MixOptions): Promise<MixResult> {
    const onProgress = options?.onProgress;

    if (timeline.lines.length === 0) {
      onProgress?.({ stage: "complete", progress: 1 });
      return this.emptyMix();
    }

    // Count total tracks
    const totalTracks = timeline.lines.reduce((sum, l) => sum + l.tracks.length, 0);
    let trackIdx = 0;

    const totalDuration = timeline.totalDuration;
    const ctx = new OfflineAudioContext({
      numberOfChannels: 1,
      sampleRate: this.sampleRate,
      length: Math.ceil(totalDuration * this.sampleRate) + this.sampleRate,
    });

    // Stage 1: Loading blobs via injected loader (or local fallback)
    onProgress?.({ stage: "loading", progress: 0, totalTracks, currentTrack: 0 });

    const loaded: { track: TimelineTrack; blob: Blob }[] = [];
    for (const line of timeline.lines) {
      for (const track of line.tracks) {
        const blob = await this.loadAudioBlob(track.source.id);
        if (blob) loaded.push({ track, blob });
        trackIdx++;
        onProgress?.({
          stage: "loading",
          progress: trackIdx / totalTracks,
          totalTracks,
          currentTrack: trackIdx,
        });
      }
    }

    if (loaded.length === 0) {
      onProgress?.({ stage: "complete", progress: 1 });
      return this.emptyMix();
    }

    // Stage 2: Decoding audio
    onProgress?.({ stage: "decoding", progress: 0, totalTracks: loaded.length, currentTrack: 0 });

    const decoded: { track: TimelineTrack; buffer: AudioBuffer }[] = [];
    for (let i = 0; i < loaded.length; i++) {
      const { track, blob } = loaded[i];
      try {
        const buffer = await this.decodeBlob(blob);
        decoded.push({ track, buffer });
      } catch { /* skip */ }
      onProgress?.({
        stage: "decoding",
        progress: (i + 1) / loaded.length,
        totalTracks: loaded.length,
        currentTrack: i + 1,
      });
    }

    // Stage 3: Scheduling into OfflineAudioContext
    onProgress?.({ stage: "mixing", progress: 0 });

    for (const { track, buffer } of decoded) {
      const line = timeline.lines.find((l) =>
        l.tracks.some((t) => t.trackId === track.trackId)
      );
      if (!line) continue;

      const source = ctx.createBufferSource();
      source.buffer = buffer;

      const gain = ctx.createGain();
      gain.gain.value = track.volume ?? 1;
      source.connect(gain);
      gain.connect(ctx.destination);

      const trackDuration = Math.min(track.duration, buffer.duration);
      source.start(line.startTime, 0, trackDuration);
    }

    onProgress?.({ stage: "mixing", progress: 1 });

    // Stage 4: Rendering
    const audioBuffer = await ctx.startRendering();

    // Stage 5: Encoding (WAV)
    onProgress?.({ stage: "encoding", progress: 0.5 });
    onProgress?.({ stage: "encoding", progress: 1 });
    onProgress?.({ stage: "complete", progress: 1 });

    return { audioBuffer, sampleRate: this.sampleRate, duration: totalDuration };
  }

  private async decodeBlob(blob: Blob): Promise<AudioBuffer> {
    const arrayBuffer = await blob.arrayBuffer();
    const tempCtx = new AudioContext();
    try {
      return await tempCtx.decodeAudioData(arrayBuffer);
    } finally {
      tempCtx.close();
    }
  }

  private emptyMix(): MixResult {
    const buffer = new AudioBuffer({
      numberOfChannels: 1,
      sampleRate: this.sampleRate,
      length: this.sampleRate,
    });
    return { audioBuffer: buffer, sampleRate: this.sampleRate, duration: 1 };
  }
}
