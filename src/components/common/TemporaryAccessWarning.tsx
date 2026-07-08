"use client";

import { isUnstableShareOrigin } from "@/utils/publicBaseUrl";

/**
 * TemporaryAccessWarning — shows an amber banner when the app is served
 * from an EdgeOne Makers preview URL without a stable custom domain.
 *
 * EdgeOne preview URLs may expire or return 401 on mobile after 3 hours.
 * This warning prompts the developer to configure a stable public base URL.
 */
export default function TemporaryAccessWarning() {
  if (!isUnstableShareOrigin()) return null;

  return (
    <div className="mx-4 mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700 text-center">
      This is an EdgeOne Makers temporary preview link. It may expire or show 401 on mobile.
      For stable testing, bind a custom domain and set NEXT_PUBLIC_HEYIN_PUBLIC_BASE_URL.
    </div>
  );
}
