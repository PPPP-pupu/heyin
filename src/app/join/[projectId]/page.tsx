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
import { playAudioId } from "@/utils/audio";
import type { VoiceSlot } from "@/types/project";

export default function JoinPage() {
  const params = useParams();
  const routeParam = params.projectId as string;
  const isCloud = isCloudRepositoryMode();

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
  } = useProject(resolvedProjectId ?? "__loading__");

  const recorder = useRecorder();
  const submitRecording_ = useSubmitRecording(project, setProject);
  const { profile, isLoaded, saveProfile, updateNickname } = useGuestProfile();

  const [showNicknameGate, setShowNicknameGate] = useState(true);
  const [gateNickname, setGateNickname] = useState("");
  const [claimedSlotId, setClaimedSlotId] = useState<string | null>(null);
  const [claimError, setClaimError] = useState<string | null>(null);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    if (!isLoaded) return;
    if (profile?.nickname) {
      setShowNicknameGate(false);
      setGateNickname(profile.nickname);
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [isLoaded, profile]);

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
    try {
      const updated = await projectRepository.claimSlot(project, slot.id, profile.id);
      if (!updated) {
        setClaimError("This slot was just taken. Please choose another one.");
        return;
      }
      setProject(updated);
      setClaimedSlotId(slot.id);
      const claimedSlot = updated.voiceSlots.find((s) => s.id === slot.id);
      if (claimedSlot) setSelectedSlot(claimedSlot);
    } catch (err) {
      setClaimError(err instanceof Error ? err.message : "Failed to claim slot.");
    }
  }

  /** Release claim via repository. */
  async function handleModalClose() {
    if (project && claimedSlotId) {
      try {
        const released = await projectRepository.releaseClaim(project, claimedSlotId);
        if (released) setProject(released);
      } catch {
        // silently fail — claim will be cleaned up by stale cleanup
      }
    }
    setClaimedSlotId(null);
    setClaimError(null);
    recorder.resetRecording();
    clearSelection();
  }

  async function handleRecordingSubmit(data: { nickname: string; province: string }) {
    if (!selectedSlot || !recorder.audioBlob || !project) return;
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

      {/* Cloud recording notice — updated for Commit 7 */}
      {isCloud && (
        <div className="mx-4 mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Cloud recording is enabled. Your voice will be uploaded after submit.
        </div>
      )}

      {/* Claim error */}
      {claimError && (
        <div className="mx-4 mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {claimError}
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

      {/* Recording modal — enabled for both local and cloud mode */}
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
