"use client";

import { useState, useEffect } from "react";
import AppShell from "@/components/common/AppShell";
import AppHeader from "@/components/common/AppHeader";
import { useGuestProfile } from "@/hooks/useGuestProfile";
import { deleteGuestProfile } from "@/services/storage/guestStorage";
import DevTools from "@/components/common/DevTools";

export default function ProfilePage() {
  const { profile, isLoaded, saveProfile } = useGuestProfile();

  const [nickname, setNickname] = useState("");
  const [province, setProvince] = useState("");
  const [saved, setSaved] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  // Sync profile data into local form state when profile loads/changes
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    if (profile) {
      setNickname(profile.nickname);
      setProvince(profile.province ?? "");
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [profile]);

  function handleSave() {
    if (!nickname.trim()) return;
    saveProfile({ nickname: nickname.trim(), province: province.trim() || undefined });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleClearAllData() {
    if (!confirmReset) {
      setConfirmReset(true);
      return;
    }

    // Clear all heyin localStorage keys
    if (typeof window !== "undefined") {
      const keysToDelete: string[] = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key?.startsWith("heyin:")) keysToDelete.push(key);
      }
      for (const key of keysToDelete) window.localStorage.removeItem(key);
    }

    // Clear IndexedDB audio
    if (typeof indexedDB !== "undefined") {
      try {
        await new Promise<void>((resolve) => {
          const req = indexedDB.deleteDatabase("heyin-audio");
          req.onsuccess = () => resolve();
          req.onerror = () => resolve();
        });
      } catch {}
    }

    setConfirmReset(false);
    window.location.reload();
  }

  if (!isLoaded) {
    return (
      <AppShell>
        <AppHeader title="个人资料" showBack />
        <div className="flex items-center justify-center py-20">
          <p className="text-sm text-gray-400">加载中...</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <AppHeader title="个人资料" showBack />

      <div className="flex flex-col gap-6 px-4 py-6">
        {/* Guest Identity */}
        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700">访客身份</h3>
          <p className="mt-1 text-xs text-gray-400">
            你的访客身份只保存在当前浏览器中。
          </p>

          <div className="mt-4 flex flex-col gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600">昵称</label>
              <input
                type="text"
                className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                placeholder="例如：小雨"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={20}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">所在地区（可选）</label>
              <input
                type="text"
                className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                placeholder="例如：浙江"
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                maxLength={30}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleSave}
            className={`mt-4 w-full rounded-xl px-5 py-2.5 text-sm font-semibold transition-all ${
              saved
                ? "bg-emerald-500 text-white"
                : "bg-indigo-500 text-white hover:bg-indigo-600"
            }`}
          >
            {saved ? "已保存！" : "保存资料"}
          </button>
        </section>

        {/* Danger zone */}
        <section className="rounded-2xl border border-red-100 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-red-600">危险操作</h3>
          <p className="mt-1 text-xs text-gray-400">
            以下操作无法撤销。
          </p>

          <div className="mt-4 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => {
                deleteGuestProfile();
                window.location.reload();
              }}
              className="rounded-xl border border-red-200 px-5 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
            >
              重置访客身份
            </button>

            {!confirmReset ? (
              <button
                type="button"
                onClick={handleClearAllData}
                className="rounded-xl border border-red-200 px-5 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
              >
                清除所有本地数据
              </button>
            ) : (
              <div className="rounded-xl border-2 border-red-300 bg-red-50 p-4">
                <p className="text-sm font-semibold text-red-700">
                  确定删除所有项目、录音和作品吗？
                </p>
                <p className="mt-1 text-xs text-red-500">
                  这会删除当前浏览器中的所有项目、录音和生成的作品。
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={handleClearAllData}
                    className="flex-1 rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 transition-colors"
                  >
                    确认全部删除
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmReset(false)}
                    className="flex-1 rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    取消
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Dev Tools */}
        <DevTools />
      </div>
    </AppShell>
  );
}
