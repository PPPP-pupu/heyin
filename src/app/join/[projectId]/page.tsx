"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import AppShell from "@/components/common/AppShell";
import AppHeader from "@/components/common/AppHeader";
import JoinHeader from "@/components/join/JoinHeader";
import GuestCard from "@/components/join/GuestCard";
import SlotPicker from "@/components/join/SlotPicker";
import RecordingModal from "@/components/project/RecordingModal";
import { useProject } from "@/hooks/useProject";
import { useRecorder } from "@/features/recording/useRecorder";
import { useSubmitRecording } from "@/features/recording/useSubmitRecording";
import { useGuestProfile } from "@/hooks/useGuestProfile";
import { projectRepository } from "@/services/repositories";
import { isCloudRepositoryMode } from "@/services/repositories/repositoryMode";
import { isTencentProvider } from "@/services/repositories/cloudProvider";
import { playAudioId } from "@/utils/audio";
import { isUnstableShareOrigin } from "@/utils/publicBaseUrl";
import type { VoiceSlot } from "@/types/project";

export default function JoinPage() {
  const params = useParams();
  const routeParam = params.projectId as string;
  const isCloud = isCloudRepositoryMode();
  const isTencent = isTencentProvider();

  // In cloud mode: route param may be shareId — resolve via loadProjectByShareId first.
  // In local mode: route param is projectId — load directly.
  const [resolvedProjectId, setResolvedProjectId] = useState<string | null>(
    isCloud ? null : routeParam
  );
  const [resolveError, setResolveError] = useState<string | null>(null);

  useEffect(() => {
    if (!isCloud) return;
    projectRepository
      .loadProjectByShareId(routeParam)
      .then((p) => {
        if (p) {
          setResolvedProjectId(p.id);
        } else {
          projectRepository.loadProject(routeParam).then((fallback) => {
            if (fallback) setResolvedProjectId(fallback.id);
            else setResolveError("未找到项目，链接可能已失效。");
          });
        }
      })
      .catch(() => setResolveError("无法加载项目，请检查网络后重试。"));
  }, [routeParam, isCloud]);

  const {
    project,
    selectedSlot,
    setProject,
    setSelectedSlot,
    clearSelection,
    isLoading,
    refreshProject,
  } = useProject(resolvedProjectId ?? "__loading__");

  const recorder = useRecorder();
  const submitRecording_ = useSubmitRecording(project, setProject);
  const { profile, isLoaded, saveProfile, updateNickname } = useGuestProfile();

  const [showNicknameGate, setShowNicknameGate] = useState(true);
  const [gateNickname, setGateNickname] = useState("");
  const [claimedSlotId, setClaimedSlotId] = useState<string | null>(null);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    if (!isLoaded) return;
    if (profile?.nickname) {
      setShowNicknameGate(false);
      setGateNickname(profile.nickname);
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [isLoaded, profile]);

  // Refresh project slots when returning to the tab (another user may have filled a slot)
  useEffect(() => {
    function handleVisibility() {
      if (document.visibilityState === "visible" && resolvedProjectId) {
        refreshProject({ silent: true });
      }
    }
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", handleVisibility);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", handleVisibility);
    };
  }, [resolvedProjectId, refreshProject]);

  function handleSaveNickname() {
    const trimmed = gateNickname.trim();
    if (!trimmed) return;
    saveProfile({ nickname: trimmed });
    setShowNicknameGate(false);
  }

  const handleChangeNickname = useCallback(
    (nickname: string) => {
      updateNickname(nickname);
      setGateNickname(nickname);
    },
    [updateNickname]
  );

  /** Claim a slot via repository (works for both local and cloud). */
  async function handleClaimSlot(slot: VoiceSlot) {
    if (!project || !profile) return;
    if (slot.status !== "empty") return;

    setClaimError(null);
    setSubmitError(null);
    try {
      const updated = await projectRepository.claimSlot(project, slot.id, profile.id);
      if (!updated) {
        // Conflict: someone else claimed this slot
        setClaimError("这个位置刚被占了，正在刷新空位...");
        const refreshed = await refreshProject({ silent: true });
        if (refreshed) setProject(refreshed);
        setTimeout(() => {
          setClaimError((prev) =>
            prev === "这个位置刚被占了，正在刷新空位..."
              ? "这个位置刚被占了，请选择其他空位。"
              : prev
          );
        }, 800);
        setSelectedSlot(null);
        return;
      }
      setProject(updated);
      setClaimedSlotId(slot.id);
      // Optimistic local update — avoids read-after-write race
      const claimedSlot: VoiceSlot = {
        ...slot,
        status: "claimed",
        claimedBy: profile.id,
        claimedAt: new Date().toISOString(),
      };
      setSelectedSlot(claimedSlot);
    } catch (err) {
      // Refresh silently on error so UI shows latest state
      await refreshProject({ silent: true });
      const msg = err instanceof Error ? err.message : "占位失败，请重试。";
      setClaimError(msg);
      setSelectedSlot(null);
    }
  }

  /** Release claim via repository. Always cleans local state. */
  async function handleModalClose() {
    // release is best-effort; stale cleanup is fallback
    if (project && claimedSlotId) {
      try {
        const released = await projectRepository.releaseClaim(project, claimedSlotId);
        if (released) {
          setProject(released);
        } else {
          // Release failed (slot may have changed) — silently refresh
          await refreshProject({ silent: true });
        }
      } catch {
        // Release threw — silently refresh, claim will be cleaned by stale cleanup
        await refreshProject({ silent: true });
      }
    }
    setClaimedSlotId(null);
    setClaimError(null);
    setSubmitError(null);
    recorder.resetRecording();
    clearSelection();
  }

  async function handleRecordingSubmit(data: { nickname: string; province: string }) {
    if (!selectedSlot || !recorder.audioBlob || !project) return;
    setSubmitError(null);
    try {
      await submitRecording_.submit({
        slotId: selectedSlot.id,
        lineIndex: selectedSlot.lineIndex,
        guestId: profile?.id,
        nickname: data.nickname,
        province: data.province,
        audioBlob: recorder.audioBlob,
        durationSec: recorder.elapsedMs / 1000,
        projectId: project.id,
      });
      setClaimedSlotId(null);
      clearSelection();
      recorder.resetRecording();
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 5000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed. Your recording is still here. Please try again.";
      setSubmitError(msg);
    }
  }

  function handleSlotPlay(slot: VoiceSlot) {
    if (slot.submission?.audioId) playAudioId(slot.submission.audioId);
  }

  const slotsByLine = project
    ? project.lyricLines.map((line) => ({
        line,
        slots: project.voiceSlots.filter((s) => s.lineId === line.id),
      }))
    : [];

  const totalSlots = project?.voiceSlots.length ?? 0;
  const filledSlots =
    project?.voiceSlots.filter((s) => s.status === "filled").length ?? 0;

  // Resolve loading
  if (isCloud && !resolvedProjectId && !resolveError) {
    return (
      <AppShell>
        <AppHeader title="加入合唱" showBack />
        <div className="flex items-center justify-center py-20">
          <p className="text-sm text-gray-400">正在查找项目...</p>
        </div>
      </AppShell>
    );
  }

  if (resolveError) {
    return (
      <AppShell>
        <AppHeader title="加入合唱" showBack />
        <div className="flex flex-col items-center justify-center gap-4 px-6 py-20">
          <p className="text-sm text-red-500">{resolveError}</p>
        </div>
      </AppShell>
    );
  }

  // Nickname gate
  if (showNicknameGate) {
    return (
      <AppShell>
        <AppHeader title="加入合唱" showBack />
        <div className="flex flex-col items-center gap-4 px-6 py-20">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 text-3xl">🎤</div>
          <p className="text-lg font-semibold text-gray-800">欢迎加入合唱！</p>
          <p className="text-sm text-gray-500">输入昵称后即可加入。</p>
          <input type="text"
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
            placeholder="e.g. 小雨" value={gateNickname} onChange={(e) => setGateNickname(e.target.value)} maxLength={20}
            onKeyDown={(e) => e.key === "Enter" && handleSaveNickname()} autoFocus />
          <button type="button" onClick={handleSaveNickname} disabled={!gateNickname.trim()}
            className="w-full rounded-xl bg-indigo-500 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-600 disabled:opacity-50">
            加入合唱
          </button>
        </div>
      </AppShell>
    );
  }

  // Loading
  if (isLoading || !project) {
    return (
      <AppShell>
        <AppHeader showBack />
        <div className="flex items-center justify-center py-20">
          <p className="text-sm text-gray-400">加载中...</p>
        </div>
      </AppShell>
    );
  }

  // Status gate
  if (project.status !== "open") {
    return (
      <AppShell>
        <AppHeader title={project.title} showBack />
        <div className="flex flex-col items-center justify-center gap-4 px-6 py-20">
          <p className="text-lg font-semibold text-gray-700">
            {project.status === "completed" ? "🎉 Chorus Complete!" : "🔒 Chorus Closed"}
          </p>
          <p className="text-sm text-gray-400">
            {project.status === "completed"
              ? "合唱已完成，来听听最终成果吧！"
              : "这个合唱暂时不接受新录音了。"}
          </p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <AppHeader title={project.title} showBack />

      <JoinHeader title={project.title} songName={project.songName}
        filledSlots={filledSlots} totalSlots={totalSlots} />

      <GuestCard nickname={profile?.nickname ?? gateNickname}
        onChangeNickname={handleChangeNickname} />

      {/* Cloud recording notice */}
      {isCloud && (
        <div className="mx-4 mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {isTencent
            ? "云端录音已开启，提交后声音会上传到云端保存。"
            : "云端录音已开启，提交后声音会上传保存。"}
        </div>
      )}

      {/* Temporary EdgeOne access warning */}
      {isUnstableShareOrigin() && (
        <div className="mx-4 mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700 text-center">
          此链接可能会过期。如果出现 401 错误，请向创建者索取最新链接。
        </div>
      )}

      {/* Claim / Submit errors */}
      {claimError && (
        <div className="mx-4 mt-3 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          <span className="flex-1">{claimError}</span>
          <button
            type="button"
            onClick={async () => {
              const refreshed = await refreshProject({ silent: true });
              if (refreshed) setProject(refreshed);
              setClaimError(null);
            }}
            className="shrink-0 rounded-lg border border-red-300 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-100 transition-colors"
          >
            刷新空位
          </button>
        </div>
      )}
      {submitError && (
        <div className="mx-4 mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {submitError}
        </div>
      )}
      {submitSuccess && (
        <div className="mx-4 mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 text-center">
          提交成功！点击你的录音卡片可以试听。
        </div>
      )}

      {/* Onboarding hint — compact, above slots */}
      <div className="mx-4 mt-4 rounded-xl border border-indigo-100 bg-indigo-50/50 px-4 py-3">
        <p className="text-xs font-medium text-indigo-700">如何加入</p>
        <p className="mt-1 text-xs text-indigo-600/70">
          1. 选择空位 &nbsp;→&nbsp; 2. 录制这一句 &nbsp;→&nbsp; 3. 试听 &nbsp;→&nbsp; 4. 提交
        </p>
      </div>

      <SlotPicker
        lines={project.lyricLines}
        slotsByLine={slotsByLine.map(({ slots }) => ({ slots }))}
        selectedSlotId={selectedSlot?.id ?? null}
        onSlotSelect={handleClaimSlot}
        onSlotPlay={handleSlotPlay}
        currentGuestId={profile?.id}
      />

      {/* Recording modal — local, Supabase cloud, and Tencent cloud */}
      {selectedSlot && (
        <RecordingModal
          slot={selectedSlot}
          recorder={recorder}
          onClose={handleModalClose}
          onSubmit={handleRecordingSubmit}
          defaultNickname={profile?.nickname}
          defaultProvince={profile?.province}
        />
      )}
    </AppShell>
  );
}
