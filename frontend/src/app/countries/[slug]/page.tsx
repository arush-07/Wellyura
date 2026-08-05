import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CountryFlag } from "@/components/country-flag";
import { ProgrammeCard } from "@/components/programme-card";
import { SectionHeading } from "@/components/section-heading";
import { UniversityCard } from "@/components/university-card";
import { getCountry, programmes, universities } from "@/lib/catalog";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const country = getCountry(slug);
  if (!country) return { title: "Country not found" };
  return { title: `Study in ${country.name}`, description: `Explore universities and programmes in ${country.name} with Wellyura.` };
}

export default async function CountryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const country = getCountry(slug);
  if (!country) notFound();
  const countryUniversities = universities.filter((row) => row.countrySlug === country.slug).slice(0, 12);
  const countryProgrammes = programmes.filter((row) => row.countrySlug === country.slug).slice(0, 10);

  return (
    <>
      <section className="entity-hero" style={{ "--accent": country.accent } as React.CSSProperties}>
        <div className="shell entity-heading">
          <div>
            <span className="eyebrow eyebrow-with-flag"><CountryFlag code={country.code} slug={country.slug} name={country.name} className="flag-inline" /> {country.region}</span>
            <h1>Study in {country.name}</h1>
            <p>{country.tagline} {country.description}</p>
            <div className="page-hero-meta"><span className="stat-pill">{country.universityCount} institutions</span><span className="stat-pill">{country.programmeCount.toLocaleString()} programmes</span><span className="stat-pill">{country.cityCount} cities</span></div>
          </div>
          <div className="country-hero-visual" style={{ "--accent": country.accent } as React.CSSProperties}><CountryFlag code={country.code} slug={country.slug} name={country.name} className="country-hero-flag" /><span>{country.code}</span><small>Study destination</small></div>
        </div>
      </section>
      <section className="section shell">
        <SectionHeading eyebrow="Institutions" title={`Explore universities in ${country.name}.`} href={`/universities?country=${country.slug}`} linkLabel="See all institutions" />
        <div className="university-grid">{countryUniversities.map((row) => <UniversityCard university={row} key={row.id} />)}</div>
      </section>
      <section className="programmes-section"><div className="shell">
        <SectionHeading eyebrow="Programmes" title={`Study options across ${country.name}.`} href={`/programmes?country=${country.slug}`} linkLabel="See all programmes" />
        <div className="programme-list">{countryProgrammes.map((row) => <ProgrammeCard programme={row} key={row.id} />)}</div>
      </div></section>
      <section className="section shell">
        <SectionHeading eyebrow="Cities in the catalogue" title="See where study and daily life meet." />
        <div className="tag-list">{country.cities.map((city) => <span key={city}>{city}</span>)}</div>
      </section>
    </>
  );
}
