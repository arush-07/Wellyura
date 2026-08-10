import Link from "next/link";
import {
  ArrowRight,
  BadgeDollarSign,
  BookMarked,
  Building2,
  Compass,
  GitCompareArrows,
  GraduationCap,
  Handshake,
  Landmark,
  Map,
  Search,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { CountryCard } from "@/components/country-card";
import { CountryFlag } from "@/components/country-flag";
import { ProgrammeCard } from "@/components/programme-card";
import { SectionHeading } from "@/components/section-heading";
import { UniversityCard } from "@/components/university-card";
import { countries, subjects, topProgrammes, topUniversities } from "@/lib/catalog";

const journey = [
  { icon: Compass, number: "01", title: "Discover", copy: "Start with a subject, destination, budget or simply an ambition." },
  { icon: BookMarked, number: "02", title: "Shortlist", copy: "Collect universities and programmes into a plan that makes sense." },
  { icon: GitCompareArrows, number: "03", title: "Compare", copy: "See the real differences in tuition, intakes, requirements and location." },
  { icon: GraduationCap, number: "04", title: "Move forward", copy: "Turn research into a practical timeline for your next step." },
];

export default function HomePage() {
  const featuredUniversities = topUniversities(6);
  const featuredProgrammes = topProgrammes(6);

  return (
    <>
      <section className="hero-section">
        <div className="hero-grid shell">
          <div className="hero-copy">
            <span className="eyebrow">Global study decisions, made clearer</span>
            <h1>Your future is<br /><em>global.</em></h1>
            <p>
              Search programmes, compare real costs, save your strongest options and turn scattered study-abroad research into one clear plan.
            </p>
            <form className="hero-search" action="/discover">
              <Search size={21} />
              <input name="q" aria-label="Search universities and programmes" placeholder="Search a course, university or destination" />
              <button type="submit">Explore <ArrowRight size={18} /></button>
            </form>
            <div className="hero-suggestions">
              <span>Popular now</span>
              {subjects.slice(0, 4).map((subject) => (
                <Link key={subject.slug} href={`/programmes?subject=${encodeURIComponent(subject.name)}`}>{subject.name}</Link>
              ))}
            </div>
          </div>
          <div className="atlas-stage" aria-label="Global study discovery illustration">
            <div className="atlas-orbit atlas-orbit-one" />
            <div className="atlas-orbit atlas-orbit-two" />
            <div className="atlas-globe">
              <span className="atlas-coordinate">51.5072Â° N</span>
              <strong>YOUR<br />NEXT<br />PLACE</strong>
              <span className="atlas-coordinate atlas-coordinate-bottom">0.1276Â° W</span>
            </div>
            <div className="floating-card floating-card-one">
              <CountryFlag code="GB" name="United Kingdom" className="floating-flag" /><div><strong>United Kingdom</strong><small>20 institutions</small></div>
            </div>
            <div className="floating-card floating-card-two">
              <CountryFlag code="CA" name="Canada" className="floating-flag" /><div><strong>Canada</strong><small>200 programmes</small></div>
            </div>
            <div className="floating-card floating-card-three">
              <Sparkles size={18} /><div><strong>Plan matched</strong><small>3 choices saved</small></div>
            </div>
            <div className="atlas-stamp">W / 26</div>
          </div>
        </div>
        <div className="hero-marquee" aria-label="Explore universities, programmes, accommodation, comparison and planning">
          <div className="hero-marquee-track" aria-hidden="true">
            {[0, 1].map((group) => (
              <div className="hero-marquee-group" key={group}>
                {[0, 1].flatMap((cycle) =>
                  ['Universities', 'Programmes', 'Accommodation', 'Compare', 'Plan'].map((item) => (
                    <span key={`${group}-${cycle}-${item}`}>{item}</span>
                  )),
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="snapshot-section shell">
        <div className="snapshot-intro">
          <span className="eyebrow">One catalogue. More context.</span>
          <h2>Research with the important details still attached.</h2>
        </div>
        <div className="snapshot-grid">
          <div><Building2 size={22} /><strong>268</strong><span>Institutions migrated</span></div>
          <div><GraduationCap size={22} /><strong>4,102</strong><span>Programmes indexed</span></div>
          <div><Map size={22} /><strong>12</strong><span>Countries covered</span></div>
          <div><BadgeDollarSign size={22} /><strong>1</strong><span>Connected planning workspace</span></div>
        </div>
      </section>

      <section className="section shell">
        <SectionHeading
          eyebrow="Browse the atlas"
          title="Choose a destination. Keep the decision connected."
          description="Each destination brings together institutions, programmes, cities, fees and funding notes in one place."
          href="/countries"
        />
        <div className="country-grid">
          {countries.slice(0, 6).map((country, index) => <CountryCard country={country} index={index} key={country.slug} />)}
        </div>
      </section>

      <section className="decision-section">
        <div className="shell decision-grid">
          <div className="decision-copy">
            <span className="eyebrow eyebrow-light">The decision studio</span>
            <h2>Not another heart icon.<br />A real shortlist.</h2>
            <p>Group options, keep notes, compare meaningful differences and return to the exact point in your decision.</p>
            <Link className="button button-lime" href="/workspace">Open your study plan <ArrowRight size={18} /></Link>
          </div>
          <div className="decision-board">
            <div className="board-top"><span>MY STUDY PLAN / FALL 2027</span><span>03 OPTIONS</span></div>
            <div className="board-row board-header"><span>Choice</span><span>Tuition</span><span>Intake</span><span>Status</span></div>
            <div className="board-row"><strong>University of Toronto</strong><span>CAD 61K</span><span>Sep</span><em>Target</em></div>
            <div className="board-row"><strong>University of Melbourne</strong><span>CAD 44K</span><span>Feb</span><em>Explore</em></div>
            <div className="board-row"><strong>Technical University of Munich</strong><span>Review</span><span>Oct</span><em>Saved</em></div>
            <div className="board-note">Data shown here is interface demonstration content.</div>
          </div>
        </div>
      </section>

      <section className="section shell">
        <SectionHeading
          eyebrow="University signals"
          title="Start with institutions worth opening."
          description="A first look at catalogue breadth, programme availability and funding notesâ€”not an unexplained ranking score."
          href="/universities"
        />
        <div className="university-grid">
          {featuredUniversities.map((university) => <UniversityCard university={university} key={university.id} />)}
        </div>
      </section>

      <section className="programmes-section">
        <div className="shell">
          <SectionHeading
            eyebrow="Programme-first discovery"
            title="Because students study programmesâ€”not logos."
            description="Explore the course, level, location, requirements and fee context before choosing the institution around it."
            href="/programmes"
          />
          <div className="programme-list">
            {featuredProgrammes.map((programme) => <ProgrammeCard programme={programme} key={programme.id} />)}
          </div>
        </div>
      </section>

      <section className="ecosystem-section">
        <div className="shell ecosystem-grid">
          <div className="ecosystem-copy">
            <span className="eyebrow eyebrow-light">Student-first. Partner-ready.</span>
            <h2>Built for ambitious students and the global ecosystem supporting them.</h2>
            <p>Wellyura keeps the experience fresh and approachable for students while giving universities and education partners a credible, structured place to be discovered.</p>
            <Link className="button button-lime" href="/contact">Connect with Wellyura <ArrowRight size={18} /></Link>
          </div>
          <div className="ecosystem-cards">
            <article><UsersRound size={22} /><span>For students</span><strong>Clear choices, less noise.</strong><p>Search, compare and plan without jumping across dozens of tabs.</p></article>
            <article><Landmark size={22} /><span>For institutions</span><strong>Profiles with real context.</strong><p>Present programmes, costs, funding and campus information consistently.</p></article>
            <article><Handshake size={22} /><span>For partners</span><strong>Useful pathways, not banner clutter.</strong><p>Support students through trusted housing, guidance and opportunity connections.</p></article>
            <article><ShieldCheck size={22} /><span>For everyone</span><strong>Transparency by design.</strong><p>Source status and verification context stay visible throughout the decision.</p></article>
          </div>
        </div>
      </section>

      <section className="section shell">
        <SectionHeading eyebrow="A clearer route" title="From open tabs to an actual decision." />
        <div className="journey-grid">
          {journey.map(({ icon: Icon, number, title, copy }) => (
            <article key={number}>
              <div><span>{number}</span><Icon size={24} /></div>
              <h3>{title}</h3>
              <p>{copy}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
