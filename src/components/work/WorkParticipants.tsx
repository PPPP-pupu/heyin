interface WorkParticipantsProps {
  participants: string[];
}

export default function WorkParticipants({ participants }: WorkParticipantsProps) {
  if (participants.length === 0) return null;

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700">
        参与者 · {participants.length}
      </h3>
      <div className="mt-2 flex flex-wrap gap-2">
        {participants.map((name) => (
          <span
            key={name}
            className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700"
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-200 text-xs font-bold text-indigo-600">
              {name.charAt(0)}
            </span>
            {name}
          </span>
        ))}
      </div>
    </div>
  );
}
