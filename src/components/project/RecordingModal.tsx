"use client";

import { useState, useEffect } from "react";
import type { VoiceSlot } from "@/types/project";
import type { UseRecorderReturn } from "@/features/recording/useRecorder";

/**
 * RecordingModal — pure UI component.
 *
 * Mobile-safe layout:
 * - Dynamic viewport height (100dvh)
 * - Safe area bottom padding for iOS home indicator
 * - Sticky action footer always visible
 * - Backdrop close disabled during recording and submitting
 * - Scrollable content for recorded state
 *
 * Layer: UI Layer (🟦)
 */

interface RecordingModalProps {
  slot: VoiceSlot;
  recorder: UseRecorderReturn;
  onClose: () => void;
  onSubmit: (data: { nickname: string; province: string }) => void | Promise<void>;
  defaultNickname?: string;
  defaultProvince?: string;
}

export default function RecordingModal({
  slot,
  recorder,
  onClose,
  onSubmit,
  defaultNickname,
  defaultProvince,
}: RecordingModalProps) {
  const [nickname, setNickname] = useState(defaultNickname ?? "");
  const [province, setProvince] = useState(defaultProvince ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => { setNickname(defaultNickname ?? ""); }, [defaultNickname]);
  useEffect(() => { setProvince(defaultProvince ?? ""); }, [defaultProvince]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const { state, elapsedMs, audioBlobUrl, error } = recorder;

  // Disable backdrop close during recording + submitting
  const isLocked = state === "recording" || isSubmitting;

  function handleBackdropClick() {
    if (isLocked) return;
    onClose();
  }

  function formatTime(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  }

  async function handleSubmit() {
    if (!nickname.trim() || isSubmitting) return;
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      await onSubmit({ nickname: nickname.trim(), province: province.trim() });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed. Please try again.";
      const short = msg.length > 120 ? msg.slice(0, 120) + "..." : msg;
      setSubmitError(short);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      {/* Backdrop — disabled during recording */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={handleBackdropClick}
      />

      {/* Modal card — mobile bottom sheet, desktop centered */}
      <div
        className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-w-lg flex-col animate-slide-up rounded-t-2xl bg-white shadow-xl sm:inset-x-auto sm:bottom-auto sm:top-1/2 sm:w-full sm:max-w-sm sm:-translate-y-1/2 sm:rounded-2xl"
        style={{ maxHeight: "calc(100dvh - 24px)", paddingBottom: "calc(1rem + env(safe-area-inset-bottom, 0px))" }}
      >
        {/* Scrollable content */}
        <div className="overflow-y-auto px-6 pt-6">
          {/* Lyric text */}
          <div className="mb-4 text-center">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              You are recording
            </p>
            <p className="mt-1.5 text-base font-semibold text-gray-900 leading-relaxed">
              {slot.lyricText}
            </p>
          </div>

          {/* Error banner */}
          {error && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* === IDLE STATE === */}
          {state === "idle" && (
            <div className="mb-4 flex flex-col items-center gap-3 rounded-2xl bg-gray-50 py-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                  <path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                  <path d="M19 10v1a7 7 0 0 1-14 0v-1" />
                  <line x1="12" x2="12" y1="19" y2="22" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-500">Ready to record</p>
            </div>
          )}

          {/* === RECORDING STATE === */}
          {state === "recording" && (
            <div className="mb-4 flex flex-col items-center gap-3 rounded-2xl bg-red-50 py-6">
              <div className="flex items-center gap-2">
                <span className="relative flex h-4 w-4">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex h-4 w-4 rounded-full bg-red-500" />
                </span>
                <span className="text-sm font-semibold text-red-600">Recording</span>
              </div>
              <p className="text-4xl font-mono font-bold text-gray-900 tabular-nums">
                {formatTime(elapsedMs)}
              </p>
            </div>
          )}

          {/* === RECORDED STATE === */}
          {state === "recorded" && (
            <div className="mb-4 flex flex-col gap-3">
              {submitError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {submitError}
                </div>
              )}

              {audioBlobUrl && (
                <div className="rounded-2xl bg-gray-50 p-3">
                  <p className="mb-1.5 text-xs font-medium text-gray-500">Preview</p>
                  <audio controls src={audioBlobUrl} className="w-full" style={{ height: 36 }} />
                </div>
              )}

              <div>
                <label htmlFor="nickname" className="text-sm font-medium text-gray-700">Your Nickname</label>
                <input id="nickname" type="text"
                  className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                  placeholder="e.g. 小雨" value={nickname} onChange={(e) => setNickname(e.target.value)} maxLength={30} />
              </div>

              <div>
                <label htmlFor="province" className="text-sm font-medium text-gray-700">Province (optional)</label>
                <input id="province" type="text"
                  className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                  placeholder="e.g. 浙江" value={province} onChange={(e) => setProvince(e.target.value)} maxLength={30} />
              </div>
            </div>
          )}
        </div>

        {/* Sticky action footer — always at bottom */}
        <div className="shrink-0 border-t border-gray-100 px-6 py-4">
          {state === "idle" && (
            <div className="flex gap-3">
              <button type="button" onClick={onClose}
                className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50 active:bg-gray-100 transition-colors">
                Cancel
              </button>
              <button type="button" onClick={() => recorder.startRecording()}
                className="flex-1 rounded-xl bg-indigo-500 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-600 active:bg-indigo-700 transition-colors">
                Start Recording
              </button>
            </div>
          )}

          {state === "recording" && (
            <button type="button" onClick={() => recorder.stopRecording()}
              className="w-full rounded-xl bg-red-500 px-4 py-3.5 text-base font-semibold text-white shadow-sm hover:bg-red-600 active:bg-red-700 transition-colors">
              Stop Recording
            </button>
          )}

          {state === "recorded" && (
            <div className="flex gap-3">
              <button type="button" onClick={() => recorder.resetRecording()}
                className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50 active:bg-gray-100 transition-colors">
                Re-record
              </button>
              <button type="button" onClick={handleSubmit}
                disabled={!nickname.trim() || isSubmitting}
                className="flex-1 rounded-xl bg-indigo-500 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-600 active:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                {isSubmitting ? "Saving..." : "Submit"}
              </button>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-up {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-up { animation: slide-up 0.25s ease-out; }
      `}</style>
    </>
  );
}
