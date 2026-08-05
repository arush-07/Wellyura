import type { Metadata } from "next";
import Link from "next/link";
import { ProgrammeCard } from "@/components/programme-card";
import { countries, searchProgrammes, subjects } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Programmes",
  description: "Explore undergraduate and postgraduate programmes across Wellyura's global catalogue.",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const get = (value: string | string[] | undefined) => typeof value === "string" ? value : "";

export default async function ProgrammesPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const q = get(params.q);
  const country = get(params.country);
  const subject = get(params.subject);
  const level = get(params.level);
  const rows = searchProgrammes({ query: q, country, subject, level, limit: 80 });

  return (
    <>
      <section className="page-hero">
        <div className="shell page-hero-grid">
          <div><span className="eyebrow">Programme catalogue</span><h1>Study what<br /><em>moves you.</em></h1></div>
          <div><p>Compare programmes by subject, degree level, destination, duration and available legacy fee context.</p></div>
        </div>
      </section>
      <div className="shell search-panel programme-search-panel">
        <form action="/programmes">
          <input className="search-field" name="q" defaultValue={q} placeholder="Search programmes or universities" aria-label="Search programmes or universities" />
          <select className="search-field" name="country" defaultValue={country} aria-label="Country">
            <option value="">Every country</option>
            {countries.map((item) => <option value={item.slug} key={item.slug}>{item.name}</option>)}
          </select>
          <select className="search-field" name="subject" defaultValue={subject} aria-label="Subject">
            <option value="">Every subject</option>
            {subjects.map((item) => <option value={item.name} key={item.slug}>{item.name}</option>)}
          </select>
          <button className="button button-coral" type="submit">Find programmes</button>
        </form>
      </div>
      <section className="shell results-layout programme-results-layout">
        <aside className="filter-sidebar">
          <h2>Refine your view</h2>
          <form action="/programmes">
            <input type="hidden" name="q" value={q} />
            <input type="hidden" name="country" value={country} />
            <input type="hidden" name="subject" value={subject} />
            <div className="filter-group">
              <label htmlFor="level">Degree level</label>
              <select id="level" name="level" defaultValue={level}>
                <option value="">All levels</option>
                <option value="UG">Undergraduate</option>
                <option value="PG">Postgraduate</option>
                <option value="PHD">Doctorate</option>
              </select>
            </div>
            <button className="button button-dark button-small" type="submit">Apply filters</button>
          </form>
          <div className="filter-group">
            <Link className="arrow-link" href="/programmes">Clear everything</Link>
          </div>
        </aside>
        <div className="programme-results-main">
          <div className="results-head">
            <div><h2>{rows.length} programmes</h2><p>Showing up to 80 matching records.</p></div>
          </div>
          {rows.length > 0 ? (
            <div className="programme-list">{rows.map((row) => <ProgrammeCard programme={row} key={row.id} />)}</div>
          ) : (
            <div className="empty-state"><h2>No matching programmes</h2><p>Try clearing the degree level or broadening your subject and destination filters.</p></div>
          )}
        </div>
      </section>
    </>
  );
}
