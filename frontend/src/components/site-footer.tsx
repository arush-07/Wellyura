import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";

const columns = [
  {
    title: "Explore",
    links: [
      ["Universities", "/universities"],
      ["Programmes", "/programmes"],
      ["Countries", "/countries"],
      ["Accommodation", "/accommodation"],
    ],
  },
  {
    title: "Plan",
    links: [
      ["Discover", "/discover"],
      ["Compare", "/compare"],
      ["Saved choices", "/workspace/saved"],
      ["Student workspace", "/workspace"],
      ["Guides", "/guides"],
    ],
  },
  {
    title: "Wellyura",
    links: [
      ["About", "/about"],
      ["Contact", "/contact"],
      ["For universities & partners", "/contact?topic=partners"],
      ["FAQ", "/faq"],
      ["Privacy", "/privacy"],
      ["Terms", "/terms"],
    ],
  },
] as const;

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="shell footer-cta">
        <div>
          <span className="eyebrow eyebrow-light">Make your next move with context</span>
          <h2>Build a global study plan that feels clear, personal and possible.</h2>
        </div>
        <Link className="button button-lime" href="/discover">
          Start discovering <ArrowUpRight size={18} />
        </Link>
      </div>
      <div className="shell footer-grid">
        <div className="footer-brand">
          <BrandMark />
          <p>A modern global study platform for students, institutions and trusted education partners.</p>
          <span className="data-note">Legacy catalogue values are being reverified for v2.</span>
        </div>
        {columns.map((column) => (
          <div key={column.title}>
            <h3>{column.title}</h3>
            <ul>
              {column.links.map(([label, href]) => (
                <li key={`${label}-${href}`}><Link href={href}>{label}</Link></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="shell footer-bottom">
        <span>© {new Date().getFullYear()} Wellyura</span>
        <span>Student-first · globally minded · built with room to grow</span>
      </div>
    </footer>
  );
}
