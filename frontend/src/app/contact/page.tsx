import type { Metadata } from "next";
import { ContactForm } from "@/components/contact-form";

export const metadata: Metadata = {
  alternates: { canonical: "/contact" },
  title: "Contact Wellyura",
  description:
    "Contact Wellyura for student questions, data corrections, university profiles, housing opportunities or collaborations.",
};

const topics = [
  [
    "Student questions",
    "Questions about navigating the platform or planning your research.",
  ],
  [
    "Data corrections",
    "Help us improve university, programme, fee or scholarship information.",
  ],
  [
    "University updates",
    "Institutional information, programme updates and verified listing requests.",
  ],
  [
    "Partnerships",
    "Housing, counselling, content and student-opportunity collaborations.",
  ],
] as const;

export default function ContactPage() {
  return (
    <>
      <section className="page-hero contact-hero">
        <div className="shell page-hero-grid">
          <div>
            <span className="eyebrow">Contact Wellyura</span>
            <h1>
              Let&apos;s build
              <br />
              <em>better journeys.</em>
            </h1>
          </div>

          <div>
            <p>
              For student questions, data corrections, university profiles,
              housing opportunities or thoughtful collaborations.
            </p>
          </div>
        </div>
      </section>

      <section className="section shell">
        <div className="contact-topic-grid">
          {topics.map(([title, description]) => (
            <article className="info-card" key={title}>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section shell contact-section">
        <ContactForm />

        <aside className="contact-aside">
          <span className="eyebrow">Good to include</span>
          <h2>Help us respond with context.</h2>

          <p>
            For data updates, include the institution, affected field, primary
            source and effective date. For collaboration enquiries, share the
            audience, idea and intended student benefit.
          </p>

          <div className="highlight-card">
            <strong>Student-first standard</strong>
            <p>
              We prioritise experiences and partnerships that make international
              study decisions clearer and more useful.
            </p>
          </div>
        </aside>
      </section>
    </>
  );
}
