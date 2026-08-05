import type { Metadata } from "next";
export const metadata: Metadata = { title: "Frequently asked questions" };
const questions = [
  ["Is Wellyura free for students?", "The public discovery, shortlist and comparison experience is designed to be free. Future counselling or application services may have separate commercial terms."],
  ["Are the tuition values current?", "Values migrated from Wellyura v1 are explicitly labelled as legacy data. Students must verify current fees with official university sources."],
  ["Can I compare universities?", "Yes. Add up to four institutions using the compare icon, then open the comparison tray."],
  ["Does Wellyura submit applications?", "Not in the current website phase. The architecture leaves room for counselling, lead management and direct applications later."],
  ["Why are some fields unavailable?", "The redesign avoids presenting zero or inconsistent legacy values as facts. Missing data remains unavailable until it is sourced and verified."],
];
export default function FAQPage() { return <div className="prose-shell"><span className="eyebrow">FAQ</span><h1>Questions, answered clearly.</h1>{questions.map(([question, answer]) => <section className="entity-section" key={question}><h2>{question}</h2><p>{answer}</p></section>)}</div>; }
