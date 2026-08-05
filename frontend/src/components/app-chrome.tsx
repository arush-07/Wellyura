"use client";

import { usePathname } from "next/navigation";
import { CompareDock } from "@/components/compare-dock";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

const AUTH_ROUTES = new Set(["/login", "/register"]);

export function AppChrome({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const isAuthRoute = AUTH_ROUTES.has(pathname);

  return (
    <>
      <SiteHeader compact={isAuthRoute} />
      <main className={isAuthRoute ? "auth-main" : undefined}>{children}</main>
      {!isAuthRoute && (
        <>
          <SiteFooter />
          <CompareDock />
        </>
      )}
    </>
  );
}
