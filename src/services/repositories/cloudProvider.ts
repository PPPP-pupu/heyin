/**
 * Cloud provider detection.
 *
 * Reads NEXT_PUBLIC_HEYIN_CLOUD_PROVIDER from environment.
 *
 * Allowed values:
 *   "supabase" (default) → Supabase PostgreSQL + Storage
 *   "tencent"             → Tencent CloudBase / COS (future, CN-2+)
 *
 * The provider is only relevant when NEXT_PUBLIC_HEYIN_STORAGE_MODE === "cloud".
 * In "local" mode, the provider is ignored.
 */

export type CloudProvider = "supabase" | "tencent";

export function getCloudProvider(): CloudProvider {
  const provider = process.env.NEXT_PUBLIC_HEYIN_CLOUD_PROVIDER;
  if (provider === "tencent") return "tencent";
  return "supabase";
}

export function isSupabaseProvider(): boolean {
  return getCloudProvider() === "supabase";
}

export function isTencentProvider(): boolean {
  return getCloudProvider() === "tencent";
}
