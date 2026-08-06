"use client";

import {
  useEffect,
} from "react";

import {
  usePathname,
  useSearchParams,
} from "next/navigation";

import {
  recordSearchHistory,
} from "@/lib/supabase/search-history";

export function SearchHistoryRecorder() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const serializedSearch = searchParams.toString();

  useEffect(() => {
    if (!serializedSearch) {
      return;
    }

    const timer = window.setTimeout(() => {
      void recordSearchHistory(
        pathname,
        serializedSearch,
      ).catch((error) => {
        console.warn(
          "Could not record search history:",
          error,
        );
      });
    }, 250);

    return () => {
      window.clearTimeout(timer);
    };
  }, [
    pathname,
    serializedSearch,
  ]);

  return null;
}
