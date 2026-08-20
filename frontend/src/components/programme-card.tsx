import Link from "next/link";
import { ArrowUpRight, Clock3, MapPin } from "lucide-react";
import type { Programme } from "@/lib/catalog";
import { DataStatus } from "@/components/data-status";

export function ProgrammeCard({ programme }: { programme: Programme }) {
  return (
    <article className="programme-card" style={{ "--accent": programme.accent } as React.CSSProperties}>
      <div className="programme-card-index">{programme.levelCode || "PRG"}</div>
      <div className="programme-card-main">
        <div className="programme-meta">
          <span>{programme.subject}</span>
          <span>{programme.level}</span>
        </div>
        <h3><Link href={`/programmes/${programme.slug}`}>{programme.name}</Link></h3>
        <p className="programme-university">{programme.universityName}</p>
        <div className="programme-facts">
          <span><MapPin size={14} /> {programme.city}, {programme.country}</span>
          <span><Clock3 size={14} /> {programme.durationYears ? `${programme.durationYears} years` : "Duration unavailable"}</span>
        </div>
      </div>
      <div className="programme-card-side">
        <span>Fee information</span>
        <strong>Being verified</strong>
        <DataStatus compact />
        <Link className="round-link" href={`/programmes/${programme.slug}`} aria-label={`View ${programme.name}`}>
          <ArrowUpRight size={18} />
        </Link>
      </div>
    </article>
  );
}
