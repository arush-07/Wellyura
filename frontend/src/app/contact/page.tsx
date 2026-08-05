import type { Metadata } from "next";
import { Building2, DatabaseZap, Handshake, MessageCircle } from "lucide-react";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <>
      <section className="page-hero contact-hero">
        <div className="shell page-hero-grid">
          <div><span className="eyebrow">Contact Wellyura</span><h1>Let’s build<br /><em>better journeys.</em></h1></div>
          <div><p>For student questions, data corrections, university profiles, housing opportunities or thoughtful collaborations.</p></div>
        </div>
      </section>
      <section className="section shell">
        <div className="contact-topic-grid">
          <article><MessageCircle size={22} /><strong>Student support</strong><span>Questions about navigating the platform or planning your research.</span></article>
          <article><DatabaseZap size={22} /><strong>Data corrections</strong><span>Help us improve university, programme, fee or scholarship information.</span></article>
          <article><Building2 size={22} /><strong>University profiles</strong><span>Institutional information, programme updates and verified listing requests.</span></article>
          <article><Handshake size={22} /><strong>Partnerships</strong><span>Housing, counselling, content and student-opportunity collaborations.</span></article>
        </div>
        <div className="contact-layout">
          <form className="auth-form contact-form">
            <div className="form-stack">
              <div className="form-row"><label htmlFor="name">Name</label><input id="name" placeholder="Your name" /></div>
              <div className="form-row"><label htmlFor="email">Email</label><input id="email" type="email" placeholder="you@example.com" /></div>
              <div className="form-row"><label htmlFor="topic">What can we help with?</label><select id="topic"><option>General enquiry</option><option>Student support</option><option>University data correction</option><option>University or partner enquiry</option><option>Accommodation</option></select></div>
              <div className="form-row"><label htmlFor="message">Message</label><textarea id="message" placeholder="Tell us a little about your request" /></div>
              <button type="button" className="button button-dark">Send enquiry</button>
            </div>
          </form>
          <aside className="contact-aside">
            <span className="eyebrow">Good to include</span>
            <h2>Help us respond with context.</h2>
            <p>For data updates, include the institution, affected field, primary source and effective date. For collaboration enquiries, share the audience, idea and intended student benefit.</p>
            <div className="contact-note"><strong>Student-first standard</strong><span>We prioritise experiences and partnerships that make international study decisions clearer and more useful.</span></div>
          </aside>
        </div>
      </section>
    </>
  );
}
