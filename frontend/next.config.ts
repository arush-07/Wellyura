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
