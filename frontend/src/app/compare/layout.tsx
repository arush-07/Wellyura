import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Compare Universities",
  robots: {
    index: false,
    follow: false,
  },
};

export default function CompareLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
