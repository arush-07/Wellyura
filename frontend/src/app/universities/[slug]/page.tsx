import { BreadcrumbStructuredData } from "@/components/breadcrumb-structured-data";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, Building2, CalendarDays, Globe2, MapPin } from "lucide-react";
import { DataStatus } from "@/components/data-status";
import { CountryFlag } from "@/components/country-flag";
import { ProgrammeCard } from "@/components/programme-card";
import { SaveCompareActions } from "@/components/save-compare-actions";
import { getUniversity, getUniversityProgrammes } from "@/lib/catalog";
import { formatCad } from "@/lib/format";


export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const university = getUniversity(slug);

  if (!university) {
    return {
      title: "University not found",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  return {
    title: university.name,
    description: `Explore programmes, legacy tuition data, intakes and scholarship notes for ${university.name} in ${university.city}, ${university.country}.`,
    alternates: {
      canonical: `/universities/${university.slug}`,
    },
  };
}

export default async function UniversityPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const university = getUniversity(slug);
  if (!university) notFound();
  const universityProgrammes = getUniversityProgrammes(university.id, 12);

  return (
    <>
      <BreadcrumbStructuredData
        items={[
          { name: "Universities", path: "/universities" },
          { name: university.country, path: `/countries/${university.countrySlug}` },
          { name: university.name, path: `/universities/${university.slug}` },
        ]}
      />
      <section className="entity-hero">
        <div className="shell">
          <div className="entity-breadcrumb">
            <Link href="/universities">Universities</Link><span>/</span><Link href={`/countries/${university.countrySlug}`}>{university.country}</Link><span>/</span><strong>{university.name}</strong>
          </div>
          <div className="entity-heading">
            <div>
              <span className="eyebrow eyebrow-with-flag"><CountryFlag slug={university.countrySlug} name={university.country} className="flag-inline" /> {university.type}</span>
              <h1>{university.name}</h1>
              <p>{university.description}</p>
              <div className="entity-actions">
                <SaveCompareActions universityId={university.id} />
                <Link className="button button-dark" href="#programmes">Explore programmes</Link>
                {university.website && <a className="button button-outline" href={university.website} rel="noreferrer" target="_blank">Official website <ArrowUpRight size={17} /></a>}
              </div>
            </div>
            <div className="entity-monogram" style={{ "--accent": university.accent } as React.CSSProperties}>
              {university.abbreviation || university.name.slice(0, 2)}
            </div>
          </div>
        </div>
      </section>

      <div className="entity-stat-strip shell">
        <div><span>Location</span><strong>{university.city}, {university.country}</strong></div>
        <div><span>Programme catalogue</span><strong>{university.programCount} programmes</strong></div>
        <div><span>Legacy annual range</span><strong>{university.annualFeeCadMin ? `${formatCad(university.annualFeeCadMin, true)}–${formatCad(university.annualFeeCadMax, true)}` : "Unavailable"}</strong></div>
        <div><span>Funding notes</span><strong>{university.scholarships.length || "None listed"}</strong></div>
      </div>

      <div className="shell entity-layout">
        <div>
          <section className="entity-section">
            <h2>At a glance</h2>
            <dl className="detail-list">
              <div><dt>Institution type</dt><dd>{university.type}</dd></div>
              <div><dt>City</dt><dd>{university.city}</dd></div>
              <div><dt>Region / state</dt><dd>{university.province || "Not available"}</dd></div>
              <div><dt>Campuses</dt><dd>{university.campuses.length ? university.campuses.join(", ") : "Not available"}</dd></div>
              <div><dt>Application fee</dt><dd>{university.applicationFeeCad ? `${formatCad(university.applicationFeeCad)} legacy CAD value` : "Not available"}</dd></div>
            </dl>
          </section>

          <section className="entity-section" id="programmes">
            <h2>Programmes</h2>
            {universityProgrammes.length ? (
              <div className="programme-list">{universityProgrammes.map((programme) => <ProgrammeCard programme={programme} key={programme.id} />)}</div>
            ) : <p>No programme records have been migrated for this institution yet.</p>}
          </section>

          <section className="entity-section">
            <h2>Typical intakes</h2>
            <div className="tag-list">
              {university.intakes.length ? university.intakes.map((intake) => <span key={intake}><CalendarDays size={13} /> {intake}</span>) : <span>Not available</span>}
            </div>
          </section>

          <section className="entity-section">
            <h2>Scholarship and funding notes</h2>
            {university.scholarships.length ? (
              <div className="detail-list">
                {university.scholarships.map((scholarship, index) => <div key={`${scholarship}-${index}`}><dt>Funding note {index + 1}</dt><dd>{scholarship}</dd></div>)}
              </div>
            ) : <p>No scholarship notes were present in the legacy catalogue.</p>}
          </section>
        </div>

        <aside className="entity-sidebar">
          <div className="sidebar-card">
            <h3>Build this into your plan</h3>
            <p>Save the institution, add it to comparison and keep your decision context in one workspace.</p>
            <Link className="button button-lime" href="/workspace">Open my plan</Link>
          </div>
          <div className="sidebar-card">
            <h3>Institution details</h3>
            <p><MapPin size={14} /> {university.city}, {university.province || university.country}</p>
            <p><Building2 size={14} /> {university.type}</p>
            <p><Globe2 size={14} /> {university.country}</p>
          </div>
          <div className="sidebar-card source-box">
            <strong>Data verification notice</strong>
            <p>This record was migrated from Wellyura v1. Fees, deadlines, admission requirements and scholarships must be checked against primary institutional sources before use.</p>
            <DataStatus />
          </div>
        </aside>
      </div>
    </>
  );
}
