import type { MetadataRoute } from "next";
import { countries, programmes, universities } from "@/lib/catalog";
import { siteConfig } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const staticRoutes = ["", "/discover", "/universities", "/programmes", "/countries", "/accommodation", "/compare", "/guides", "/faq", "/contact"];
  return [
    ...staticRoutes.map((route) => ({ url: `${siteConfig.url}${route}`, lastModified: now, changeFrequency: "weekly" as const, priority: route === "" ? 1 : 0.7 })),
    ...countries.map((country) => ({ url: `${siteConfig.url}/countries/${country.slug}`, lastModified: now, changeFrequency: "weekly" as const, priority: 0.8 })),
    ...universities.map((university) => ({ url: `${siteConfig.url}/universities/${university.slug}`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.75 })),
    ...programmes.map((programme) => ({ url: `${siteConfig.url}/programmes/${programme.slug}`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.65 })),
  ];
}
