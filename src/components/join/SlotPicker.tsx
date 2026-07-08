import type { VoiceSlot } from "@/types/project";
import LyricLineCard from "@/components/project/LyricLineCard";

interface SlotPickerProps {
  lines: Array<{
    id: string;
    index: number;
    text: string;
  }>;
  slotsByLine: Array<{
    slots: VoiceSlot[];
  }>;
  selectedSlotId: string | null;
  onSlotSelect?: (slot: VoiceSlot) => void | Promise<void>;
  onSlotPlay: (slot: VoiceSlot) => void;
  /** Called when user wants to re-record their own filled slot. */
  onSlotReRecord?: (slot: VoiceSlot) => void;
  onSlotDelete?: (slot: VoiceSlot) => void;
  /** Passed through to VoiceBubble for "You are recording..." on claimed slots. */
  currentGuestId?: string;
}

/**
 * SlotPicker — renders lyric lines with voice slots for the join flow.
 *
 * Layer: UI Layer (🟦)
 *
 * Wraps LyricLineCard for each line. In the join context:
 * - "empty" slots show "+" button → triggers claim + recording
 * - "claimed" slots show who is recording (non-interactive)
 * - "filled" slots show the submission with playback
 */
export default function SlotPicker({
  lines,
  slotsByLine,
  selectedSlotId,
  onSlotSelect,
  onSlotPlay,
  onSlotReRecord,
  onSlotDelete,
  currentGuestId,
}: SlotPickerProps) {
  return (
    <div className="px-4">
      <p className="mt-4 mb-3 text-sm font-medium text-gray-600">
        选择一个空位，录下你的声音：
      </p>

      <div className="flex flex-col gap-4 pb-10">
        {lines.map((line, i) => (
          <LyricLineCard
            key={line.id}
            index={line.index}
            text={line.text}
            slots={slotsByLine[i]?.slots ?? []}
            selectedSlotId={selectedSlotId}
            onSlotSelect={onSlotSelect}
            onSlotPlay={onSlotPlay}
            onSlotReRecord={onSlotReRecord}
            onSlotDelete={onSlotDelete}
            currentGuestId={currentGuestId}
          />
        ))}
      </div>
    </div>
  );
}
