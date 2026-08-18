import type { Metadata } from "next";
import { Building2, Globe2, GraduationCap } from "lucide-react";
import { CountryCard } from "@/components/country-card";
import { countries } from "@/lib/catalog";

export const metadata: Metadata = {
  alternates: { canonical: "/countries" },
  title: "Study destinations",
  description: "Explore Wellyura's study-abroad destinations, universities and programmes by country.",
};

export default function CountriesPage() {
  const institutionTotal = countries.reduce((sum, country) => sum + country.universityCount, 0);
  const programmeTotal = countries.reduce((sum, country) => sum + country.programmeCount, 0);

  return (
    <>
      <section className="page-hero destination-page-hero">
        <div className="shell page-hero-grid">
          <div><span className="eyebrow">Study destinations</span><h1>See the world.<br /><em>Choose with context.</em></h1></div>
          <div>
            <p>Explore destinations through programmes, institutions, cities and real decision context—not just rankings or postcard impressions.</p>
            <div className="destination-proof">
              <span><Globe2 size={17} /><strong>{countries.length}</strong> countries</span>
              <span><Building2 size={17} /><strong>{institutionTotal}</strong> institutions</span>
              <span><GraduationCap size={17} /><strong>{programmeTotal.toLocaleString()}</strong> programmes</span>
            </div>
          </div>
        </div>
      </section>
      <section className="section shell destinations-section">
        <div className="destinations-intro">
          <span className="eyebrow">Destination atlas</span>
          <h2>Start broad. Then make it personal.</h2>
          <p>Open a destination to explore its universities, programme catalogue and cities. Your shortlist and comparisons stay connected as you move.</p>
        </div>
        <div className="country-grid">{countries.map((country, index) => <CountryCard country={country} index={index} key={country.slug} />)}</div>
      </section>
    </>
  );
}
