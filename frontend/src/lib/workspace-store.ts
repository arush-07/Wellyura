"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

type WorkspaceState = {
  savedUniversityIds: string[];
  compareUniversityIds: string[];
  toggleSavedUniversity: (id: string) => void;
  toggleCompareUniversity: (id: string) => void;
  clearCompare: () => void;
};

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      savedUniversityIds: [],
      compareUniversityIds: [],
      toggleSavedUniversity: (id) =>
        set((state) => ({
          savedUniversityIds: state.savedUniversityIds.includes(id)
            ? state.savedUniversityIds.filter((item) => item !== id)
            : [...state.savedUniversityIds, id],
        })),
      toggleCompareUniversity: (id) =>
        set((state) => {
          if (state.compareUniversityIds.includes(id)) {
            return {
              compareUniversityIds: state.compareUniversityIds.filter((item) => item !== id),
            };
          }
          if (state.compareUniversityIds.length >= 4) return state;
          return { compareUniversityIds: [...state.compareUniversityIds, id] };
        }),
      clearCompare: () => set({ compareUniversityIds: [] }),
    }),
    { name: "wellyura-workspace" },
  ),
);
