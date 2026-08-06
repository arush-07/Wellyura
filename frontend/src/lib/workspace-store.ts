"use client";

import { create } from "zustand";
import {
  clearComparisonRemote,
  loadWorkspaceRemoteState,
  toggleComparisonRemote,
  toggleFavoriteRemote,
} from "@/lib/supabase/workspace-data";

type WorkspaceState = {
  savedUniversityIds: string[];
  compareUniversityIds: string[];
  hydrated: boolean;
  hydratedUserId: string | null;

  hydrateWorkspace: () => Promise<void>;
  toggleSavedUniversity: (
    id: string,
  ) => Promise<void>;
  toggleCompareUniversity: (
    id: string,
  ) => Promise<void>;
  clearCompare: () => Promise<void>;
  resetWorkspace: () => void;
};

function uniqueIds(
  ids: string[],
  limit?: number,
) {
  const rows = Array.from(
    new Set(ids.filter(Boolean)),
  );

  return typeof limit === "number"
    ? rows.slice(0, limit)
    : rows;
}

function getErrorMessage(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error
  ) {
    return String(
      (error as { message: unknown }).message,
    );
  }

  return "Could not update your workspace.";
}

function handleWorkspaceError(error: unknown) {
  const message = getErrorMessage(error);

  if (
    message
      .toLowerCase()
      .includes("authentication")
  ) {
    const next =
      typeof window !== "undefined"
        ? window.location.pathname
        : "/";

    window.location.assign(
      `/login?next=${encodeURIComponent(next)}`,
    );

    return;
  }

  console.warn(
    "Wellyura workspace error:",
    error,
  );

  window.alert(message);
}

export const useWorkspaceStore =
  create<WorkspaceState>((set, get) => ({
    savedUniversityIds: [],
    compareUniversityIds: [],
    hydrated: false,
    hydratedUserId: null,

    hydrateWorkspace: async () => {
      try {
        const remote =
          await loadWorkspaceRemoteState();

        set({
          savedUniversityIds:
            uniqueIds(
              remote.savedUniversityIds,
            ),

          compareUniversityIds:
            uniqueIds(
              remote.compareUniversityIds,
              4,
            ),

          hydrated: true,
          hydratedUserId:
            remote.userId,
        });
      } catch (error) {
        console.warn(
          "Unable to load Wellyura workspace:",
          error,
        );

        set({
          hydrated: true,
          hydratedUserId: null,
        });
      }
    },

    toggleSavedUniversity:
      async (id) => {
        try {
          const isSaved =
            await toggleFavoriteRemote(id);

          set((state) => ({
            savedUniversityIds:
              isSaved
                ? uniqueIds([
                    ...state.savedUniversityIds,
                    id,
                  ])
                : state.savedUniversityIds.filter(
                    (item) =>
                      item !== id,
                  ),
          }));
        } catch (error) {
          handleWorkspaceError(error);
        }
      },

    toggleCompareUniversity:
      async (id) => {
        try {
          const isCompared =
            await toggleComparisonRemote(id);

          set((state) => ({
            compareUniversityIds:
              isCompared
                ? uniqueIds(
                    [
                      ...state.compareUniversityIds,
                      id,
                    ],
                    4,
                  )
                : state.compareUniversityIds.filter(
                    (item) =>
                      item !== id,
                  ),
          }));
        } catch (error) {
          handleWorkspaceError(error);
        }
      },

    clearCompare: async () => {
      try {
        await clearComparisonRemote();

        set({
          compareUniversityIds: [],
        });
      } catch (error) {
        handleWorkspaceError(error);
      }
    },

    resetWorkspace: () => {
      set({
        savedUniversityIds: [],
        compareUniversityIds: [],
        hydrated: true,
        hydratedUserId: null,
      });
    },
  }));

