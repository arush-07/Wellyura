"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MapPin } from "lucide-react";
import { formatAccommodationPrice } from "@/lib/accommodation-pricing";
import { createClient } from "@/lib/supabase/client";

type AccommodationItem = {
  slug: string;
  name: string;
  type: string;
  city: string;
  country: string;
  priceCad: number;
  billingPeriod: string;
  rating: number;
  commute: string;
  genderPolicy: string;
  description: string;
  amenities: string[];
  images: string[];
};

type AccommodationFilterListProps = {
  stays: AccommodationItem[];
};

const ACCOMMODATION_TYPES = [
  "Homestay",
  "Shared Apartment",
  "Studio",
  "Student Residence",
] as const;

function getGenderLabel(policy: string) {
  const normalized = policy.toLowerCase();

  if (normalized.includes("girl")) {
    return "Girls only";
  }

  return "All students";
}

export function AccommodationFilterList({
  stays,
}: AccommodationFilterListProps) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedGender, setSelectedGender] = useState("");
  const [lockedStay, setLockedStay] =
    useState<AccommodationItem | null>(null);

  const countries = useMemo(
    () => Array.from(new Set(stays.map((stay) => stay.country))).sort(),
    [stays],
  );

  const cities = useMemo(
    () =>
      Array.from(
        new Set(
          stays
            .filter(
              (stay) =>
                !selectedCountry || stay.country === selectedCountry,
            )
            .map((stay) => stay.city),
        ),
      ).sort(),
    [selectedCountry, stays],
  );

  const filteredStays = useMemo(
    () =>
      stays.filter((stay) => {
        const countryMatches =
          !selectedCountry || stay.country === selectedCountry;

        const cityMatches = !selectedCity || stay.city === selectedCity;

        const typeMatches = !selectedType || stay.type === selectedType;

        const genderMatches =
          !selectedGender || stay.genderPolicy === selectedGender;

        return (
          countryMatches &&
          cityMatches &&
          typeMatches &&
          genderMatches
        );
      }),
    [
      selectedCountry,
      selectedCity,
      selectedType,
      selectedGender,
      stays,
    ],
  );

  function clearFilters() {
    setSelectedCountry("");
    setSelectedCity("");
    setSelectedType("");
    setSelectedGender("");
  }

  async function openStay(stay: AccommodationItem) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      router.push(`/accommodation/${stay.slug}`);
      return;
    }

    setLockedStay(stay);
  }

  return (
    <section className="accommodation-filter-block">
      <div className="accommodation-filter-copy">
        <p className="eyebrow">Filter stays</p>
        <h2>Browse by country, city, type and gender</h2>
        <p>
          Showing {filteredStays.length} of {stays.length} accommodation
          options.
        </p>
      </div>

      <div className="accommodation-filter-controls">
        <label>
          <span>Country</span>
          <select
            value={selectedCountry}
            onChange={(event) => {
              setSelectedCountry(event.target.value);
              setSelectedCity("");
            }}
          >
            <option value="">All countries</option>

            {countries.map((country) => (
              <option value={country} key={country}>
                {country}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>City</span>
          <select
            value={selectedCity}
            onChange={(event) => setSelectedCity(event.target.value)}
          >
            <option value="">All cities</option>

            {cities.map((city) => (
              <option value={city} key={city}>
                {city}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Type</span>
          <select
            value={selectedType}
            onChange={(event) => setSelectedType(event.target.value)}
          >
            <option value="">All types</option>

            {ACCOMMODATION_TYPES.map((type) => (
              <option value={type} key={type}>
                {type}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Gender</span>
          <select
            value={selectedGender}
            onChange={(event) => setSelectedGender(event.target.value)}
          >
            <option value="">All students</option>
            <option value="Girls only">Girls only</option>
          </select>
        </label>

        <button
          type="button"
          className="accommodation-clear-filter"
          onClick={clearFilters}
        >
          Clear
        </button>
      </div>

      {filteredStays.length > 0 ? (
        <div className="accommodation-grid">
          {filteredStays.map((stay, index) => (
            <article
              className="university-card accommodation-card accommodation-card-link"
              key={stay.slug}
              role="button"
              tabIndex={0}
              onClick={() => {
                void openStay(stay);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  void openStay(stay);
                }
              }}
            >
              <Image
                src={stay.images[0]}
                alt={stay.name}
                width={900}
                height={600}
                className="university-card-image"
                loading={index === 0 ? "eager" : "lazy"}
                sizes="(max-width: 860px) 100vw, 50vw"
              />

              <div className="university-card-content">
                <h3>{stay.name}</h3>

                <p className="accommodation-location">
                  <MapPin size={15} />
                  {stay.city}, {stay.country} · {stay.commute}
                </p>

                <p className="accommodation-price">
                  {formatAccommodationPrice(stay.priceCad, stay.country)} /{" "}
                  {stay.billingPeriod}
                </p>

                <p>{stay.description}</p>

                <div className="accommodation-card-tags">
                  <span className="gender-policy-pill">
                    {getGenderLabel(stay.genderPolicy)}
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="accommodation-empty-state">
          <h3>No stays found</h3>
          <p>Try clearing one or more filters.</p>
        </div>
      )}

      {lockedStay && (
        <div
          className="accommodation-card-auth-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="accommodation-card-auth-title"
        >
          <div className="accommodation-card-auth-modal">
            <button
              type="button"
              className="accommodation-card-auth-close"
              onClick={() => setLockedStay(null)}
              aria-label="Close"
            >
              ×
            </button>

            <p className="eyebrow">Sign in required</p>

            <h2 id="accommodation-card-auth-title">
              View {lockedStay.name}
            </h2>

            <p>
              To open accommodation details, please sign in or create your
              Wellyura account.
            </p>

            <div className="accommodation-card-auth-actions">
              <Link className="button button-dark" href="/login">
                Sign in
              </Link>

              <Link className="button button-lime" href="/register">
                Create account
              </Link>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
