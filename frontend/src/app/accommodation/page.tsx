import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, MapPin, Star } from "lucide-react";
import { accommodations } from "@/lib/accommodations";
import { formatCad } from "@/lib/format";

export const metadata: Metadata = { title: "Student accommodation", description: "Explore curated student stays connected to university destinations." };

export default function AccommodationPage() {
  return (
    <>
      <section className="page-hero">
        <div className="shell page-hero-grid">
          <div><span className="eyebrow">Accommodation</span><h1>Find a place<br /><em>near the plan.</em></h1></div>
          <div><p>Housing belongs inside the study decision. Browse curated listings with location, cost, amenities and campus commute context.</p></div>
        </div>
      </section>
      <section className="section shell">
        <div className="results-head"><div><h2>Curated London stays</h2><p>Current migrated inventory; booking infrastructure is reserved for a future phase.</p></div></div>
        <div className="accommodation-grid">
          {accommodations.map((stay) => (
            <article className="stay-card" key={stay.slug}>
              <Image className="stay-image" src={stay.images[0]} alt={stay.name} width={900} height={560} />
              <div className="stay-body">
                <div className="stay-top">
                  <div><span className="card-kicker">{stay.type}</span><h3>{stay.name}</h3><p><MapPin size={14} /> {stay.city}, {stay.country} · {stay.commute}</p></div>
                  <div className="stay-price">{formatCad(stay.priceCad)}<small> / {stay.billingPeriod}</small></div>
                </div>
                <p>{stay.description}</p>
                <div className="stay-features">{stay.amenities.slice(0, 5).map((amenity) => <span key={amenity}>{amenity}</span>)}</div>
                <div className="university-card-foot"><span className="data-status"><Star size={14} fill="currentColor" /> {stay.rating.toFixed(1)} migrated rating</span><Link className="round-link" href={`/accommodation/${stay.slug}`}><ArrowUpRight size={18} /></Link></div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
