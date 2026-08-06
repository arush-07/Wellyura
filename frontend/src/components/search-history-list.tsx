"use client";

import Link from "next/link";

import {
  RotateCcw,
  Search,
  Trash2,
} from "lucide-react";

import {
  useState,
} from "react";

import {
  clearSearchHistoryRemote,
  deleteSearchHistoryRemote,
} from "@/lib/supabase/search-history";

export type SearchHistoryItem = {
  id: string;
  query: string | null;
  filters: Record<string, unknown>;
  created_at: string;
};

type SearchHistoryListProps = {
  initialRows: SearchHistoryItem[];
};

function readableLabel(key: string) {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase(),
    );
}

function rowHref(row: SearchHistoryItem) {
  const filters = row.filters ?? {};

  const route =
    typeof filters.route === "string"
      ? filters.route
      : "/discover";

  const params = new URLSearchParams();

  if (row.query) {
    params.set("q", row.query);
  }

  for (const [key, value] of Object.entries(
    filters,
  )) {
    if (
      key === "route" ||
      value === null ||
      value === undefined ||
      value === ""
    ) {
      continue;
    }

    if (Array.isArray(value)) {
      value.forEach((item) => {
        params.append(
          key,
          String(item),
        );
      });

      continue;
    }

    params.set(
      key,
      String(value),
    );
  }

  const queryString = params.toString();

  return queryString
    ? `${route}?${queryString}`
    : route;
}

function rowFilters(row: SearchHistoryItem) {
  return Object.entries(row.filters ?? {})
    .filter(
      ([key, value]) =>
        key !== "route" &&
        value !== null &&
        value !== undefined &&
        value !== "",
    )
    .map(
      ([key, value]) =>
        `${readableLabel(key)}: ${String(value)}`,
    );
}

export function SearchHistoryList({
  initialRows,
}: SearchHistoryListProps) {
  const [rows, setRows] = useState(initialRows);
  const [message, setMessage] = useState("");
  const [workingId, setWorkingId] =
    useState<string | null>(null);
  const [clearing, setClearing] =
    useState(false);

  async function removeSearch(id: string) {
    setWorkingId(id);
    setMessage("");

    try {
      const deleted =
        await deleteSearchHistoryRemote(id);

      if (deleted) {
        setRows((current) =>
          current.filter(
            (row) => row.id !== id,
          ),
        );
      }
    } catch (error) {
      console.warn(
        "Could not delete search history:",
        error,
      );

      setMessage(
        error instanceof Error
          ? error.message
          : "Could not delete this search.",
      );
    } finally {
      setWorkingId(null);
    }
  }

  async function clearSearches() {
    if (
      !window.confirm(
        "Clear your complete search history?",
      )
    ) {
      return;
    }

    setClearing(true);
    setMessage("");

    try {
      await clearSearchHistoryRemote();
      setRows([]);
      setMessage("Search history cleared.");
    } catch (error) {
      console.warn(
        "Could not clear search history:",
        error,
      );

      setMessage(
        error instanceof Error
          ? error.message
          : "Could not clear search history.",
      );
    } finally {
      setClearing(false);
    }
  }

  if (rows.length === 0) {
    return (
      <div className="workspace-empty">
        <Search size={24} />

        <h3>No searches yet</h3>

        <p>
          Searches made while signed in will appear
          here automatically.
        </p>

        <Link
          className="button button-dark button-small"
          href="/discover"
        >
          Discover universities
        </Link>

        {message && (
          <p className="form-message">
            {message}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="search-history-wrap">
      <div className="search-history-toolbar">
        <p>
          {rows.length} saved{" "}
          {rows.length === 1
            ? "search"
            : "searches"}
        </p>

        <button
          className="button button-light button-small"
          type="button"
          onClick={clearSearches}
          disabled={clearing}
        >
          <Trash2 size={15} />

          {clearing
            ? "Clearing..."
            : "Clear history"}
        </button>
      </div>

      {message && (
        <p className="form-message">
          {message}
        </p>
      )}

      <div className="search-history-list">
        {rows.map((row) => {
          const filters = rowFilters(row);

          return (
            <article
              className="search-history-item"
              key={row.id}
            >
              <div className="search-history-icon">
                <Search size={18} />
              </div>

              <div className="search-history-copy">
                <strong>
                  {row.query ||
                    "Filtered catalogue search"}
                </strong>

                {filters.length > 0 && (
                  <p>
                    {filters.join(" · ")}
                  </p>
                )}

                <span>
                  {new Date(
                    row.created_at,
                  ).toLocaleString()}
                </span>
              </div>

              <div className="search-history-actions">
                <Link
                  className="button button-dark button-small"
                  href={rowHref(row)}
                >
                  <RotateCcw size={15} />
                  Open
                </Link>

                <button
                  className="mini-action"
                  type="button"
                  aria-label="Delete saved search"
                  onClick={() =>
                    removeSearch(row.id)
                  }
                  disabled={workingId === row.id}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
