"use client";

import {
  useEffect,
  useMemo,
} from "react";
import { createClient } from "@/lib/supabase/client";
import { useWorkspaceStore } from "@/lib/workspace-store";

export function WorkspaceSync() {
  const supabase = useMemo(
    () => createClient(),
    [],
  );

  useEffect(() => {
    let active = true;

    async function hydrate() {
      if (!active) {
        return;
      }

      await useWorkspaceStore
        .getState()
        .hydrateWorkspace();
    }

    void hydrate();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (event) => {
        window.setTimeout(() => {
          if (!active) {
            return;
          }

          if (event === "SIGNED_OUT") {
            useWorkspaceStore
              .getState()
              .resetWorkspace();

            return;
          }

          void hydrate();
        }, 0);
      },
    );

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  return null;
}
