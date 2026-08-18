import { siteConfig } from "@/lib/site";

export function HomeStructuredData() {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${siteConfig.url}/#website`,
        url: `${siteConfig.url}/`,
        name: "Wellyura",
        description: siteConfig.description,
      },
      {
        "@type": "Organization",
        "@id": `${siteConfig.url}/#organization`,
        name: "Wellyura",
        url: `${siteConfig.url}/`,
        logo: `${siteConfig.url}/icon.png`,
        description: siteConfig.description,
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
      }}
    />
  );
}
