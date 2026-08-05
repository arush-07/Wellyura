"use client";

import Link from "next/link";
import { GitCompareArrows, X } from "lucide-react";
import universityIndex from "@/data/university-index.json";
import { useWorkspaceStore } from "@/lib/workspace-store";

const universityMap = new Map(universityIndex.map((item) => [item.id, item]));

export function CompareDock() {
  const ids = useWorkspaceStore((state) => state.compareUniversityIds);
  const toggle = useWorkspaceStore((state) => state.toggleCompareUniversity);
  const clear = useWorkspaceStore((state) => state.clearCompare);
  const rows = ids.map((id) => universityMap.get(id)).filter(Boolean);

  if (rows.length === 0) return null;

  return (
    <aside className="compare-dock" aria-label="University comparison tray">
      <div className="compare-dock-label"><GitCompareArrows size={18} /><span>Compare</span></div>
      <div className="compare-dock-items">
        {rows.map((university) => university && (
          <div className="compare-chip" key={university.id}>
            <span style={{ background: university.accent }}>{university.name.slice(0, 2)}</span>
            <strong>{university.name}</strong>
            <button onClick={() => toggle(university.id)} aria-label={`Remove ${university.name}`}><X size={14} /></button>
          </div>
        ))}
      </div>
      <button className="dock-clear" onClick={clear}>Clear</button>
      <Link className="button button-coral button-small" href="/compare">Compare {rows.length}</Link>
    </aside>
  );
}
