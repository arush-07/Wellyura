import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, BookOpenText, Calculator, ClipboardCheck, House } from "lucide-react";

export const metadata: Metadata = {
  alternates: { canonical: "/guides" }, title: "Study abroad guides" };
const guides = [
  ["How to build a realistic university shortlist", "Decision planning", ClipboardCheck],
  ["Understand tuition beyond the headline number", "Costs & funding", Calculator],
  ["Choose accommodation around the right campus", "Student housing", House],
  ["Read rankings without letting them make the decision", "Research skills", BookOpenText],
] as const;

export default function GuidesPage() {
  return <><section className="page-hero"><div className="shell page-hero-grid"><div><span className="eyebrow">Guides</span><h1>Know what to<br /><em>look for.</em></h1></div><div><p>Editorial guidance designed around real study decisions. The article publishing system is reserved for the next content phase.</p></div></div></section><section className="section shell"><div className="info-grid">{guides.map(([title, label, Icon]) => <article className="info-card" key={title}><Icon size={24} /><span className="card-kicker">{label}</span><h3>{title}</h3><p>A structured Wellyura guide will combine decision frameworks with country and catalogue data.</p><Link className="arrow-link" href="/contact">Get notified <ArrowUpRight size={16} /></Link></article>)}</div></section></>;
}
