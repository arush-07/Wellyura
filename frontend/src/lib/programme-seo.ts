import { programmeFacultyRedirects } from "@/lib/programme-faculty-redirects";
export const programmeRedirects: Record<string, string> = {
  "essec-business-school--essec-global-bba--14":
    "essec-business-school--essec-global-bba--1",

  "essec-business-school--master-in-management-mim--15":
    "essec-business-school--master-in-management-mim--2",

  "essec-business-school--master-in-finance-mif--16":
    "essec-business-school--master-in-finance-mif--3",

  "essec-business-school--master-in-data-sciences-business-analytics-dsba--17":
    "essec-business-school--master-in-data-sciences-business-analytics-dsba--4",

  "essec-business-school--master-in-strategy-management-of-international-business-smib-advanced-master-in-strategy-management-of-international-business-smib--18":
    "essec-business-school--master-in-strategy-management-of-international-business-smib-advanced-master-in-strategy-management-of-international-business-smib--5",

  "essec-business-school--global-mba--19":
    "essec-business-school--global-mba--6",

  "uc-berkeley--mba-haas-school-of-business--13":
    "uc-berkeley--mba-haas-school-of-business--7",

  "harvard-university--core-program-structure--14":
    "harvard-university--core-program-structure--12",

  "harvard-university--application-deadlines--24":
    "harvard-university--application-deadlines--22",

  "harvard-university--application-timeline--32":
    "harvard-university--application-timeline--26",

  "cornell-university--psychology--17":
    "cornell-university--psychology--7",
};

export const malformedProgrammeSlugs = new Set<string>([
  "australian-national-university--5-years-full-time-18-months-on-campus-delivery--11",
  "australian-national-university--5-years-full-time-18-months-on-campus-delivery--12",
  "unsw-sydney--75-years-full-time-21-months-on-campus-delivery-at-kensington-sydney--11",
  "university-of-wollongong--5-years-full-time-4-sessions-trimester-based-on-campus-delivery--11",
  "university-of-wollongong--5-years-full-time-4-sessions-trimester-based-on-campus-delivery--12",
  "university-of-queensland--5-years-full-time-18-months-on-campus-delivery--11",
  "university-of-western-australia--5-years-full-time-18-months-on-campus-delivery--12",
  "university-of-sydney--5-years-full-time-18-months-on-campus-delivery-campus-camperdown-cbd--11",
  "university-of-sydney--5-years-full-time-18-months-on-campus-or-online-delivery-options-available--12",
  "dublin-city-university--5-years-full-time-on-campus-partnership-with-health-service-providers--15",
  "hotelschool-the-hague--5-years-30-months-full-time-on-campus-includes-4-week-intensive-summer-preparation-course--3",
  "psb-academy-singapore--33-years-28-months-full-time--12",
  "illinois-institute-of-technology--5-2-years-18-24-months-full-time-study-mode-part-time-and-online-hybrid-options-available-33-credit-hours--8",
  "stanford-university--5-years-usd-97-623-approximately--11",
  "stanford-university--5-years-usd-97-623-approximately--12",
  "suny-buffalo-university--5-years-18-months-full-time-study-mode--8",
]);

export function getProgrammeRedirect(slug: string) {
  return (
    programmeRedirects[slug] ??
    programmeFacultyRedirects[slug]
  );
}

export function isMalformedProgrammeSlug(slug: string) {
  return malformedProgrammeSlugs.has(slug);
}

export function shouldIndexProgrammeSlug(slug: string) {
  return !getProgrammeRedirect(slug) && !isMalformedProgrammeSlug(slug);
}
