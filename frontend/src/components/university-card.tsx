import Link from "next/link";
import { ArrowUpRight, BookOpen, MapPin, Sparkles } from "lucide-react";
import type { University } from "@/lib/catalog";
import { CountryFlag } from "@/components/country-flag";

export type UniversityCardData = Pick<University,
  "id" | "slug" | "name" | "flag" | "country" | "countrySlug" | "city" | "province" |
  "accent" | "programCount" | "scholarships" | "annualFeeCadMin" | "annualFeeCadMax"
>;
import { DataStatus } from "@/components/data-status";
import { SaveCompareActions } from "@/components/save-compare-actions";

export function UniversityCard({ university, variant = "default" }: { university: UniversityCardData; variant?: "default" | "compact" }) {
  return (
    <article className={`university-card university-card-${variant}`} style={{ "--accent": university.accent } as React.CSSProperties}>
      <div className="university-card-topline" />
      <div className="university-card-head university-card-head-actions">
        <SaveCompareActions universityId={university.id} />
      </div>
      <div className="university-card-copy">
        <span className="card-kicker card-kicker-flag"><CountryFlag slug={university.countrySlug} name={university.country} className="flag-inline" /> {university.country}</span>
        <h3><Link href={`/universities/${university.slug}`}>{university.name}</Link></h3>
        <p className="location"><MapPin size={15} /> {university.city}{university.province ? `, ${university.province}` : ""}</p>
      </div>
      <div className="university-card-stats">
        <div><BookOpen size={16} /><span><strong>{university.programCount}</strong> programmes</span></div>
        <div><Sparkles size={16} /><span><strong>{university.scholarships.length}</strong> funding notes</span></div>
      </div>
      <div className="fee-line">
        <span>Fee information</span>
        <strong>Being verified</strong>
      </div>
      <div className="university-card-foot">
        <DataStatus compact />
        <Link className="round-link" href={`/universities/${university.slug}`} aria-label={`View ${university.name}`}>
          <ArrowUpRight size={18} />
        </Link>
      </div>
    </article>
  );
}
