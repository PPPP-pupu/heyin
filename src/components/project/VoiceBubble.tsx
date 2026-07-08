import type { VoiceSlot } from "@/types/project";

// Fixed waveform bar heights — deterministic, SSR-safe.
const WAVEFORM_BARS = [8, 12, 6, 15, 10, 18, 9, 14, 7, 16, 12, 8, 18, 10, 15, 6, 13, 9, 17, 11];
const WAVEFORM_OPACITY = [0.6, 0.85, 0.45, 0.9, 0.55, 0.95, 0.5, 0.8, 0.4, 0.75, 0.7, 0.5, 0.95, 0.6, 0.85, 0.4, 0.75, 0.55, 0.9, 0.65];

interface VoiceBubbleProps {
  slot: VoiceSlot;
  onSelect?: () => void;
  isSelected?: boolean;
  onPlay?: () => void;
  isPlaying?: boolean;
  isPaused?: boolean;
  onDelete?: () => void;
  /** Called when user wants to re-record their own filled slot. */
  onReRecord?: () => void;
  /** Current guest's UUID — used to show "You are recording..." on claimed slots. */
  currentGuestId?: string;
  /** True if the viewer is the project owner (can manage this slot). */
  isOwner?: boolean;
  /** Called when owner changes mixVolume on a filled slot. */
  onVolumeChange?: (slotId: string, volume: number) => void;
}

export default function VoiceBubble(props: VoiceBubbleProps) {
  const { slot, onSelect, isSelected, onPlay, isPlaying, isPaused, onDelete, onReRecord, currentGuestId, isOwner, onVolumeChange } = props;

  switch (slot.status) {
    // ── Filled: playable with waveform + nickname ──────────
    case "filled": {
      if (!slot.submission) return renderEmpty(isSelected, onSelect);
      const sub = slot.submission;
      const isSelf = currentGuestId != null && sub.guestId === currentGuestId;
      const isCreatorOnly = sub.visibility === "creatorOnly";
      const canPlay = isOwner || isSelf || !isCreatorOnly;

      const playingClasses = isPlaying ? "ring-2 ring-indigo-400 shadow-md shadow-indigo-200 scale-[1.01]" : "";
      const pausedClasses = isPaused ? "ring-2 ring-amber-300 shadow-md shadow-amber-100" : "";
      return (
        <div className="group relative">
          <div
            onClick={canPlay ? onPlay : undefined}
            className={`flex items-center gap-3 rounded-xl px-4 py-3 border transition-all duration-200 ${
              canPlay
                ? `bg-indigo-50 border-indigo-100 cursor-pointer hover:bg-indigo-100 active:scale-[0.98] ${playingClasses} ${pausedClasses}`
                : "bg-gray-50 border-gray-200 cursor-default"
            }`}
          >
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
              canPlay ? "bg-indigo-200 text-indigo-600" : "bg-gray-200 text-gray-500"
            }`}>
              {sub.nickname.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-medium text-gray-900">{sub.nickname}</span>
                {sub.province && <span className="shrink-0 text-xs text-gray-400">{sub.province}</span>}
                {!canPlay && <span className="shrink-0 text-xs text-gray-400">· 仅创建者可试听</span>}
              </div>
              {canPlay ? (
                <div className="mt-1.5 flex h-5 items-center gap-px">
                  {WAVEFORM_BARS.map((h, i) => (
                    <div key={i} className="w-0.5 rounded-full bg-indigo-400" style={{ height: `${h}px`, opacity: WAVEFORM_OPACITY[i] }} />
                  ))}
                </div>
              ) : (
                <p className="mt-1 text-xs text-gray-400">已提交</p>
              )}
            </div>
            {canPlay && (
              <div className="flex shrink-0 items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-200 text-indigo-600">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M5 3.5v9l7-4.5-7-4.5z" /></svg>
                </div>
                <span className="text-xs text-gray-400">{sub.duration.toFixed(1)}s</span>
              </div>
            )}
          </div>

          {/* Owner volume slider */}
          {isOwner && onVolumeChange && (
            <div className="mt-1 flex items-center gap-2 px-1">
              <span className="text-xs text-gray-400 w-6 text-right">
                {Math.round((sub.mixVolume ?? 1) * 100)}%
              </span>
              <input
                type="range"
                min="0"
                max="150"
                value={Math.round((sub.mixVolume ?? 1) * 100)}
                onChange={(e) => onVolumeChange(slot.id, Number(e.target.value) / 100)}
                className="h-1 flex-1 accent-indigo-500"
              />
              <span className="text-xs text-gray-400">音量</span>
            </div>
          )}

          {onReRecord && (
            <button type="button" onClick={(e) => { e.stopPropagation(); onReRecord(); }}
              className="mt-1 w-full rounded-lg border border-indigo-200 bg-white px-3 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 transition-colors">
              重新录制
            </button>
          )}
          {onDelete && (
            <button type="button" onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="absolute -top-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-white border border-gray-200 text-gray-400 hover:bg-red-50 hover:text-red-500 hover:border-red-200 opacity-0 group-hover:opacity-100 transition-all shadow-sm"
              aria-label="删除录音">
              <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 4l8 8M12 4l-8 8" /></svg>
            </button>
          )}
        </div>
      );
    }

    // ── Claimed: locked — shows who is recording ───────────
    case "claimed": {
      const isSelf = currentGuestId != null && slot.claimedBy === currentGuestId;
      const label = isSelf ? "已为你保留" : "有人正在录制...";
      const subLabel = isSelf ? "完成录音或关闭即可释放" : "试试其他空位";
      return (
        <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-3 cursor-default">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-sm text-amber-600">
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-amber-500" />
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <span className={`text-sm font-medium ${isSelf ? "text-amber-800" : "text-amber-700"}`}>{label}</span>
            <p className="text-xs text-amber-500 mt-0.5">{subLabel}</p>
          </div>
        </div>
      );
    }

    // ── Empty: clickable and selectable ────────────────────
    case "empty":
    default:
      return renderEmpty(isSelected, onSelect);
  }
}

/** Pure render function for the empty slot UI. */
function renderEmpty(isSelected?: boolean, onSelect?: () => void) {
  const selectedClasses = isSelected
    ? "ring-2 ring-indigo-400 scale-[1.02] shadow-md border-indigo-300 border-solid"
    : "border-dashed border-gray-200";

  return (
    <div
      onClick={onSelect}
      className={`flex items-center gap-3 rounded-xl border px-4 py-3 cursor-pointer transition-all duration-200 hover:border-indigo-200 hover:bg-indigo-50/30 active:scale-[0.98] ${selectedClasses}`}
    >
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm ${isSelected ? "bg-indigo-100 text-indigo-500" : "bg-gray-50 text-gray-300"}`}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
      </div>
      <span className={`text-sm ${isSelected ? "text-indigo-600 font-medium" : "text-gray-400"}`}>
        {isSelected ? "已选择，点击录制" : "点击录制这一句"}
      </span>
    </div>
  );
}
