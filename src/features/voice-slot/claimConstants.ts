/**
 * Claim lifecycle constants.
 *
 * CLAIM_TTL_MS: How long a claim stays valid before considered stale (15 min).
 * CLAIM_WARNING_MS: When to show "reservation expiring" warning (12 min).
 */
export const CLAIM_TTL_MS = 15 * 60 * 1000; // 15 minutes
export const CLAIM_WARNING_MS = 12 * 60 * 1000; // 12 minutes
