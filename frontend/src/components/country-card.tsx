import Link from "next/link";
import { ArrowUpRight, Building2, GraduationCap } from "lucide-react";
import { CountryFlag } from "@/components/country-flag";
import type { Country } from "@/lib/catalog";

export function CountryCard({ country, index }: { country: Country; index: number }) {
  return (
    <Link className="country-card" href={`/countries/${country.slug}`} style={{ "--accent": country.accent } as React.CSSProperties}>
      <div className="country-card-topline">
        <span className="country-index">Destination {String(index + 1).padStart(2, "0")}</span>
        <span className="country-region">{country.region}</span>
      </div>
      <div className="country-card-main">
        <CountryFlag code={country.code} slug={country.slug} name={country.name} className="country-flag-large" />
        <div className="country-card-copy">
          <h3>{country.name}</h3>
          <p>{country.tagline}</p>
        </div>
      </div>
      <div className="country-card-bottom">
        <div className="country-card-stats">
          <span><Building2 size={15} /><strong>{country.universityCount}</strong> institutions</span>
          <span><GraduationCap size={15} /><strong>{country.programmeCount.toLocaleString()}</strong> programmes</span>
        </div>
        <span className="country-explore">Explore destination <span className="country-arrow"><ArrowUpRight size={17} /></span></span>
      </div>
    </Link>
  );
}
