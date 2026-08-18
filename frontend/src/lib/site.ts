export const siteConfig = {
  name: "Wellyura",
  title: "Wellyura | Study Abroad, Universities & Student Accommodation",
  description:
    "Discover universities and programmes, compare study destinations, explore student accommodation, and plan your international study journey with Wellyura.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.wellyura.com",
  nav: [
    { href: "/discover", label: "Discover" },
    { href: "/universities", label: "Universities" },
    { href: "/programmes", label: "Programmes" },
    { href: "/countries", label: "Countries" },
    { href: "/scholarships", label: "Scholarships" },
    { href: "/accommodation", label: "Accommodation" },
  ],
};
