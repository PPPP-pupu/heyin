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
          // Fallback: try as projectId
          projectRepository.loadProject(routeParam).then((fallback) => {
            if (fallback) setResolvedProjectId(fallback.id);
            else setResolveError("Project not found.");
          });
        }
      })
      .catch(() => setResolveError("Failed to load project."));
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
        setClaimError("This slot was just taken. Refreshing available slots...");
        // Auto-refresh silently so the user sees updated slot statuses
        const refreshed = await refreshProject({ silent: true });
        if (refreshed) setProject(refreshed);
        // Also update the error after a brief moment
        setTimeout(() => {
          setClaimError((prev) =>
            prev === "This slot was just taken. Refreshing available slots..."
              ? "This slot was just taken. Please choose another one."
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
      const msg = err instanceof Error ? err.message : "Failed to claim slot. Please try again.";
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
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Submit failed. Please try again.";
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
        <AppHeader title="Join Chorus" showBack />
        <div className="flex items-center justify-center py-20">
          <p className="text-sm text-gray-400">Finding project...</p>
        </div>
      </AppShell>
    );
  }

  if (resolveError) {
    return (
      <AppShell>
        <AppHeader title="Join Chorus" showBack />
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
        <AppHeader title="Join Chorus" showBack />
        <div className="flex flex-col items-center gap-4 px-6 py-20">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 text-3xl">🎤</div>
          <p className="text-lg font-semibold text-gray-800">Welcome to the Chorus!</p>
          <p className="text-sm text-gray-500">Enter your nickname to join.</p>
          <input type="text"
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
            placeholder="e.g. 小雨" value={gateNickname} onChange={(e) => setGateNickname(e.target.value)} maxLength={20}
            onKeyDown={(e) => e.key === "Enter" && handleSaveNickname()} autoFocus />
          <button type="button" onClick={handleSaveNickname} disabled={!gateNickname.trim()}
            className="w-full rounded-xl bg-indigo-500 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-600 disabled:opacity-50">
            Join Chorus
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
          <p className="text-sm text-gray-400">Loading...</p>
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
              ? "This chorus is finished. Enjoy the final result!"
              : "This chorus is no longer accepting new voices."}
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
            ? "Tencent cloud recording is enabled. Your voice will be uploaded to CloudBase Storage after submit."
            : "Cloud recording is enabled. Your voice will be uploaded after submit."}
        </div>
      )}

      {/* Temporary EdgeOne access warning */}
      {isUnstableShareOrigin() && (
        <div className="mx-4 mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700 text-center">
          This link may expire. Ask the host for an updated link if you see a 401 error.
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
            Refresh Slots
          </button>
        </div>
      )}
      {submitError && (
        <div className="mx-4 mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {submitError}
        </div>
      )}

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
