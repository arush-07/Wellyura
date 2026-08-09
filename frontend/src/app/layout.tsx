import { CookieConsentBanner } from "@/components/cookie-consent-banner";
import type { Metadata } from "next";
import "./globals.css";
import { AppChrome } from "@/components/app-chrome";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.title,
    template: "%s | Wellyura",
  },
  description: siteConfig.description,
  applicationName: "Wellyura",
  keywords: ["study abroad", "universities", "international programmes", "student accommodation"],
  openGraph: {
    type: "website",
    title: siteConfig.title,
    description: siteConfig.description,
    siteName: "Wellyura",
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.title,
    description: siteConfig.description,
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <AppChrome>{children}
          <CookieConsentBanner /></AppChrome>
      </body>
    </html>
  );
}
