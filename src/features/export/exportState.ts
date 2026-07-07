import type { MixProgress } from "@/features/audio/mixer/mixTypes";

export type ExportState = "idle" | "loading" | "mixing" | "ready" | "error";

export interface ExportStatus {
  state: ExportState;
  progress?: MixProgress;
  error?: string;
}
