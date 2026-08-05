"use client";

import { GitCompareArrows, Heart } from "lucide-react";
import { useWorkspaceStore } from "@/lib/workspace-store";

export function SaveCompareActions({ universityId }: { universityId: string }) {
  const saved = useWorkspaceStore((state) => state.savedUniversityIds.includes(universityId));
  const compared = useWorkspaceStore((state) => state.compareUniversityIds.includes(universityId));
  const toggleSaved = useWorkspaceStore((state) => state.toggleSavedUniversity);
  const toggleCompare = useWorkspaceStore((state) => state.toggleCompareUniversity);

  return (
    <div className="card-actions" onClick={(event) => event.stopPropagation()}>
      <button
        type="button"
        className={saved ? "mini-action active" : "mini-action"}
        onClick={() => toggleSaved(universityId)}
        aria-label={saved ? "Remove from saved" : "Save university"}
      >
        <Heart size={17} fill={saved ? "currentColor" : "none"} />
      </button>
      <button
        type="button"
        className={compared ? "mini-action active" : "mini-action"}
        onClick={() => toggleCompare(universityId)}
        aria-label={compared ? "Remove from compare" : "Add to compare"}
      >
        <GitCompareArrows size={17} />
      </button>
    </div>
  );
}
