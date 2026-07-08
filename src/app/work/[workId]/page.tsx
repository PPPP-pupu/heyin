"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
import { workRepository, audioRepository } from "@/services/repositories";
import { isCloudRepositoryMode } from "@/services/repositories/repositoryMode";
import { isTencentProvider } from "@/services/repositories/cloudProvider";
import type { ChorusWork } from "@/types/work";

export default function WorkPage() {
  const params = useParams();
  const workId = params.workId as string;

  const [work, setWork] = useState<ChorusWork | null>(null);
  const [audioUrls, setAudioUrls] = useState<Map<string, string>>(new Map());
  const [currentVersionIndex, setCurrentVersionIndex] = useState(0);
  const [notFound, setNotFound] = useState(false);
  const blobUrlRef = useRef<string[]>([]);

  const isCloudTencent = isCloudRepositoryMode() && isTencentProvider();

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      for (const url of blobUrlRef.current) {
        URL.revokeObjectURL(url);
      }
      blobUrlRef.current = [];
    };
  }, []);

  // Hydrate work data (cloud or local)
  useEffect(() => {
    const load = async () => {
      let w: ChorusWork | null = null;

      if (isCloudTencent) {
        try {
          w = await workRepository.loadWork(workId);
        } catch {
          w = null;
        }
      } else {
        w = loadWork(workId);
      }

      if (!w) { setNotFound(true); return; }
      setWork(w);
      setCurrentVersionIndex(w.versions.length - 1);

      // Revoke previous URLs before creating new ones
      for (const url of blobUrlRef.current) URL.revokeObjectURL(url);
      blobUrlRef.current = [];

      const urls = new Map<string, string>();
      const versionIds = w.versions.length > 0 ? w.versions : [];

      const makeUrl = (blob: Blob) => {
        const u = URL.createObjectURL(blob);
        blobUrlRef.current.push(u);
        return u;
      };

      if (versionIds.length === 0) {
        const loader = isCloudTencent
          ? (id: string) => audioRepository.loadAudio(id)
          : (id: string) => Promise.resolve(loadAudio(id));
        const blob = await loader(w.audioId);
        if (blob) urls.set(w.audioId, makeUrl(blob));
        setAudioUrls(new Map(urls));
        return;
      }

      for (const versionId of versionIds) {
        let version;
        if (isCloudTencent) {
          version = await workRepository.loadWorkVersion(versionId);
        } else {
          version = loadWorkVersion(versionId);
        }
        if (!version) continue;

        const loader = isCloudTencent
          ? (id: string) => audioRepository.loadAudio(id)
          : (id: string) => Promise.resolve(loadAudio(id));
        const blob = await loader(version.audioId);
        if (blob) urls.set(versionId, makeUrl(blob));
      }
      setAudioUrls(new Map(urls));
    };

    load();
  }, [workId, isCloudTencent]);

  const handleVersionSelect = useCallback((index: number) => {
    setCurrentVersionIndex(index);
  }, []);

  if (notFound) {
    return (
      <AppShell>
        <AppHeader title="未找到作品" showBack />
        <div className="flex flex-col items-center justify-center gap-4 px-6 py-20">
          <p className="text-sm text-gray-400">这个作品不存在或已被删除。</p>
          <SecondaryButton href="/explore">浏览项目</SecondaryButton>
        </div>
      </AppShell>
    );
  }

  if (!work) {
    return (
      <AppShell>
        <AppHeader showBack />
        <div className="flex items-center justify-center py-20">
          <p className="text-sm text-gray-400">加载中...</p>
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
          <SecondaryButton>查看项目</SecondaryButton>
        </Link>
      </div>
    </AppShell>
  );
}
