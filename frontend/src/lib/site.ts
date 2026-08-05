export const siteConfig = {
  name: "Wellyura",
  title: "Wellyura — Find your place in the world",
  description:
    "Discover universities, compare programmes, understand tuition and scholarships, and plan your international study journey.",
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
