"use client";

import { useMemo, useState } from "react";

type CountryOption = {
  name: string;
  slug: string;
};

type UniversitySearchFormProps = {
  countries: CountryOption[];
  citiesByCountry: Record<string, string[]>;
  initialQuery?: string;
  initialCountry?: string;
  initialCity?: string;
};

export function UniversitySearchForm({
  countries,
  citiesByCountry,
  initialQuery = "",
  initialCountry = "",
  initialCity = "",
}: UniversitySearchFormProps) {
  const [country, setCountry] = useState(initialCountry);
  const [city, setCity] = useState(initialCity);

  const cityOptions = useMemo(() => citiesByCountry[country] ?? [], [citiesByCountry, country]);

  function handleCountryChange(nextCountry: string) {
    setCountry(nextCountry);
    setCity("");
  }

  return (
    <form action="/universities" method="get">
      <input
        className="search-field university-search-query"
        name="q"
        defaultValue={initialQuery}
        placeholder="Search university name"
        aria-label="Search university name"
      />

      <select
        className="search-field"
        name="country"
        value={country}
        onChange={(event) => handleCountryChange(event.target.value)}
        aria-label="Country"
      >
        <option value="">Every country</option>
        {countries.map((item) => (
          <option value={item.slug} key={item.slug}>
            {item.name}
          </option>
        ))}
      </select>

      <select
        className="search-field"
        name="city"
        value={city}
        onChange={(event) => setCity(event.target.value)}
        aria-label="City"
        disabled={!country}
      >
        <option value="">{country ? "Every city" : "Select country first"}</option>
        {cityOptions.map((item) => (
          <option value={item} key={item}>
            {item}
          </option>
        ))}
      </select>

      <button className="button button-coral" type="submit">
        Find institutions
      </button>
    </form>
  );
}
