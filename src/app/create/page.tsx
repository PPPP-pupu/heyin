"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/common/AppShell";
import AppHeader from "@/components/common/AppHeader";
import PrimaryButton from "@/components/common/PrimaryButton";
import {
  validateProjectForm,
  type ProjectFormData,
} from "@/utils/validation";
import { buildProjectFromForm } from "@/features/project/createProject";
import { projectRepository } from "@/services/repositories";

export default function CreatePage() {
  const router = useRouter();

  const [formData, setFormData] = useState<ProjectFormData>({
    title: "",
    songName: "",
    lyrics: "",
    slotsPerLine: 3,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange(
    field: keyof ProjectFormData,
    value: string | number
  ) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
    if (saveError) setSaveError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaveError(null);

    const result = validateProjectForm(formData);
    if (!result.valid) {
      setErrors(result.errors);
      return;
    }
    setErrors({});

    setIsSubmitting(true);
    try {
      const project = buildProjectFromForm(formData);
      const savedProject = await projectRepository.saveProject(project);
      router.push(`/project/${savedProject.id}`);
    } catch (err) {
      console.error("[CreatePage] saveProject failed:", err);
      const msg = err instanceof Error ? err.message : "Failed to save project. Please try again.";
      setSaveError(msg);
      setIsSubmitting(false);
    }
  }

  const inputClasses =
    "w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400";
  const labelClasses = "text-sm font-medium text-gray-700";
  const errorClasses = "text-xs text-red-500 mt-1";

  return (
    <AppShell>
      <AppHeader title="Create Chorus Project" showBack />

      <form onSubmit={handleSubmit} className="flex flex-col gap-5 px-4 py-6">
        {saveError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {saveError}
          </div>
        )}

        <div>
          <label htmlFor="title" className={labelClasses}>Project Title</label>
          <input id="title" type="text" className={inputClasses}
            placeholder='e.g. "Our 十年 Chorus"'
            value={formData.title} onChange={(e) => handleChange("title", e.target.value)} maxLength={100} />
          {errors.title && <p className={errorClasses}>{errors.title}</p>}
        </div>

        <div>
          <label htmlFor="songName" className={labelClasses}>Song Name</label>
          <input id="songName" type="text" className={inputClasses}
            placeholder="e.g. 十年"
            value={formData.songName} onChange={(e) => handleChange("songName", e.target.value)} maxLength={100} />
          {errors.songName && <p className={errorClasses}>{errors.songName}</p>}
        </div>

        <div>
          <label htmlFor="lyrics" className={labelClasses}>Lyrics</label>
          <p className="text-xs text-gray-400 mb-1">One lyric phrase per line. Empty lines will be ignored.</p>
          <textarea id="lyrics" className={`${inputClasses} min-h-[180px] resize-y`}
            placeholder={"如果那两个字没有颤抖\n我不会发现我难受\n怎么说出口也不过是分手\n如果对于明天没有要求"}
            value={formData.lyrics} onChange={(e) => handleChange("lyrics", e.target.value)} rows={8} />
          {errors.lyrics && <p className={errorClasses}>{errors.lyrics}</p>}
        </div>

        <div>
          <label htmlFor="slotsPerLine" className={labelClasses}>Voices per Line</label>
          <p className="text-xs text-gray-400 mb-1">How many people can sing each lyric line. (1–10)</p>
          <input id="slotsPerLine" type="number" className={`${inputClasses} max-w-24`}
            min={1} max={10}
            value={formData.slotsPerLine} onChange={(e) => handleChange("slotsPerLine", Number(e.target.value))} />
          {errors.slotsPerLine && <p className={errorClasses}>{errors.slotsPerLine}</p>}
        </div>

        <div className="mt-2">
          <PrimaryButton type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Project"}
          </PrimaryButton>
        </div>
      </form>
    </AppShell>
  );
}
