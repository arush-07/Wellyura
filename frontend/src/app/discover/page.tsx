import type { Metadata } from "next";
import { Search } from "lucide-react";
import { UniversityCard } from "@/components/university-card";
import { countries, searchUniversities } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Discover universities",
  description: "Discover international universities by destination, city and institution name.",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function value(input: string | string[] | undefined) {
  return typeof input === "string" ? input : "";
}

export default async function DiscoverPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const query = value(params.q);
  const country = value(params.country);
  const universityRows = searchUniversities({ query, country, limit: 48 });

  return (
    <>
      <section className="page-hero">
        <div className="shell page-hero-grid">
          <div>
            <span className="eyebrow">Discover</span>
            <h1>Search less.<br /><em>See more.</em></h1>
          </div>
          <div>
            <p>Explore universities by institution, city or destination. Open any university to view its programmes, funding notes and fee context.</p>
            <div className="page-hero-meta">
              <span className="stat-pill">268 institutions</span>
              <span className="stat-pill">12 countries</span>
              <span className="stat-pill">One connected shortlist</span>
            </div>
          </div>
        </div>
      </section>

      <div className="shell search-panel discover-search-panel">
        <form action="/discover">
          <input className="search-field" defaultValue={query} name="q" placeholder="University, city or destination" aria-label="Search universities" />
          <select className="search-field" name="country" defaultValue={country} aria-label="Country">
            <option value="">Every country</option>
            {countries.map((item) => <option value={item.slug} key={item.slug}>{item.name}</option>)}
          </select>
          <button className="button button-coral" type="submit"><Search size={18} /> Search</button>
        </form>
      </div>

      <section className="section shell discover-results">
        <div className="results-head">
          <div>
            <h2>{query ? `Universities matching “${query}”` : "Explore universities"}</h2>
            <p>{universityRows.length} institutions shown</p>
          </div>
        </div>

        {universityRows.length > 0 ? (
          <div className="university-grid">
            {universityRows.map((university) => <UniversityCard university={university} key={university.id} />)}
          </div>
        ) : (
          <div className="empty-state">
            <h2>No exact matches yet</h2>
            <p>Try a broader university name, city or destination.</p>
          </div>
        )}
        <p className="pagination-note">The first 48 matching institutions are shown. Use the search and country filter to narrow the catalogue.</p>
      </section>
    </>
  );
}
