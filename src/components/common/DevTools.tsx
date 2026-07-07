"use client";

import { useState } from "react";
import { deleteGuestProfile } from "@/services/storage/guestStorage";
import { seedDemoAudio } from "@/data/seedDemoAudio";

/**
 * DevTools — local development & test panel.
 *
 * Layer: UI Layer (🟦)
 *
 * Provides quick access to:
 * - Clear all localStorage data
 * - Clear all IndexedDB audio
 * - Seed demo audio
 * - Export / Import debug JSON
 */
export default function DevTools() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [importJson, setImportJson] = useState("");

  function log(msg: string) {
    setMessage(msg);
    setTimeout(() => setMessage(null), 3000);
  }

  async function handleClearProjects() {
    if (typeof window === "undefined") return;
    const keys: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key?.startsWith("heyin:project:") || key?.startsWith("heyin:work:") || key?.startsWith("heyin:version:")) {
        keys.push(key);
      }
    }
    for (const key of keys) window.localStorage.removeItem(key);
    log(`Cleared ${keys.length} project/work/version entries`);
  }

  async function handleClearAudio() {
    if (typeof indexedDB === "undefined") return;
    try {
      await new Promise<void>((resolve) => {
        const req = indexedDB.deleteDatabase("heyin-audio");
        req.onsuccess = () => resolve();
        req.onerror = () => resolve();
      });
      log("IndexedDB audio cleared");
    } catch {
      log("Failed to clear IndexedDB");
    }
  }

  function handleResetGuest() {
    deleteGuestProfile();
    log("Guest identity reset");
  }

  function handleSeedDemo() {
    seedDemoAudio();
    log("Demo audio seeded");
  }

  function handleExportJSON() {
    if (typeof window === "undefined") return;
    const data: Record<string, unknown> = {};
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key?.startsWith("heyin:")) {
        try {
          data[key] = JSON.parse(window.localStorage.getItem(key) ?? "");
        } catch {
          data[key] = window.localStorage.getItem(key);
        }
      }
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `heyin-debug-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    log("Debug JSON exported");
  }

  async function handleImportJSON() {
    if (!importJson.trim()) return;
    try {
      const data = JSON.parse(importJson);
      let count = 0;
      for (const [key, value] of Object.entries(data)) {
        if (key.startsWith("heyin:")) {
          window.localStorage.setItem(key, typeof value === "string" ? value : JSON.stringify(value));
          count++;
        }
      }
      log(`Imported ${count} entries. Reloading...`);
      setTimeout(() => window.location.reload(), 1000);
    } catch {
      log("Invalid JSON");
    }
  }

  if (!open) {
    return (
      <div className="px-4 pb-10">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-xl border border-dashed border-gray-300 px-4 py-2.5 text-xs font-medium text-gray-400 hover:border-gray-400 hover:text-gray-600 transition-colors w-full"
        >
          Developer Tools
        </button>
      </div>
    );
  }

  return (
    <div className="px-4 pb-10">
      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-700">Developer Tools</h3>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            Close
          </button>
        </div>

        {message && (
          <div className="mb-3 rounded-lg bg-indigo-50 px-3 py-2 text-xs font-medium text-indigo-700">
            {message}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <button onClick={handleClearProjects} className="flex-1 rounded-lg bg-white border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors">
              Clear Projects
            </button>
            <button onClick={handleClearAudio} className="flex-1 rounded-lg bg-white border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors">
              Clear Audio
            </button>
          </div>
          <div className="flex gap-2">
            <button onClick={handleResetGuest} className="flex-1 rounded-lg bg-white border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200 transition-colors">
              Reset Guest
            </button>
            <button onClick={handleSeedDemo} className="flex-1 rounded-lg bg-white border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-colors">
              Seed Demo Audio
            </button>
          </div>
          <button onClick={handleExportJSON} className="rounded-lg bg-white border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-colors">
            Export Debug JSON
          </button>

          {/* Import */}
          <div className="mt-2">
            <textarea
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-700 placeholder:text-gray-400 focus:border-indigo-400 focus:outline-none resize-y"
              rows={3}
              placeholder="Paste debug JSON here..."
              value={importJson}
              onChange={(e) => setImportJson(e.target.value)}
            />
            <button
              onClick={handleImportJSON}
              disabled={!importJson.trim()}
              className="mt-1 w-full rounded-lg bg-indigo-500 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-600 disabled:opacity-40 transition-colors"
            >
              Import & Reload
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
