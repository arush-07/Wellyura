import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },

  async redirects() {
    return [
      {
        source: "/search",
        destination: "/discover",
        permanent: true,
      },

      // Legacy UK destination slugs.
      {
        source: "/countries/uk",
        destination: "/countries/united-kingdom",
        permanent: true,
      },

      {
        source: "/country/uk",
        destination: "/countries/united-kingdom",
        permanent: true,
      },

      // Legacy malformed Hanseo university URL.
      {
        source: "/universities/www.graduate.hanseo.ac.kr",
        destination: "/universities/hanseo-university-south-korea",
        permanent: true,
      },

      // Legacy malformed university slugs.
      {
        source: "/country/usa/university/university-of-maryland-college-park-comprehensive-international-student-guide",
        destination: "/universities/university-of-maryland-college-park",
        permanent: true,
      },

      {
        source: "/universities/university-of-maryland-college-park-comprehensive-international-student-guide",
        destination: "/universities/university-of-maryland-college-park",
        permanent: true,
      },

      {
        source: "/country/france/university/universit-grenoble-alpes",
        destination: "/universities/universite-grenoble-alpes",
        permanent: true,
      },

      {
        source: "/universities/universit-grenoble-alpes",
        destination: "/universities/universite-grenoble-alpes",
        permanent: true,
      },

      // Legacy SEO redirects from old Wellyura URLs.
      {
        source: "/country/usa",
        destination: "/countries/united-states",
        permanent: true,
      },

      {
        source: "/universities/tum",
        destination: "/universities/technical-university-of-munich",
        permanent: true,
      },

      {
        source: "/universities/stanford",
        destination: "/universities/stanford-university",
        permanent: true,
      },

      {
        source: "/country/france/university/cole-des-ponts",
        destination: "/universities/ecole-des-ponts",
        permanent: true,
      },

      {
        source: "/country/france/university/universit-psl",
        destination: "/universities/universite-psl",
        permanent: true,
      },

      // Legacy nested university URLs.
      {
        source: "/country/:country/university/:slug",
        destination: "/universities/:slug",
        permanent: true,
      },

      // Legacy country URLs.
      {
        source: "/country/:slug",
        destination: "/countries/:slug",
        permanent: true,
      },

      // Legacy university URLs.
      {
        source: "/university/:slug",
        destination: "/universities/:slug",
        permanent: true,
      },

      {
        source: "/favorites",
        destination: "/workspace/saved",
        permanent: true,
      },

      {
        source: "/dashboard",
        destination: "/workspace",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
