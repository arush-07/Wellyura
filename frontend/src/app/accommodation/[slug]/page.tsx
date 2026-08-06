import type { Metadata } from "next";

import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  ArrowLeft,
  Check,
  MapPin,
  ShieldCheck,
  Star,
} from "lucide-react";

import {
  AccommodationActions,
} from "@/components/accommodation-actions";

import {
  accommodations,
} from "@/lib/accommodations";

import {
  formatCad,
} from "@/lib/format";

export async function generateMetadata({
  params,
}: {
  params: Promise<{
    slug: string;
  }>;
}): Promise<Metadata> {
  const { slug } = await params;

  const stay = accommodations.find(
    (item) => item.slug === slug,
  );

  return {
    title:
      stay?.name ??
      "Accommodation not found",

    description:
      stay?.description,
  };
}

export default async function AccommodationDetailPage({
  params,
}: {
  params: Promise<{
    slug: string;
  }>;
}) {
  const { slug } = await params;

  const stay = accommodations.find(
    (item) => item.slug === slug,
  );

  if (!stay) {
    notFound();
  }

  return (
    <>
      <section className="entity-hero">
        <div className="shell">
          <div className="entity-breadcrumb">
            <Link href="/accommodation">
              <ArrowLeft size={14} />
              Accommodation
            </Link>

            <span>/</span>

            <strong>{stay.name}</strong>
          </div>

          <div className="entity-heading">
            <div>
              <span className="eyebrow">
                {stay.type}
              </span>

              <h1>{stay.name}</h1>

              <p>{stay.description}</p>

              <div className="page-hero-meta">
                <span className="stat-pill">
                  <MapPin size={14} />
                  {stay.city}
                </span>

                <span className="stat-pill">
                  <Star size={14} />
                  {stay.rating.toFixed(1)}
                </span>

                <span className="stat-pill">
                  {stay.genderPolicy}
                </span>
              </div>
            </div>

            <div className="entity-monogram">
              STAY
            </div>
          </div>
        </div>
      </section>

      <section className="section shell">
        <div className="accommodation-grid">
          {stay.images.map(
            (image, index) => (
              <Image
                className="stay-image"
                src={image}
                alt={`${stay.name} view ${
                  index + 1
                }`}
                width={900}
                height={600}
                key={image}
              />
            ),
          )}
        </div>

        <div className="entity-layout">
          <div>
            <section className="entity-section">
              <h2>What is included</h2>

              <div className="tag-list">
                {stay.amenities.map(
                  (amenity) => (
                    <span key={amenity}>
                      <Check size={13} />
                      {amenity}
                    </span>
                  ),
                )}
              </div>
            </section>

            <section className="entity-section">
              <h2>Location context</h2>

              <p>
                {stay.commute}. Exact travel times
                and availability need to be
                reconfirmed before enquiry.
              </p>
            </section>

            <AccommodationActions
              accommodationSlug={stay.slug}
              accommodationName={stay.name}
              accommodationType={stay.type}
            />
          </div>

          <aside className="entity-sidebar">
            <div className="sidebar-card">
              <span className="card-kicker">
                Monthly estimate
              </span>

              <h3>
                {formatCad(stay.priceCad)} /{" "}
                {stay.billingPeriod}
              </h3>

              <p>
                Current migrated listing price
                displayed in CAD.
              </p>
            </div>

            <div className="sidebar-card source-box">
              <strong>
                <ShieldCheck size={14} />
                Listing notice
              </strong>

              <p>
                Availability, dates and final
                pricing are reconfirmed after
                submitting an inquiry.
              </p>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
