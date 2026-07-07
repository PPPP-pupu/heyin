"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import AppShell from "@/components/common/AppShell";
import AppHeader from "@/components/common/AppHeader";
import PrimaryButton from "@/components/common/PrimaryButton";
import { projectRepository } from "@/services/repositories";
import type { ChorusProject } from "@/types/project";

export default function ExplorePage() {
  const [projects, setProjects] = useState<ChorusProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    projectRepository
      .loadAllProjects()
      .then(setProjects)
      .catch(() => setProjects([]))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <AppShell>
      <AppHeader title="Explore Chorus Projects" showBack />

      <div className="px-4 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-sm text-gray-400">Loading...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-20">
            <p className="text-sm text-gray-400">
              No projects yet. Create your first chorus!
            </p>
            <div className="w-48">
              <PrimaryButton href="/create">Create Project</PrimaryButton>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {projects.map((project) => {
              const filled = project.voiceSlots.filter(
                (s) => s.status === "filled"
              ).length;
              const total = project.voiceSlots.length;
              const pct = total > 0 ? Math.round((filled / total) * 100) : 0;

              return (
                <Link
                  key={project.id}
                  href={`/project/${project.id}`}
                  className="block rounded-2xl border border-gray-100 bg-white p-4 shadow-sm hover:border-indigo-200 hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-base font-semibold text-gray-900">
                        {project.title}
                      </h3>
                      <p className="mt-0.5 text-sm text-gray-500">
                        {project.songName}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className="text-sm font-medium text-indigo-600">
                        {pct}%
                      </span>
                      <p className="text-xs text-gray-400">
                        {filled}/{total} voices
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-indigo-400 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
