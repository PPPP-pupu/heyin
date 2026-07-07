/**
 * Tencent not-implemented guard.
 *
 * When NEXT_PUBLIC_HEYIN_CLOUD_PROVIDER=tencent but the corresponding
 * repository has not been implemented yet, throw a clear error rather
 * than silently falling back to Supabase or local storage.
 */

export function throwTencentNotImplemented(repositoryName: string): never {
  throw new Error(
    `Tencent ${repositoryName} repository is not implemented yet. ` +
    `Complete the relevant CN migration commit first (CN-4 for Project, CN-5 for Audio, CN-7 for Work). ` +
    `Set NEXT_PUBLIC_HEYIN_CLOUD_PROVIDER=supabase to use the current Supabase backend.`
  );
}
