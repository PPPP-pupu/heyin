"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import AppShell from "@/components/common/AppShell";
import AppHeader from "@/components/common/AppHeader";
import SecondaryButton from "@/components/common/SecondaryButton";
import WorkHero from "@/components/work/WorkHero";
import WorkAudioPlayer from "@/components/work/WorkAudioPlayer";
import WorkParticipants from "@/components/work/WorkParticipants";
import WorkProgress from "@/components/work/WorkProgress";
import VersionSelector from "@/components/work/VersionSelector";
import { loadWork } from "@/services/storage/workStorage";
import { loadWorkVersion } from "@/services/storage/workVersionStorage";
import { loadAudio } from "@/services/storage/audioStorage";
import type { ChorusWork } from "@/types/work";

export default function WorkPage() {
  const params = useParams();
  const workId = params.workId as string;

  const [work, setWork] = useState<ChorusWork | null>(null);
  const [audioUrls, setAudioUrls] = useState<Map<string, string>>(new Map());
  const [currentVersionIndex, setCurrentVersionIndex] = useState(0);
  const [notFound, setNotFound] = useState(false);

  // Hydrate work data from localStorage (SSR-safe — localStorage unavailable on server)
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    const w = loadWork(workId);
    if (!w) { setNotFound(true); return; }
    setWork(w);
    setCurrentVersionIndex(w.versions.length - 1); // latest version
    /* eslint-enable react-hooks/set-state-in-effect */

    // Preload all version audio URLs
    //
    // Correction: w.versions stores versionId, NOT audioId.
    //   versionId → loadWorkVersion(versionId) → version.audioId → loadAudio(audioId)
    // Previously was loading versionId directly as audioId — that's a bug.
    const urls = new Map<string, string>();
    const versionIds = w.versions.length > 0 ? w.versions : [];

    const loadAll = async () => {
      if (versionIds.length === 0) {
        // No versions: load the work-level audio directly
        const blob = await loadAudio(w.audioId);
        if (blob) urls.set(w.audioId, URL.createObjectURL(blob));
        setAudioUrls(new Map(urls));
        return;
      }

      for (const versionId of versionIds) {
        const version = loadWorkVersion(versionId);
        if (!version) continue;
        const blob = await loadAudio(version.audioId);
        if (blob) urls.set(versionId, URL.createObjectURL(blob));
      }
      setAudioUrls(new Map(urls));
    };
    loadAll();

    return () => {
      for (const url of urls.values()) URL.revokeObjectURL(url);
    };
  }, [workId]);

  const handleVersionSelect = useCallback((index: number) => {
    setCurrentVersionIndex(index);
  }, []);

  if (notFound) {
    return (
      <AppShell>
        <AppHeader title="Work Not Found" showBack />
        <div className="flex flex-col items-center justify-center gap-4 px-6 py-20">
          <p className="text-sm text-gray-400">This work does not exist.</p>
          <SecondaryButton href="/explore">Browse Projects</SecondaryButton>
        </div>
      </AppShell>
    );
  }

  if (!work) {
    return (
      <AppShell>
        <AppHeader showBack />
        <div className="flex items-center justify-center py-20">
          <p className="text-sm text-gray-400">Loading...</p>
        </div>
      </AppShell>
    );
  }

  const versionIds = work.versions.length > 0 ? work.versions : [];
  // When no versions, key is work.audioId. Otherwise key is versionId.
  const currentVersionKey = versionIds.length > 0
    ? (versionIds[currentVersionIndex] ?? versionIds[0])
    : work.audioId;
  const currentAudioUrl = audioUrls.get(currentVersionKey) ?? null;

  return (
    <AppShell>
      <AppHeader title={work.title} showBack />

      <div className="flex flex-col gap-4 px-4 py-6">
        {/* Hero */}
        <WorkHero
          title={work.title}
          songName={work.songName}
          participantCount={work.participants.length}
          duration={work.audioDuration}
          createdAt={work.createdAt}
          versionCount={versionIds.length}
        />

        {/* Audio */}
        <WorkAudioPlayer audioUrl={currentAudioUrl} title={work.title} />

        {/* Version selector */}
        <VersionSelector
          versionCount={versionIds.length}
          currentIndex={currentVersionIndex}
          onSelect={handleVersionSelect}
        />

        {/* Progress */}
        <WorkProgress
          filledSlotCount={work.filledSlotCount}
          totalSlotCount={work.totalSlotCount}
          lyricLineCount={work.lyricLineCount}
        />

        {/* Participants */}
        <WorkParticipants participants={work.participants} />

        {/* View project link */}
        <Link href={`/project/${work.projectId}`}>
          <SecondaryButton>View Project</SecondaryButton>
        </Link>
      </div>
    </AppShell>
  );
}
