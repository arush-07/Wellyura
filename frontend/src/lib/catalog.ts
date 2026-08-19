import { shouldIndexProgrammeSlug } from "@/lib/programme-seo";
import catalogJson from "@/data/catalog.json";

export type Country = {
  name: string;
  slug: string;
  code: string;
  flag: string;
  currency: string;
  region: string;
  tagline: string;
  accent: string;
  universityCount: number;
  programmeCount: number;
  cityCount: number;
  cities: string[];
  legacyAnnualFeeCadMedian: number | null;
  description: string;
};

export type University = {
  id: string;
  legacyId: string;
  slug: string;
  name: string;
  abbreviation: string;
  type: string;
  city: string;
  province: string;
  country: string;
  countrySlug: string;
  countryCode: string;
  flag: string;
  accent: string;
  campuses: string[];
  website: string;
  applicationPortal: string;
  applicationFeeCad: number | null;
  intakes: string[];
  scholarships: string[];
  programCount: number;
  annualFeeCadMin: number | null;
  annualFeeCadMax: number | null;
  description: string;
  dataStatus: "legacy-import";
  sourceFile: string;
};

export type Programme = {
  id: string;
  slug: string;
  name: string;
  level: string;
  levelCode: string;
  faculty: string;
  durationYears: number | null;
  annualFeeCad: number | null;
  totalFeeCad: number | null;
  minClass12Percent: number | null;
  requirements: string[];
  careerRoles: string[];
  features: string[];
  universityId: string;
  universitySlug: string;
  universityName: string;
  country: string;
  countrySlug: string;
  city: string;
  flag: string;
  accent: string;
  dataStatus: "legacy-import";
  sourceFile: string;
  subject: string;
};

export type Subject = {
  name: string;
  slug: string;
  programmeCount: number;
};

type Catalog = {
  generatedFrom: string;
  universities: University[];
  programmes: Programme[];
  countries: Country[];
  subjects: Subject[];
};

export const catalog = catalogJson as Catalog;

export const universities = catalog.universities;
export const programmes = catalog.programmes;
export const countries = catalog.countries;
export const subjects = catalog.subjects;

export function getUniversity(slug: string) {
  return universities.find((university) => university.slug === slug);
}

export function getProgramme(slug: string) {
  return programmes.find((programme) => programme.slug === slug);
}

export function getCountry(slug: string) {
  return countries.find((country) => country.slug === slug);
}

export function getUniversityProgrammes(universityId: string, limit?: number) {
  const rows = programmes.filter((programme) => programme.universityId === universityId);
  return typeof limit === "number" ? rows.slice(0, limit) : rows;
}

export function searchUniversities(input: {
  query?: string;
  country?: string;
  city?: string;
  type?: string;
  scholarship?: boolean;
  limit?: number;
}) {
  const query = input.query?.trim().toLowerCase() ?? "";
  const rows = universities.filter((university) => {
    const searchable = [
      university.name,
      university.abbreviation,
      university.city,
      university.province,
      university.country,
    ]
      .join(" ")
      .toLowerCase();

    if (query && !searchable.includes(query)) return false;
    if (input.country && university.countrySlug !== input.country) return false;
    if (input.city && university.city.toLowerCase() !== input.city.toLowerCase()) return false;
    if (input.type && university.type.toLowerCase() !== input.type.toLowerCase()) return false;
    if (input.scholarship && university.scholarships.length === 0) return false;
    return true;
  });

  return typeof input.limit === "number" ? rows.slice(0, input.limit) : rows;
}

export function searchProgrammes(input: {
  query?: string;
  country?: string;
  subject?: string;
  level?: string;
  limit?: number;
}) {
  const query = input.query?.trim().toLowerCase() ?? "";
  const rows = programmes.filter((programme) => {
    if (!shouldIndexProgrammeSlug(programme.slug)) return false;

    const searchable = [
      programme.name,
      programme.universityName,
      programme.faculty,
      programme.subject,
      programme.city,
      programme.country,
    ]
      .join(" ")
      .toLowerCase();

    if (query && !searchable.includes(query)) return false;
    if (input.country && programme.countrySlug !== input.country) return false;
    if (input.subject && programme.subject.toLowerCase() !== input.subject.toLowerCase()) return false;
    if (input.level && programme.levelCode.toLowerCase() !== input.level.toLowerCase()) return false;
    return true;
  });

  return typeof input.limit === "number" ? rows.slice(0, input.limit) : rows;
}

export function topUniversities(limit = 6) {
  return [...universities]
    .sort((a, b) => {
      const aScore = a.programCount + a.scholarships.length * 3;
      const bScore = b.programCount + b.scholarships.length * 3;
      return bScore - aScore;
    })
    .slice(0, limit);
}

export function topProgrammes(limit = 8) {
  return programmes
    .filter((programme) => shouldIndexProgrammeSlug(programme.slug))
    .filter((programme) => programme.annualFeeCad || programme.requirements.length > 0)
    .slice(0, limit);
}
