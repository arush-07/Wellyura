const slugToCode: Record<string, string> = {
  australia: "au",
  canada: "ca",
  france: "fr",
  germany: "de",
  ireland: "ie",
  netherlands: "nl",
  "new-zealand": "nz",
  russia: "ru",
  singapore: "sg",
  "south-korea": "kr",
  "united-kingdom": "gb",
  "united-states": "us",
};

type CountryFlagProps = {
  code?: string;
  slug?: string;
  name: string;
  className?: string;
};

export function CountryFlag({ code, slug, name, className = "" }: CountryFlagProps) {
  const normalizedCode = (code || (slug ? slugToCode[slug] : "") || "").toLowerCase();

  if (!normalizedCode) {
    return <span className={`country-flag-fallback ${className}`} aria-hidden="true">{name.slice(0, 2).toUpperCase()}</span>;
  }

  return (
    <span className={`flag-frame ${className}`.trim()}>
      <img src={`/flags/${normalizedCode}.svg`} alt={`${name} flag`} width="64" height="42" loading="lazy" />
    </span>
  );
}
