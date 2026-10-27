export const siteConfig = {
  name: "Wellyura",
  title: "Study Abroad, Universities & Student Accommodation | Wellyura",
  description:
    "Explore universities, degree programmes, study destinations and student accommodation to plan your international study journey with Wellyura.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.wellyura.com",
  nav: [
    { href: "/discover", label: "Discover" },
    { href: "/universities", label: "Universities" },
    { href: "/programmes", label: "Programmes" },
    { href: "/countries", label: "Countries" },
    { href: "/accommodation", label: "Accommodation" },
  ],
};
