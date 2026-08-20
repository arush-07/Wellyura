"use client";

import Link from "next/link";
import { GitCompareArrows, Plus, Trash2 } from "lucide-react";
import universityIndex from "@/data/university-index.json";
import { CountryFlag } from "@/components/country-flag";
import { useWorkspaceStore } from "@/lib/workspace-store";

const universityMap = new Map(universityIndex.map((item) => [item.id, item]));

const rows = [
  ["Location", (item: (typeof universityIndex)[number]) => `${item.city}, ${item.country}`],
  ["Institution type", (item: (typeof universityIndex)[number]) => item.type],
  ["Programmes", (item: (typeof universityIndex)[number]) => item.programCount.toLocaleString()],
  ["Fee information", (_item: (typeof universityIndex)[number]) => "Being verified"],
  ["Typical intakes", (item: (typeof universityIndex)[number]) => item.intakes.slice(0, 3).join(", ") || "Unavailable"],
  ["Funding notes", (item: (typeof universityIndex)[number]) => String(item.scholarships.length)],
] as const;

export default function ComparePage() {
  const ids = useWorkspaceStore((state) => state.compareUniversityIds);
  const toggle = useWorkspaceStore((state) => state.toggleCompareUniversity);
  const clear = useWorkspaceStore((state) => state.clearCompare);
  const selected = ids.map((id) => universityMap.get(id)).filter((item): item is (typeof universityIndex)[number] => Boolean(item));
  const columns = Array.from({ length: 4 }, (_, index) => selected[index]);

  return (
    <>
      <section className="page-hero">
        <div className="shell page-hero-grid">
          <div><span className="eyebrow">Decision studio</span><h1>Compare what<br /><em>actually matters.</em></h1></div>
          <div><p>Line up two to four institutions and make the differences visible. Legacy data is clearly marked until verification is complete.</p></div>
        </div>
      </section>
      <section className="section shell">
        <div className="results-head">
          <div><h2>{selected.length ? `${selected.length} choices selected` : "Your comparison is empty"}</h2><p>Add universities from catalogue cards or the university detail page.</p></div>
          {selected.length > 0 && <button className="button button-outline button-small" onClick={clear}><Trash2 size={16} /> Clear</button>}
        </div>
        {selected.length === 0 ? (
          <div className="empty-state"><GitCompareArrows size={34} /><h2>Start a side-by-side decision</h2><p>Add universities using the compare icon on any university card.</p><Link className="button button-dark" href="/universities">Browse universities</Link></div>
        ) : (
          <div className="compare-table-wrap">
            <div className="compare-table">
              <div className="compare-cell compare-label">Choice</div>
              {columns.map((item, index) => item ? (
                <div className="compare-cell compare-name" key={item.id}>
                  <span className="compare-country"><CountryFlag slug={item.countrySlug} name={item.country} className="flag-inline" /> {item.country}</span><strong>{item.name}</strong>
                  <button className="mini-action" onClick={() => toggle(item.id)} aria-label={`Remove ${item.name}`}><Trash2 size={15} /></button>
                </div>
              ) : <div className="compare-cell" key={`empty-${index}`}><Link className="compare-placeholder" href="/universities"><Plus size={18} /> Add choice</Link></div>)}
              {rows.map(([label, render]) => (
                <div style={{ display: "contents" }} key={label}>
                  <div className="compare-cell compare-label">{label}</div>
                  {columns.map((item, index) => <div className="compare-cell" key={`${label}-${index}`}>{item ? render(item) : "—"}</div>)}
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </>
  );
}
