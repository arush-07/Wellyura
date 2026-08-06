"use client";

import { createClient } from "@/lib/supabase/client";

const SEARCH_ROUTES = new Set([
  "/discover",
  "/universities",
  "/programmes",
]);

export async function recordSearchHistory(
  pathname: string,
  rawSearch: string,
) {
  if (!SEARCH_ROUTES.has(pathname)) {
    return;
  }

  const params = new URLSearchParams(rawSearch);

  const meaningfulEntries = Array.from(
    params.entries(),
  ).filter(([, value]) => value.trim().length > 0);

  if (meaningfulEntries.length === 0) {
    return;
  }

  const supabase = createClient();

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    throw sessionError;
  }

  if (!session?.user) {
    return;
  }

  const query =
    params.get("q")?.trim() || null;

  const filters: Record<string, string> = {
    route: pathname,
  };

  for (const [key, value] of meaningfulEntries) {
    if (key !== "q") {
      filters[key] = value;
    }
  }

  const { error } = await supabase.rpc(
    "record_search_history",
    {
      p_query: query,
      p_filters: filters,
    },
  );

  if (error) {
    throw error;
  }
}

export async function deleteSearchHistoryRemote(
  searchId: string,
) {
  const supabase = createClient();

  const { data, error } = await supabase.rpc(
    "delete_my_search_history",
    {
      p_search_id: searchId,
    },
  );

  if (error) {
    throw error;
  }

  return data === true;
}

export async function clearSearchHistoryRemote() {
  const supabase = createClient();

  const { data, error } = await supabase.rpc(
    "clear_my_search_history",
  );

  if (error) {
    throw error;
  }

  return Number(data ?? 0);
}
