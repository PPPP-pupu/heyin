interface WorkProgressProps {
  filledSlotCount: number;
  totalSlotCount: number;
  lyricLineCount: number;
}

export default function WorkProgress({
  filledSlotCount,
  totalSlotCount,
  lyricLineCount,
}: WorkProgressProps) {
  const pct = totalSlotCount > 0 ? Math.round((filledSlotCount / totalSlotCount) * 100) : 0;

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4">
      <h3 className="text-sm font-semibold text-gray-700">完成度</h3>

      {/* Progress bar */}
      <div className="mt-3">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{filledSlotCount} of {totalSlotCount} slots filled</span>
          <span className="font-medium text-indigo-600">{pct}%</span>
        </div>
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-indigo-500 transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Lyric lines visualization */}
      <div className="mt-4">
        <p className="text-xs text-gray-500">
          {lyricLineCount} lyric lines
        </p>
        <div className="mt-1.5 flex gap-1">
          {Array.from({ length: lyricLineCount }).map((_, i) => {
            // Approximate: earlier lines more likely to be filled
            const lineFill = i < Math.ceil((filledSlotCount / totalSlotCount) * lyricLineCount)
              ? "filled"
              : i === Math.ceil((filledSlotCount / totalSlotCount) * lyricLineCount) && filledSlotCount % totalSlotCount > 0
                ? "partial"
                : "empty";

            const bgColor =
              lineFill === "filled" ? "bg-indigo-500"
              : lineFill === "partial" ? "bg-indigo-200"
              : "bg-gray-200";

            return (
              <div
                key={i}
                className={`h-5 flex-1 rounded-sm ${bgColor} transition-colors`}
                title={`Line ${i + 1}: ${lineFill}`}
              />
            );
          })}
        </div>
        <div className="mt-1 flex justify-between text-[10px] text-gray-400">
          <span>Line 1</span>
          <span>Line {lyricLineCount}</span>
        </div>
      </div>
    </div>
  );
}
