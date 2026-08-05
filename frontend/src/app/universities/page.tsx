import type { Metadata } from "next";
import { UniversityCard } from "@/components/university-card";
import { UniversitySearchForm } from "@/components/university-search-form";
import { countries, searchUniversities, universities } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Universities",
  description: "Explore international universities and colleges across 12 study destinations.",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const get = (value: string | string[] | undefined) => (typeof value === "string" ? value : "");

const citiesByCountry = Object.fromEntries(
  countries.map((country) => [
    country.slug,
    Array.from(
      new Set(
        universities
          .filter((university) => university.countrySlug === country.slug)
          .map((university) => university.city.trim())
          .filter(Boolean),
      ),
    ).sort((a, b) => a.localeCompare(b)),
  ]),
);

export default async function UniversitiesPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const q = get(params.q);
  const country = get(params.country);
  const requestedCity = get(params.city);
  const city = country && (citiesByCountry[country] ?? []).includes(requestedCity) ? requestedCity : "";
  const rows = searchUniversities({ query: q, country, city });
  const selectedCountry = countries.find((item) => item.slug === country);
  const locationLabel = selectedCountry
    ? city
      ? `${city}, ${selectedCountry.name}`
      : selectedCountry.name
    : city || "the catalogue";

  return (
    <>
      <section className="page-hero">
        <div className="shell page-hero-grid">
          <div>
            <span className="eyebrow">University catalogue</span>
            <h1>
              Open the
              <br />
              <em>right doors.</em>
            </h1>
          </div>
          <div>
            <p>Browse institutions with programme depth, location, intake and funding context visible from the beginning.</p>
          </div>
        </div>
      </section>

      <div className="shell search-panel university-search-panel">
        <UniversitySearchForm
          countries={countries.map(({ name, slug }) => ({ name, slug }))}
          citiesByCountry={citiesByCountry}
          initialQuery={q}
          initialCountry={country}
          initialCity={city}
        />
      </div>

      <section className="section shell">
        <div className="results-head">
          <div>
            <h2>
              {rows.length} {rows.length === 1 ? "institution" : "institutions"}
            </h2>
            <p>
              {selectedCountry || city
                ? `All matching catalogue institutions in ${locationLabel}.`
                : "All matching institutions in the catalogue."}
            </p>
          </div>
        </div>
        <div className="university-grid">
          {rows.map((row) => (
            <UniversityCard university={row} key={row.id} />
          ))}
        </div>
      </section>
    </>
  );
}
