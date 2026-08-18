import type { MetadataRoute } from "next";
import {
  countries,
  programmes,
  universities,
} from "@/lib/catalog";
import { accommodations } from "@/lib/accommodations";
import { siteConfig } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    "",
    "/discover",
    "/universities",
    "/programmes",
    "/countries",
    "/accommodation",
    "/guides",
    "/faq",
    "/about",
    "/contact",
  ];

  const staticPages: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: `${siteConfig.url}${route}`,
  }));

  const countryPages: MetadataRoute.Sitemap = countries.map((country) => ({
    url: `${siteConfig.url}/countries/${country.slug}`,
  }));

  const universityPages: MetadataRoute.Sitemap = universities.map(
    (university) => ({
      url: `${siteConfig.url}/universities/${university.slug}`,
    }),
  );

  const programmePages: MetadataRoute.Sitemap = programmes.map(
    (programme) => ({
      url: `${siteConfig.url}/programmes/${programme.slug}`,
    }),
  );

  const accommodationPages: MetadataRoute.Sitemap = accommodations.map(
    (stay) => ({
      url: `${siteConfig.url}/accommodation/${stay.slug}`,
      images: stay.images.map((image) => `${siteConfig.url}${image}`),
    }),
  );

  return [
    ...staticPages,
    ...countryPages,
    ...universityPages,
    ...programmePages,
    ...accommodationPages,
  ];
}
