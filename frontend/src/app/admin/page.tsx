import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Database, FileWarning, History, ShieldCheck } from "lucide-react";
import { countries, programmes, universities } from "@/lib/catalog";

export const metadata: Metadata = { title: "Admin workspace", robots: { index: false, follow: false } };

const queue = [
  ["Tuition records with zero values", programmes.filter((item) => !item.annualFeeCad).length, "Needs review"],
  ["Institutions imported from v1", universities.length, "Migration"],
  ["Country datasets", countries.length, "Ready"],
  ["Programme records", programmes.length, "Staged"],
] as const;

export default function AdminPage() {
  return (
    <>
      <section className="admin-hero"><div className="shell"><span className="eyebrow eyebrow-light">Editorial operations</span><h1>Control the data.<br />Protect the trust.</h1><p>The redesigned admin is a publication and data-quality workspace—not a raw table editor.</p></div></section>
      <div className="shell admin-grid">
        <article className="admin-metric"><Database size={20} /><span>Institutions</span><strong>{universities.length}</strong></article>
        <article className="admin-metric"><ShieldCheck size={20} /><span>Verified records</span><strong>0</strong></article>
        <article className="admin-metric"><FileWarning size={20} /><span>Fee gaps</span><strong>{programmes.filter((item) => !item.annualFeeCad).length}</strong></article>
        <article className="admin-metric"><History size={20} /><span>Import batches</span><strong>12</strong></article>
      </div>
      <section className="shell admin-board">
        <article className="admin-panel"><h2>Data quality queue</h2>{queue.map(([title, count, status]) => <div className="queue-row" key={title}><div><strong>{title}</strong><span>{count.toLocaleString()} records</span></div><em>{status}</em></div>)}</article>
        <article className="admin-panel"><h2>Publishing workflow</h2><div className="queue-row"><div><strong>Draft</strong><span>New or edited records awaiting review</span></div><em>Editor</em></div><div className="queue-row"><div><strong>Review</strong><span>Source and field-level validation</span></div><em>Reviewer</em></div><div className="queue-row"><div><strong>Published</strong><span>Search-visible canonical records</span></div><em>Publisher</em></div><div className="queue-row"><div><strong>Revision history</strong><span>Rollback and complete audit trail</span></div><em>System</em></div></article>
        <article className="admin-panel"><h2>Import centre</h2><p>Legacy seed files have been converted into a staged catalogue. The FastAPI import service and PostgreSQL staging tables are included in the new architecture.</p><Link className="button button-dark" href="/admin">Review migration plan <ArrowUpRight size={17} /></Link></article>
        <article className="admin-panel"><h2>Access model</h2><p>Roles are separated into super admin, editor, reviewer, publisher, importer and read-only support. Authentication will connect through Supabase Auth.</p></article>
      </section>
    </>
  );
}
