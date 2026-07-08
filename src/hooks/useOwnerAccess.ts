"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import type { ChorusProject } from "@/types/project";
import {
  hashOwnerToken,
  loadOwnerToken,
  saveOwnerToken,
  getOwnerTokenFromUrl,
} from "@/utils/ownerToken";
import { isCloudRepositoryMode } from "@/services/repositories/repositoryMode";

export interface OwnerAccess {
  /** Whether the current user is recognized as the project owner. */
  isOwner: boolean;
  /** True while async owner check is in progress. */
  isCheckingOwner: boolean;
  /** Warning message for legacy projects without owner tokens. */
  ownerWarning?: string;
}

/**
 * useOwnerAccess — determines if the current user owns the project.
 *
 * Priority:
 *   1. URL ?owner= token → if hash matches, save to localStorage, return true
 *   2. localStorage token → if hash matches, return true
 *   3. Legacy project (no ownerTokenHash) → return isOwner=true with warning
 *   4. Otherwise → isOwner=false (viewer mode)
 */
export function useOwnerAccess(
  project: ChorusProject | null,
  projectId: string
): OwnerAccess {
  const searchParams = useSearchParams();
  const [isOwner, setIsOwner] = useState(false);
  const [isCheckingOwner, setIsCheckingOwner] = useState(true);
  const [ownerWarning, setOwnerWarning] = useState<string | undefined>();

  useEffect(() => {
    let cancelled = false;

    async function check() {
      if (!project) {
        if (!cancelled) setIsCheckingOwner(false);
        return;
      }

      // Legacy project: no ownerTokenHash stored
      if (!project.ownerTokenHash) {
        if (!cancelled) {
          // In cloud mode, warn; in local mode, allow freely
          if (isCloudRepositoryMode()) {
            setOwnerWarning(
              "Legacy project has no owner token. Anyone with the project link can manage it."
            );
          }
          setIsOwner(true); // backward compatible — allow for now
          setIsCheckingOwner(false);
        }
        return;
      }

      // Check URL ?owner= token first
      const urlToken = getOwnerTokenFromUrl(searchParams);
      if (urlToken) {
        const urlHash = await hashOwnerToken(urlToken);
        if (urlHash === project.ownerTokenHash) {
          saveOwnerToken(projectId, urlToken);
          if (!cancelled) {
            setIsOwner(true);
            setIsCheckingOwner(false);
          }
          return;
        }
        // URL token exists but doesn't match — fall through to localStorage
      }

      // Check localStorage token
      const storedToken = loadOwnerToken(projectId);
      if (storedToken) {
        const storedHash = await hashOwnerToken(storedToken);
        if (storedHash === project.ownerTokenHash) {
          if (!cancelled) {
            setIsOwner(true);
            setIsCheckingOwner(false);
          }
          return;
        }
      }

      // No matching token — viewer mode
      if (!cancelled) {
        setIsOwner(false);
        setIsCheckingOwner(false);
      }
    }

    check();

    return () => {
      cancelled = true;
    };
  }, [project, projectId, searchParams]);

  return { isOwner, isCheckingOwner, ownerWarning };
}
