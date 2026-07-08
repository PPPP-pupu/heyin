"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AppShell from "@/components/common/AppShell";
import AppHeader from "@/components/common/AppHeader";
import SecondaryButton from "@/components/common/SecondaryButton";
import ProgressBar from "@/components/project/ProgressBar";
import LyricLineCard from "@/components/project/LyricLineCard";
import RecordingModal from "@/components/project/RecordingModal";
import { useProject } from "@/hooks/useProject";
import { useRecorder } from "@/features/recording/useRecorder";
import { useSubmitRecording } from "@/features/recording/useSubmitRecording";
import { playAudioId } from "@/utils/audio";
import { usePlayback } from "@/features/playback/usePlayback";
import { useExport } from "@/features/export/useExport";
import ExportButton from "@/components/project/ExportButton";
import ShareButton from "@/components/common/ShareButton";
import { projectRepository } from "@/services/repositories";
import { isCloudRepositoryMode } from "@/services/repositories/repositoryMode";

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;

  // Delete state
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    project,
    selectedSlot,
    setProject,
    selectSlot,
    clearSelection,
    isLoading,
    error,
  } = useProject(projectId);

  const recorder = useRecorder();
  const submitRecording_ = useSubmitRecording(project, setProject);
  const playback = usePlayback(project);
  const export_ = useExport(project);
  const isCloud = isCloudRepositoryMode();

  const slotsByLine = project
    ? project.lyricLines.map((line) => ({
        line,
        slots: project.voiceSlots.filter((s) => s.lineId === line.id),
      }))
    : [];

  const totalSlots = project?.voiceSlots.length ?? 0;
  const filledSlots =
    project?.voiceSlots.filter((s) => s.status === "filled").length ?? 0;

  function handleSlotPlay(slot: { submission?: { audioId?: string } }) {
    if (slot.submission?.audioId) {
      playAudioId(slot.submission.audioId);
    }
  }

  async function handleSlotDelete(slot: { id: string }) {
    if (!project) return;
    try {
      const updated = await projectRepository.deleteSubmission(project, slot.id);
      setProject(updated);
    } catch {
      // silently fail — slot will refresh on next load
    }
  }

  function handleModalClose() {
    recorder.resetRecording();
    clearSelection();
  }

  async function handleStatusChange(status: "draft" | "open" | "locked" | "completed") {
    if (!project) return;
    try {
      const updated = await projectRepository.setProjectStatus(project, status);
      setProject(updated);
    } catch {
      // silently fail
    }
  }

  async function handleRecordingSubmit(data: { nickname: string; province: string }) {
    if (!selectedSlot || !recorder.audioBlob || !project) return;
    await submitRecording_.submit({
      slotId: selectedSlot.id,
      lineIndex: selectedSlot.lineIndex,
      nickname: data.nickname,
      province: data.province,
      audioBlob: recorder.audioBlob,
      durationSec: recorder.elapsedMs / 1000,
      projectId: project.id,
    });
    clearSelection();
    recorder.resetRecording();
  }

  // Delete project
  async function handleDelete() {
    if (!project) return;
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      return;
    }
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await projectRepository.deleteProject(project.id);
      router.push("/explore");
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Failed to delete project.");
      setIsDeleting(false);
      setDeleteConfirm(false);
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <AppShell>
        <AppHeader title="Chorus Project Detail" showBack />
        <div className="flex items-center justify-center py-20">
          <p className="text-sm text-gray-400">Loading project...</p>
        </div>
      </AppShell>
    );
  }

  // Error state
  if (error) {
    return (
      <AppShell>
        <AppHeader title="Chorus Project Detail" showBack />
        <div className="flex flex-col items-center justify-center gap-4 px-6 py-20">
          <p className="text-sm text-red-500">{error}</p>
          <SecondaryButton href="/create">Create a New Project</SecondaryButton>
        </div>
      </AppShell>
    );
  }

  // Not found state
  if (!project) {
    return (
      <AppShell>
        <AppHeader title="Project Not Found" showBack />
        <div className="flex flex-col items-center justify-center gap-4 px-6 py-20">
          <p className="text-sm text-gray-400">
            This project does not exist or may have been deleted.
          </p>
          <SecondaryButton href="/create">
            Create a New Project
          </SecondaryButton>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <AppHeader title="Chorus Project Detail" showBack />

      <div className="px-4 py-6">
        <div className="mb-1">
          <h2 className="text-xl font-bold text-gray-900">{project.title}</h2>
          <p className="mt-0.5 text-sm text-gray-500">{project.songName}</p>
        </div>

        <div className="mt-4">
          <ProgressBar filled={filledSlots} total={totalSlots} />
        </div>

        <div className="mt-4 flex items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 capitalize">
            {project.status}
          </span>
          <span className="text-xs text-gray-400">
            {filledSlots} / {totalSlots} voices completed
          </span>
        </div>

        {/* Status transitions */}
        <div className="mt-3 flex flex-wrap gap-2">
          {project.status !== "open" && (
            <button type="button" onClick={() => handleStatusChange("open")}
              className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 transition-colors">
              Open for Recording
            </button>
          )}
          {project.status === "open" && (
            <button type="button" onClick={() => handleStatusChange("locked")}
              className="rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100 transition-colors">
              Lock Submissions
            </button>
          )}
          {(project.status === "open" || project.status === "locked") && (
            <button type="button" onClick={() => handleStatusChange("completed")}
              className="rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100 transition-colors">
              Mark Completed
            </button>
          )}
          {project.status === "completed" && (
            <button type="button" onClick={() => handleStatusChange("open")}
              className="rounded-lg bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 transition-colors">
              Re-open
            </button>
          )}
          {project.status === "locked" && (
            <button type="button" onClick={() => handleStatusChange("open")}
              className="rounded-lg bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 transition-colors">
              Re-open
            </button>
          )}
        </div>

        {/* Playback controls */}
        <div className="mt-4 flex gap-2">
          {playback.state === "idle" || playback.state === "finished" ? (
            <button type="button" onClick={playback.play} disabled={filledSlots === 0}
              className="flex items-center gap-2 rounded-xl bg-indigo-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-600 active:bg-indigo-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M5 3.5v9l7-4.5-7-4.5z" /></svg>
              Play Chorus
            </button>
          ) : (
            <>
              {playback.state === "playing" ? (
                <button type="button" onClick={playback.pause}
                  className="flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-amber-600 active:bg-amber-700 transition-colors">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><rect x="3" y="2" width="3" height="12" rx="0.5" /><rect x="10" y="2" width="3" height="12" rx="0.5" /></svg>
                  Pause
                </button>
              ) : (
                <button type="button" onClick={playback.resume}
                  className="flex items-center gap-2 rounded-xl bg-indigo-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-600 active:bg-indigo-700 transition-colors">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M5 3.5v9l7-4.5-7-4.5z" /></svg>
                  Resume
                </button>
              )}
              <button type="button" onClick={playback.stop}
                className="flex items-center gap-2 rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 active:bg-gray-100 transition-colors">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><rect x="2" y="2" width="12" height="12" rx="1" /></svg>
                Stop
              </button>
            </>
          )}
        </div>

        {/* Share + Export section */}
        <div className="mt-4 flex flex-col gap-2">
          <div className="flex gap-2">
            <ExportButton
              status={export_.status}
              audioUrl={export_.audioUrl}
              workId={export_.work?.id ?? null}
              onExport={export_.startExport}
              disabled={filledSlots === 0}
            />
            <ShareButton projectId={project.shareId ?? project.id} />
          </div>
        </div>

        {/* Cloud notice — participants can submit via Join page */}
        {isCloud && (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            Cloud submissions are enabled. Share the link for others to join and record.
          </div>
        )}

        {/* Delete project — MVP: without auth, deletion is not owner-secured */}
        <div className="mt-6 border-t border-gray-100 pt-4">
          {deleteError && (
            <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
              {deleteError}
            </div>
          )}
          {!deleteConfirm ? (
            <button
              type="button"
              onClick={handleDelete}
              className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 transition-colors"
            >
              Delete Project
            </button>
          ) : (
            <div className="rounded-xl border-2 border-red-300 bg-red-50 p-3">
              <p className="text-sm font-semibold text-red-700">
                Delete this project and all recordings?
              </p>
              <p className="mt-1 text-xs text-red-500">
                This will permanently delete the project, all voice submissions, and all audio files. This cannot be undone.
              </p>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="rounded-lg bg-red-500 px-4 py-1.5 text-xs font-semibold text-white hover:bg-red-600 disabled:opacity-50 transition-colors"
                >
                  {isDeleting ? "Deleting..." : "Yes, Delete Forever"}
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteConfirm(false)}
                  className="rounded-lg border border-gray-200 px-4 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Lyric lines and voice slots */}
        <div className="mt-6 flex flex-col gap-4 pb-10">
          {slotsByLine.map(({ line, slots }) => (
            <LyricLineCard
              key={line.id}
              index={line.index}
              text={line.text}
              slots={slots}
              selectedSlotId={selectedSlot?.id ?? null}
              onSlotSelect={isCloud ? undefined : selectSlot}
              onSlotPlay={handleSlotPlay}
              onSlotDelete={isCloud ? undefined : handleSlotDelete}
              isActive={
                (playback.state === "playing" || playback.state === "paused")
                  ? line.index === playback.currentLineIndex
                  : false
              }
              isPaused={
                playback.state === "paused"
                  ? line.index === playback.currentLineIndex
                  : false
              }
            />
          ))}
        </div>
      </div>

      {/* Recording modal — local mode: creator can record directly.
           Cloud mode: creator records via the Join page like other participants. */}
      {!isCloud && selectedSlot && (
        <RecordingModal
          slot={selectedSlot}
          recorder={recorder}
          onClose={handleModalClose}
          onSubmit={handleRecordingSubmit}
        />
      )}
    </AppShell>
  );
}
