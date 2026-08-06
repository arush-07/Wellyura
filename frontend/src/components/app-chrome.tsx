"use client";

import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { CompareDock } from "@/components/compare-dock";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { WorkspaceSync } from "@/components/workspace-sync";
import { SearchHistoryRecorder } from "@/components/search-history-recorder";

const AUTH_ROUTES = new Set([
  "/login",
  "/register",
]);

export function AppChrome({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isAuthRoute =
    AUTH_ROUTES.has(pathname);

  return (
    <>
      <WorkspaceSync />

      <Suspense fallback={null}>
        <SearchHistoryRecorder />
      </Suspense>

      <SiteHeader
        compact={isAuthRoute}
      />

      <main
        className={
          isAuthRoute
            ? "auth-main"
            : undefined
        }
      >
        {children}
      </main>

      {!isAuthRoute && (
        <>
          <SiteFooter />
          <CompareDock />
        </>
      )}
    </>
  );
}

