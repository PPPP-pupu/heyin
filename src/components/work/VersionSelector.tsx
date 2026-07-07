interface VersionSelectorProps {
  versionCount: number;
  currentIndex: number;
  onSelect: (index: number) => void;
}

export default function VersionSelector({
  versionCount,
  currentIndex,
  onSelect,
}: VersionSelectorProps) {
  if (versionCount <= 1) return null;

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4">
      <h3 className="text-sm font-semibold text-gray-700">Version</h3>
      <div className="mt-2 flex gap-2">
        {Array.from({ length: versionCount }).map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onSelect(i)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              i === currentIndex
                ? "bg-indigo-500 text-white shadow-sm"
                : "bg-gray-50 text-gray-600 hover:bg-gray-100"
            }`}
          >
            v{i + 1}
          </button>
        ))}
      </div>
    </div>
  );
}
