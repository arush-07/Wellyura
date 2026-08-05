import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, BadgeDollarSign, CalendarDays, Globe2, GraduationCap } from "lucide-react";
import { CountryFlag } from "@/components/country-flag";
import { countries, universities } from "@/lib/catalog";

export const metadata: Metadata = { title: "Scholarships", description: "Explore migrated scholarship and funding notes across global universities." };

const funded = universities.filter((item) => item.scholarships.length > 0).slice(0, 12);

export default function ScholarshipsPage() {
  return (
    <>
      <section className="page-hero"><div className="shell page-hero-grid"><div><span className="eyebrow">Funding discovery</span><h1>Make the cost<br /><em>part of the search.</em></h1></div><div><p>Funding should not be hidden at the end of the journey. Wellyura connects scholarship notes to institutions and destinations while the new structured scholarship catalogue is built.</p></div></div></section>
      <section className="section shell">
        <div className="info-grid">
          <article className="info-card"><BadgeDollarSign size={23} /><h3>Funding-first filters</h3><p>Future structured filters will cover award type, value, deadline, eligibility and applicable programme.</p></article>
          <article className="info-card"><CalendarDays size={23} /><h3>Edition-aware deadlines</h3><p>Scholarship records will retain the edition and deadline instead of overwriting old values.</p></article>
          <article className="info-card"><Globe2 size={23} /><h3>Global eligibility</h3><p>Nationality, residency and destination rules will remain visible and source-linked.</p></article>
        </div>
      </section>
      <section className="programmes-section"><div className="shell"><div className="section-heading"><div><span className="eyebrow">Migrated funding notes</span><h2>Institutions with scholarship context.</h2><p>These notes require source verification before any application decision.</p></div></div><div className="result-grid">{funded.map((university) => <Link className="info-card" href={`/universities/${university.slug}`} key={university.id}><GraduationCap size={22} /><h3>{university.name}</h3><p className="inline-location"><CountryFlag slug={university.countrySlug} name={university.country} className="flag-inline" /> {university.city}, {university.country} · {university.scholarships.length} funding notes</p><span className="arrow-link">Review notes <ArrowUpRight size={16} /></span></Link>)}</div></div></section>
      <section className="section shell"><div className="section-heading"><div><span className="eyebrow">Browse destinations</span><h2>See funding context by country.</h2></div></div><div className="tag-list">{countries.map((country) => <Link href={`/countries/${country.slug}`} key={country.slug}><span className="destination-chip"><CountryFlag code={country.code} slug={country.slug} name={country.name} className="flag-inline" /> {country.name}</span></Link>)}</div></section>
    </>
  );
}
