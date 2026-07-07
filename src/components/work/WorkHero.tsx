interface WorkHeroProps {
  title: string;
  songName: string;
  participantCount: number;
  duration: number;
  createdAt: string;
  versionCount: number;
}

export default function WorkHero({
  title,
  songName,
  participantCount,
  duration,
  createdAt,
  versionCount,
}: WorkHeroProps) {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-8 text-white shadow-lg">
      <div className="mb-3 text-center">
        <span className="text-5xl">🎵</span>
      </div>

      <h1 className="text-center text-2xl font-bold">{title}</h1>
      <p className="mt-1 text-center text-base text-indigo-200">
        {songName}
      </p>

      <p className="mt-3 text-center text-sm text-indigo-200/80">
        A chorus by {participantCount} voices
      </p>

      {/* Stats */}
      <div className="mt-6 flex justify-center gap-8">
        <div className="text-center">
          <p className="text-2xl font-bold">{participantCount}</p>
          <p className="text-xs text-indigo-200">Voices</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold">{duration.toFixed(0)}s</p>
          <p className="text-xs text-indigo-200">Duration</p>
        </div>
        {versionCount > 1 && (
          <div className="text-center">
            <p className="text-2xl font-bold">v{versionCount}</p>
            <p className="text-xs text-indigo-200">Versions</p>
          </div>
        )}
      </div>

      <p className="mt-4 text-center text-xs text-indigo-300">
        Created {new Date(createdAt).toLocaleDateString()}
      </p>
    </div>
  );
}
