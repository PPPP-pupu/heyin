"use client";

import { useState } from "react";
import { generateJoinUrl, copyToClipboard, isLocalhost } from "@/utils/share";

interface ShareButtonProps {
  /** Project id or shareId — used to generate the join URL. */
  projectId: string;
  title?: string;
}

/**
 * ShareButton — copy/share the join URL.
 *
 * Priority:
 * 1. navigator.share() — native share sheet (mobile: WeChat, SMS, copy, etc.)
 * 2. clipboard.writeText() — fallback for desktop
 * 3. execCommand("copy") — legacy fallback
 *
 * In cloud mode, pass project.shareId as projectId to generate /join/{shareId}.
 * In local mode, pass project.id.
 *
 * Layer: UI Layer (🟦)
 */
export default function ShareButton({ projectId, title }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const [showUrl, setShowUrl] = useState(false);

  async function handleShare() {
    const url = generateJoinUrl(projectId);
    const shareTitle = title ?? "来和我在和音一起合唱吧！";

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: shareTitle, url });
        setCopied(true);
        setShowUrl(true);
        setTimeout(() => setCopied(false), 3000);
        return;
      } catch {
        // User cancelled or API failed — fall through to clipboard
      }
    }

    const ok = await copyToClipboard(url);
    if (ok) {
      setCopied(true);
      setShowUrl(true);
      setTimeout(() => setCopied(false), 3000);
    }
  }

  const joinUrl = generateJoinUrl(projectId);
  const needsNetworkHint = isLocalhost();

  return (
    <div className="flex-1">
      <button
        type="button"
        onClick={handleShare}
        className={`flex w-full items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all ${
          copied
            ? "bg-emerald-500 text-white"
            : "bg-white border border-indigo-300 text-indigo-600 hover:bg-indigo-50"
        }`}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          {copied ? (
            <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0z" />
          ) : (
            <path d="M4.5 1A1.5 1.5 0 0 0 3 2.5v8A1.5 1.5 0 0 0 4.5 12H6v1.5A1.5 1.5 0 0 0 7.5 15h4a1.5 1.5 0 0 0 1.5-1.5v-8A1.5 1.5 0 0 0 11.5 4H10V2.5A1.5 1.5 0 0 0 8.5 1h-4zM6 4h5.5a.5.5 0 0 1 .5.5v8a.5.5 0 0 1-.5.5h-4a.5.5 0 0 1-.5-.5V11h1.5A1.5 1.5 0 0 0 10 9.5V6H8.5A1.5 1.5 0 0 0 7 4.5V4z" />
          )}
        </svg>
        {copied ? "链接已复制！" : "Share"}
      </button>

      {showUrl && (
        <div className="mt-2 rounded-lg bg-gray-50 p-3">
          <p className="truncate text-xs font-mono text-gray-600">{joinUrl}</p>
          {needsNetworkHint && (
            <p className="mt-1 text-xs text-amber-600">
              On same WiFi? Replace &quot;localhost&quot; with this
              computer&apos;s IP address (
              {typeof window !== "undefined"
                ? window.location.hostname
                : "..."}
              ). Check the terminal where you ran{" "}
              <code>npm run dev</code> for the Network URL.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
