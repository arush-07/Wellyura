import { BreadcrumbStructuredData } from "@/components/breadcrumb-structured-data";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, BookOpen, Clock3, GraduationCap, MapPin } from "lucide-react";
import { DataStatus } from "@/components/data-status";
import { getProgramme, getUniversity } from "@/lib/catalog";
import { formatCad } from "@/lib/format";


export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const programme = getProgramme(slug);

  if (!programme) {
    return {
      title: "Programme not found",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  return {
    title: `${programme.name} at ${programme.universityName}`,
    description: `Explore ${programme.name}, a ${programme.level.toLowerCase()} programme at ${programme.universityName}.`,
    alternates: {
      canonical: `/programmes/${programme.slug}`,
    },
  };
}

export default async function ProgrammePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const programme = getProgramme(slug);
  if (!programme) notFound();
  const university = getUniversity(programme.universitySlug);

  return (
    <>
      <BreadcrumbStructuredData
        items={[
          { name: "Programmes", path: "/programmes" },
          { name: programme.universityName, path: `/universities/${programme.universitySlug}` },
          { name: programme.name, path: `/programmes/${programme.slug}` },
        ]}
      />
      <section className="entity-hero">
        <div className="shell">
          <div className="entity-breadcrumb"><Link href="/programmes">Programmes</Link><span>/</span><Link href={`/universities/${programme.universitySlug}`}>{programme.universityName}</Link><span>/</span><strong>{programme.name}</strong></div>
          <div className="entity-heading">
            <div>
              <span className="eyebrow">{programme.subject} · {programme.level}</span>
              <h1>{programme.name}</h1>
              <p>Explore the available legacy programme information, then verify current tuition, requirements and intake dates with the institution before applying.</p>
              <div className="entity-actions">
                <Link className="button button-dark" href={`/universities/${programme.universitySlug}`}>View university <ArrowRight size={17} /></Link>
                <Link className="button button-outline" href="/workspace">Save to study plan</Link>
              </div>
            </div>
            <div className="entity-monogram" style={{ "--accent": programme.accent } as React.CSSProperties}>{programme.levelCode || "PRG"}</div>
          </div>
        </div>
      </section>

      <div className="entity-stat-strip shell">
        <div><span>Institution</span><strong>{programme.universityName}</strong></div>
        <div><span>Location</span><strong>{programme.city}, {programme.country}</strong></div>
        <div><span>Duration</span><strong>{programme.durationYears ? `${programme.durationYears} years` : "Unavailable"}</strong></div>
        <div><span>Legacy annual tuition</span><strong>{formatCad(programme.annualFeeCad)}</strong></div>
      </div>

      <div className="shell entity-layout">
        <div>
          <section className="entity-section">
            <h2>Programme overview</h2>
            <dl className="detail-list">
              <div><dt>Study level</dt><dd>{programme.level}</dd></div>
              <div><dt>Subject area</dt><dd>{programme.subject}</dd></div>
              <div><dt>Faculty / school</dt><dd>{programme.faculty || "Not available"}</dd></div>
              <div><dt>Duration</dt><dd>{programme.durationYears ? `${programme.durationYears} years` : "Not available"}</dd></div>
              <div><dt>Legacy annual tuition</dt><dd>{formatCad(programme.annualFeeCad)}</dd></div>
              <div><dt>Legacy total tuition</dt><dd>{formatCad(programme.totalFeeCad)}</dd></div>
            </dl>
          </section>

          <section className="entity-section">
            <h2>Entry information</h2>
            {programme.minClass12Percent && <p>Legacy minimum Class 12 percentage recorded: <strong>{programme.minClass12Percent}%</strong>.</p>}
            <div className="tag-list">
              {programme.requirements.length ? programme.requirements.map((requirement) => <span key={requirement}>{requirement}</span>) : <span>Requirements not available</span>}
            </div>
          </section>

          <section className="entity-section">
            <h2>Possible career directions</h2>
            <div className="tag-list">
              {programme.careerRoles.length ? programme.careerRoles.map((role) => <span key={role}>{role}</span>) : <span>Career-role data not available</span>}
            </div>
          </section>
        </div>

        <aside className="entity-sidebar">
          <div className="sidebar-card">
            <h3>{programme.universityName}</h3>
            <p><MapPin size={14} /> {programme.city}, {programme.country}</p>
            <p><GraduationCap size={14} /> {university?.programCount ? university.programCount : "\u2014"} programmes in the migrated catalogue</p>
            <p><Clock3 size={14} /> {programme.durationYears ? `${programme.durationYears} years` : "Duration unavailable"}</p>
            <p><BookOpen size={14} /> {programme.level}</p>
            <Link className="button button-lime" href={`/universities/${programme.universitySlug}`}>Explore university</Link>
          </div>
          <div className="sidebar-card source-box">
            <strong>Data verification notice</strong>
            <p>This programme was migrated from legacy seed data. All application decisions must use current official information.</p>
            <DataStatus />
          </div>
        </aside>
      </div>
    </>
  );
}
