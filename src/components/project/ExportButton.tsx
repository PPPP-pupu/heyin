"use client";

import Link from "next/link";
import type { ExportStatus } from "@/features/export/exportState";

interface ExportButtonProps {
  status: ExportStatus;
  audioUrl: string | null;
  workId?: string | null;
  onExport: () => void;
  disabled?: boolean;
}

export default function ExportButton({
  status,
  audioUrl,
  workId,
  onExport,
  disabled = false,
}: ExportButtonProps) {
  const { state, progress, error } = status;

  // Idle
  if (state === "idle") {
    return (
      <button
        type="button"
        onClick={onExport}
        disabled={disabled}
        className="flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-600 active:bg-emerald-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 1a.5.5 0 0 1 .5.5v9.793l2.146-2.147a.5.5 0 0 1 .708.708l-3 3a.5.5 0 0 1-.708 0l-3-3a.5.5 0 1 1 .708-.708L7.5 11.293V1.5A.5.5 0 0 1 8 1z"/>
          <path d="M2 11.5a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1h-2a.5.5 0 0 1-.5-.5zm-1 2a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1v-1z"/>
        </svg>
        生成合唱
      </button>
    );
  }

  // Loading / Mixing
  if (state === "loading" || state === "mixing") {
    const stageLabel = state === "loading" ? "加载声音" : state === "mixing" ? "混合合唱" : "生成音频";
    const pct = progress ? Math.round(progress.progress * 100) : 0;

    return (
      <button
        type="button"
        disabled
        className="flex flex-col gap-1 rounded-xl bg-emerald-100 px-5 py-2.5 text-sm font-semibold text-emerald-700 cursor-wait w-full"
      >
        <span>{stageLabel}...</span>
        <div className="h-1.5 overflow-hidden rounded-full bg-emerald-200">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-xs text-emerald-500">{pct}%</span>
      </button>
    );
  }

  // Ready
  if (state === "ready" && audioUrl) {
    return (
      <div className="flex flex-col gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
        <p className="text-sm font-semibold text-emerald-700">合唱已生成！</p>
        <audio controls src={audioUrl} className="w-full" style={{ height: 36 }} />
        <div className="flex gap-2">
          <a
            href={audioUrl}
            download="chorus.wav"
            className="flex-1 rounded-lg bg-emerald-500 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-emerald-600 transition-colors"
          >
            下载 WAV
          </a>
          {workId && (
            <Link
              href={`/work/${workId}`}
              className="flex-1 rounded-lg border border-emerald-300 px-4 py-2 text-center text-sm font-semibold text-emerald-600 hover:bg-emerald-100 transition-colors"
            >
              查看作品
            </Link>
          )}
        </div>
        <button
          type="button"
          onClick={onExport}
          className="rounded-lg border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-600 hover:bg-emerald-100 transition-colors"
        >
          重新生成
        </button>
      </div>
    );
  }

  // Error
  if (state === "error") {
    return (
      <div className="flex flex-col gap-2 rounded-xl border border-red-200 bg-red-50 p-4">
        <p className="text-sm font-semibold text-red-600">生成失败</p>
        {error && <p className="text-xs text-red-500">{error}</p>}
        <p className="text-xs text-red-400">
          请确认录音都能正常播放后再试。
        </p>
        <button
          type="button"
          onClick={onExport}
          className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return null;
}
