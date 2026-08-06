import type {
  Metadata,
} from "next";

import {
  SearchHistoryList,
  type SearchHistoryItem,
} from "@/components/search-history-list";

import {
  WorkspaceNav,
} from "@/components/workspace-nav";

import {
  createClient,
} from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Search history",
};

export default async function SearchesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const {
    data,
    error,
  } = await supabase
    .from("search_history")
    .select(
      "id, query, filters, created_at",
    )
    .eq(
      "user_id",
      user!.id,
    )
    .order(
      "created_at",
      {
        ascending: false,
      },
    )
    .limit(100);

  if (error) {
    throw new Error(error.message);
  }

  const rows: SearchHistoryItem[] = (
    data ?? []
  ).map((row) => ({
    id: row.id,
    query: row.query,
    filters:
      row.filters &&
      typeof row.filters === "object" &&
      !Array.isArray(row.filters)
        ? row.filters as Record<
            string,
            unknown
          >
        : {},
    created_at: row.created_at,
  }));

  return (
    <section className="workspace-shell">
      <div className="shell workspace-grid">
        <WorkspaceNav />

        <div className="workspace-main">
          <section className="workspace-panel workspace-page-panel">
            <div className="workspace-panel-head">
              <div>
                <span className="eyebrow">
                  Research activity
                </span>

                <h2>Search history</h2>

                <p>
                  Reopen university and programme
                  searches from any signed-in device.
                </p>
              </div>
            </div>

            <SearchHistoryList
              initialRows={rows}
            />
          </section>
        </div>
      </div>
    </section>
  );
}
