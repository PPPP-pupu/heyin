import type { VoiceSlot } from "@/types/project";
import VoiceBubble from "./VoiceBubble";

interface LyricLineCardProps {
  index: number;
  text: string;
  slots: VoiceSlot[];
  selectedSlotId?: string | null;
  onSlotSelect?: (slot: VoiceSlot) => void;
  onSlotPlay?: (slot: VoiceSlot) => void;
  onSlotDelete?: (slot: VoiceSlot) => void;
  isActive?: boolean;
  isPaused?: boolean;
  /** Passed through to VoiceBubble for "You are recording..." on claimed slots. */
  currentGuestId?: string;
  /** True if viewer is project owner (shows volume slider, can play all). */
  isOwner?: boolean;
  /** Called when owner changes mixVolume on a filled slot. */
  onVolumeChange?: (slotId: string, volume: number) => void;
  /** Called when user wants to re-record their own filled slot. */
  onSlotReRecord?: (slot: VoiceSlot) => void;
}

export default function LyricLineCard({
  index,
  text,
  slots,
  selectedSlotId,
  onSlotSelect,
  onSlotPlay,
  onSlotDelete,
  isActive = false,
  isPaused = false,
  currentGuestId,
  isOwner,
  onVolumeChange,
  onSlotReRecord,
}: LyricLineCardProps) {
  const filledCount = slots.filter((s) => s.status === "filled").length;

  const activeClasses = isActive
    ? "ring-2 ring-indigo-300 bg-indigo-50/50 shadow-md"
    : "";

  return (
    <div className={`rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-all duration-300 ${activeClasses}`}>
      {/* Lyric text header */}
      <div className="mb-3 flex items-baseline gap-3">
        {/* Pulse indicator when active */}
        {isActive && (
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-500" />
          </span>
        )}
        <span className="shrink-0 text-xs font-medium text-gray-400">
          {String(index + 1).padStart(2, "0")}
        </span>
        <p className={`flex-1 text-base font-medium ${isActive ? "text-indigo-700" : "text-gray-800"}`}>{text}</p>
        <span className="shrink-0 text-xs text-gray-400">
          {filledCount}/{slots.length}
        </span>
      </div>
      {/* Voice slots */}
      <div className="flex flex-col gap-2">
        {slots.map((slot) => (
          <VoiceBubble
            key={slot.id}
            slot={slot}
            isSelected={slot.id === selectedSlotId}
            onSelect={
              slot.status === "empty" && onSlotSelect
                ? () => onSlotSelect(slot)
                : undefined
            }
            onPlay={
              slot.status === "filled" && onSlotPlay
                ? () => onSlotPlay(slot)
                : undefined
            }
            isPlaying={isActive && !isPaused && slot.status === "filled"}
            isPaused={isPaused && slot.status === "filled"}
            onDelete={
              slot.status === "filled" && onSlotDelete
                ? () => onSlotDelete(slot)
                : undefined
            }
            currentGuestId={currentGuestId}
            isOwner={isOwner}
            onVolumeChange={onVolumeChange}
            onReRecord={
              slot.status === "filled" && onSlotReRecord
                ? () => onSlotReRecord(slot)
                : undefined
            }
          />
        ))}
      </div>
    </div>
  );
}
