import type { Metadata } from "next";

import { AccommodationFilterList } from "@/components/accommodation-filter-list";
import { accommodations } from "@/lib/accommodations";

export const metadata: Metadata = {
  alternates: { canonical: "/accommodation" },
  title: "Student accommodation",
  description:
    "Explore curated student stays connected to university destinations.",
};

export default function AccommodationPage() {
  return (
    <>
      <section className="page-hero">
        <div className="shell">
          <div>
            <span className="eyebrow">
              Accommodation
            </span>

            <h1>
              Find a place
              <br />
              <em>near the plan.</em>
            </h1>
          </div>

          <p>
            Housing belongs inside the study decision.
            Browse curated listings with location, cost,
            amenities and campus commute context.
          </p>
        </div>
      </section>

      <section className="section shell">
        <AccommodationFilterList
          stays={accommodations}
        />
      </section>
    </>
  );
}
