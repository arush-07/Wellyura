import { shouldIndexProgrammeSlug } from "@/lib/programme-seo";
import type { MetadataRoute } from "next";

import { accommodations } from "@/lib/accommodations";
import {
  countries,
  programmes,
  universities,
} from "@/lib/catalog";
import { siteConfig } from "@/lib/site";

const PROGRAMME_PAGE_SIZE = 48;

export default function sitemap(): MetadataRoute.Sitemap {
  const indexableProgrammes = programmes.filter(
    (programme) => shouldIndexProgrammeSlug(programme.slug),
  );
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

  const staticPages: MetadataRoute.Sitemap =
    staticRoutes.map((route) => ({
      url: `${siteConfig.url}${route}`,
    }));

  /*
   * Add crawlable programme catalogue pages:
   * /programmes?page=2
   * /programmes?page=3
   * etc.
   *
   * Page 1 is already included as /programmes.
   */
  const programmePageCount = Math.ceil(
    indexableProgrammes.length / PROGRAMME_PAGE_SIZE,
  );

  const programmePaginationPages: MetadataRoute.Sitemap =
    Array.from(
      {
        length: Math.max(
          0,
          programmePageCount - 1,
        ),
      },
      (_, index) => ({
        url: `${siteConfig.url}/programmes?page=${
          index + 2
        }`,
      }),
    );

  const countryPages: MetadataRoute.Sitemap =
    countries.map((country) => ({
      url: `${siteConfig.url}/countries/${country.slug}`,
    }));

  const universityPages: MetadataRoute.Sitemap =
    universities.map((university) => ({
      url: `${siteConfig.url}/universities/${university.slug}`,
    }));

  const programmePages: MetadataRoute.Sitemap =
    indexableProgrammes.map((programme) => ({
      url: `${siteConfig.url}/programmes/${programme.slug}`,
    }));

  const accommodationPages: MetadataRoute.Sitemap =
    accommodations.map((stay) => ({
      url: `${siteConfig.url}/accommodation/${stay.slug}`,
      images: stay.images.map(
        (image) => `${siteConfig.url}${image}`,
      ),
    }));

  return [
    ...staticPages,
    ...programmePaginationPages,
    ...countryPages,
    ...universityPages,
    ...programmePages,
    ...accommodationPages,
  ];
}
