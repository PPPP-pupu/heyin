import ProgressBar from "@/components/project/ProgressBar";

interface JoinHeaderProps {
  title: string;
  songName: string;
  filledSlots: number;
  totalSlots: number;
}

/**
 * JoinHeader — project overview for the join page.
 *
 * Layer: UI Layer (🟦)
 * Pure display: title, song name, progress bar, voice count.
 */
export default function JoinHeader({
  title,
  songName,
  filledSlots,
  totalSlots,
}: JoinHeaderProps) {
  return (
    <div className="px-4 pt-6">
      <h2 className="text-xl font-bold text-gray-900">{title}</h2>
      <p className="mt-0.5 text-sm text-gray-500">{songName}</p>

      <div className="mt-4">
        <ProgressBar filled={filledSlots} total={totalSlots} />
      </div>

      <p className="mt-2 text-xs text-gray-400">
        {filledSlots} / {totalSlots} 个声音
      </p>
    </div>
  );
}
