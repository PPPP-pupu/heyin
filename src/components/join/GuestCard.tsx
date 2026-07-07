"use client";

import { useState } from "react";

interface GuestCardProps {
  nickname: string;
  onChangeNickname: (nickname: string) => void;
}

/**
 * GuestCard — displays the current guest identity on the join page.
 *
 * Layer: UI Layer (🟦)
 * Shows "Joined as <nickname>" with an inline edit affordance.
 */
export default function GuestCard({ nickname, onChangeNickname }: GuestCardProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(nickname);

  function handleSave() {
    const trimmed = draft.trim();
    if (!trimmed) return;
    onChangeNickname(trimmed);
    setEditing(false);
  }

  function handleCancel() {
    setDraft(nickname);
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="mx-4 mt-4 flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50/50 px-4 py-3">
        <input
          type="text"
          className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-400 focus:outline-none"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={20}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
            if (e.key === "Escape") handleCancel();
          }}
          autoFocus
        />
        <button
          type="button"
          onClick={handleSave}
          disabled={!draft.trim()}
          className="rounded-lg bg-indigo-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-600 disabled:opacity-50"
        >
          Save
        </button>
        <button
          type="button"
          onClick={handleCancel}
          className="rounded-lg px-2 py-1.5 text-xs text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <div className="mx-4 mt-4 flex items-center gap-2 rounded-xl bg-gray-50 px-4 py-3">
      <span className="text-sm text-gray-500">Joined as</span>
      <span className="text-sm font-semibold text-indigo-600">{nickname}</span>
      <button
        type="button"
        onClick={() => {
          setDraft(nickname);
          setEditing(true);
        }}
        className="ml-auto text-xs text-gray-400 underline hover:text-indigo-500"
      >
        change
      </button>
    </div>
  );
}
