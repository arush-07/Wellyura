"use client";

import Link from "next/link";
import universityIndex from "@/data/university-index.json";
import { UniversityCard, type UniversityCardData } from "@/components/university-card";
import { useWorkspaceStore } from "@/lib/workspace-store";

export function SavedUniversities() {
  const ids = useWorkspaceStore((state) => state.savedUniversityIds);
  const rows = universityIndex.filter((item) => ids.includes(item.id));
  if (!rows.length) return <div className="empty-state"><h2>No saved universities yet</h2><p>Use the heart icon on any university card to build your shortlist.</p><Link className="button button-dark" href="/universities">Browse universities</Link></div>;
  return <div className="university-grid">{rows.map((row) => <UniversityCard university={row as UniversityCardData} key={row.id} />)}</div>;
}
