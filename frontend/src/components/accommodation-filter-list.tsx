"use client";

import {
  useMemo,
  useState,
} from "react";
import Image from "next/image";
import { MapPin } from "lucide-react";

import { AccommodationDetailGate } from "@/components/accommodation-detail-gate";
import { formatAccommodationPrice } from "@/lib/accommodation-pricing";

type AccommodationItem = {
  slug: string;
  name: string;
  type: string;
  city: string;
  country: string;
  commute: string;
  priceCad: number;
  billingPeriod: string;
  rating: number;
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


export function AccommodationFilterList({
  stays,
}: AccommodationFilterListProps) {
  const [selectedCountry, setSelectedCountry] =
    useState("");

  const [selectedCity, setSelectedCity] =
    useState("");

  const [selectedType, setSelectedType] =
    useState("");

  const countries = useMemo(
    () =>
      Array.from(
        new Set(
          stays.map((stay) => stay.country),
        ),
      ).sort(),
    [stays],
  );

  const cities = useMemo(() => {
    const source = selectedCountry
      ? stays.filter(
          (stay) =>
            stay.country === selectedCountry,
        )
      : stays;

    return Array.from(
      new Set(
        source.map((stay) => stay.city),
      ),
    ).sort();
  }, [selectedCountry, stays]);


  const filteredStays = useMemo(
    () =>
      stays.filter((stay) => {
        const countryMatches =
          !selectedCountry ||
          stay.country === selectedCountry;

        const cityMatches =
          !selectedCity ||
          stay.city === selectedCity;

        const typeMatches =
          !selectedType ||
          stay.type === selectedType;

        return (
          countryMatches &&
          cityMatches &&
          typeMatches
        );
      }),
    [
      selectedCountry,
      selectedCity,
      selectedType,
      stays,
    ],
  );

  function handleCountryChange(
    country: string,
  ) {
    setSelectedCountry(country);
    setSelectedCity("");
  }

  function clearFilters() {
    setSelectedCountry("");
    setSelectedCity("");
    setSelectedType("");
  }

  return (
    <>
      <div className="accommodation-filter-bar">
        <div>
          <span className="eyebrow">
            Filter stays
          </span>

          <h2>
            Browse by country, city and type
          </h2>

          <p>
            Showing {filteredStays.length} of{" "}
            {stays.length} accommodation
            options.
          </p>
        </div>

        <div className="accommodation-filter-controls">
          <label>
            <span>Country</span>

            <select
              value={selectedCountry}
              onChange={(event) =>
                handleCountryChange(
                  event.target.value,
                )
              }
            >
              <option value="">
                All countries
              </option>

              {countries.map((country) => (
                <option
                  value={country}
                  key={country}
                >
                  {country}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>City</span>

            <select
              value={selectedCity}
              onChange={(event) =>
                setSelectedCity(
                  event.target.value,
                )
              }
            >
              <option value="">
                All cities
              </option>

              {cities.map((city) => (
                <option
                  value={city}
                  key={city}
                >
                  {city}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Type</span>

            <select
              value={selectedType}
              onChange={(event) =>
                setSelectedType(
                  event.target.value,
                )
              }
            >
              <option value="">
                All types
              </option>

              {ACCOMMODATION_TYPES.map((type) => (
                <option
                  value={type}
                  key={type}
                >
                  {type}
                </option>
              ))}
            </select>
          </label>

          <button
            className="button"
            type="button"
            onClick={clearFilters}
          >
            Clear
          </button>
        </div>
      </div>

      {filteredStays.length === 0 ? (
        <div className="empty-state">
          <h3>
            No accommodation found
          </h3>

          <p>
            Try another country, city or
            accommodation type.
          </p>
        </div>
      ) : (
        <div className="accommodation-grid">
          {filteredStays.map((stay) => (
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
                  {formatAccommodationPrice(
                    stay.priceCad,
                    stay.country,
                  )}{" "}
                  / {stay.billingPeriod}
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

                  <AccommodationDetailGate
                    href={`/accommodation/${stay.slug}`}
                    accommodationName={stay.name}
                  />
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
