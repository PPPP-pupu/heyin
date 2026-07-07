interface WorkAudioPlayerProps {
  audioUrl: string | null;
  title: string;
}

export default function WorkAudioPlayer({ audioUrl, title }: WorkAudioPlayerProps) {
  if (!audioUrl) {
    return (
      <div className="rounded-xl bg-gray-50 p-6 text-center">
        <p className="text-sm text-gray-400">Loading audio...</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-gray-50 p-4">
      <audio controls src={audioUrl} className="w-full" />
      <div className="mt-3 flex justify-center">
        <a
          href={audioUrl}
          download={`${title}.wav`}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-600 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 1a.5.5 0 0 1 .5.5v9.793l2.146-2.147a.5.5 0 0 1 .708.708l-3 3a.5.5 0 0 1-.708 0l-3-3a.5.5 0 1 1 .708-.708L7.5 11.293V1.5A.5.5 0 0 1 8 1z"/>
            <path d="M2 11.5a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1h-2a.5.5 0 0 1-.5-.5zm-1 2a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1v-1z"/>
          </svg>
          Download WAV
        </a>
      </div>
    </div>
  );
}
