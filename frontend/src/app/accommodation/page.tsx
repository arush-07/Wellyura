import type { Metadata } from "next";
import Image from "next/image";
import { MapPin, Star } from "lucide-react";

import { AccommodationDetailGate } from "@/components/accommodation-detail-gate";
import { accommodations } from "@/lib/accommodations";
import { formatCad } from "@/lib/format";

export const metadata: Metadata = {
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
        <div className="section-title">
          <div>
            <span className="eyebrow">
              Curated London stays
            </span>

            <h2>
              Current migrated inventory; booking
              infrastructure is reserved for a future phase.
            </h2>
          </div>
        </div>

        <div className="accommodation-grid">
          {accommodations.map((stay) => (
            <article
              className="university-card"
              key={stay.slug}
            >
              <Image
                className="university-card-image"
                src={stay.images[0]}
                alt={stay.name}
                width={900}
                height={600}
              />

              <div className="university-card-body">
                <span className="card-kicker">
                  {stay.type}
                </span>

                <h3>{stay.name}</h3>

                <p>
                  <MapPin size={14} />
                  {stay.city}, {stay.country} ·{" "}
                  {stay.commute}
                </p>

                <strong>
                  {formatCad(stay.priceCad)} /{" "}
                  {stay.billingPeriod}
                </strong>

                <p>{stay.description}</p>

                <div className="tag-list">
                  {stay.amenities
                    .slice(0, 5)
                    .map((amenity) => (
                      <span key={amenity}>
                        {amenity}
                      </span>
                    ))}
                </div>

                <div className="university-card-foot">
                  <span className="data-status">
                    <Star
                      size={14}
                      fill="currentColor"
                    />
                    {stay.rating.toFixed(1)} migrated rating
                  </span>

                  <AccommodationDetailGate
                    href={`/accommodation/${stay.slug}`}
                    accommodationName={stay.name}
                  />
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
