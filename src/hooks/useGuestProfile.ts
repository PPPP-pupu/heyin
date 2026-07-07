"use client";

import { useState, useCallback, useEffect } from "react";
import { generateId } from "@/utils/id";
import {
  loadGuestProfile,
  saveGuestProfile,
} from "@/services/storage/guestStorage";

export interface GuestProfile {
  /** Stable unique id — generated once, persisted forever */
  id: string;
  nickname: string;
  province?: string;
}

/**
 * useGuestProfile — persist guest identity.
 *
 * Layer: State Layer (🟥)
 *
 * Delegates all localStorage access to guestStorage (⬛ Storage Layer).
 * Hook never touches window.localStorage directly.
 *
 * On first visit: no stored profile → user must enter nickname.
 * On return visits: auto-fills from localStorage.
 * The `id` is a UUID generated once on first save.
 */
export function useGuestProfile() {
  const [profile, setProfile] = useState<GuestProfile | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Hydrate from localStorage after mount (SSR-safe)
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    const saved = loadGuestProfile();
    if (saved) setProfile(saved);
    setIsLoaded(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const saveProfile = useCallback(
    (p: { nickname: string; province?: string }) => {
      const full: GuestProfile = {
        id: profile?.id ?? generateId("guest-"),
        nickname: p.nickname,
        province: p.province || undefined,
      };
      saveGuestProfile(full);
      setProfile(full);
    },
    [profile?.id]
  );

  /** Update just the nickname (keeps existing id and province). */
  const updateNickname = useCallback(
    (nickname: string) => {
      if (!profile) return;
      const updated = { ...profile, nickname };
      saveGuestProfile(updated);
      setProfile(updated);
    },
    [profile]
  );

  return { profile, isLoaded, saveProfile, updateNickname };
}
