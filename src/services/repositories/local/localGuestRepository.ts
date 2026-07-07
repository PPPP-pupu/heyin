import type { GuestRepository } from "../types";
import {
  loadGuestProfile,
  saveGuestProfile,
  deleteGuestProfile,
} from "@/services/storage/guestStorage";

/**
 * localGuestRepository — wraps existing localStorage guest storage.
 */
export const localGuestRepository: GuestRepository = {
  async loadGuestProfile() {
    return loadGuestProfile();
  },

  async saveGuestProfile(profile) {
    saveGuestProfile(profile);
  },

  async deleteGuestProfile() {
    deleteGuestProfile();
  },
};
