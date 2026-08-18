import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ProgrammeCard } from "@/components/programme-card";
import {
  countries,
  searchProgrammes,
  subjects,
} from "@/lib/catalog";

type SearchParams =
  Promise<Record<string, string | string[] | undefined>>;

const PAGE_SIZE = 48;

const get = (value: string | string[] | undefined) =>
  typeof value === "string" ? value : "";

function getPage(value: string | string[] | undefined) {
  const parsed = Number.parseInt(get(value), 10);

  return Number.isFinite(parsed) && parsed > 0
    ? parsed
    : 1;
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const params = await searchParams;

  const page = getPage(params.page);
  const q = get(params.q);
  const country = get(params.country);
  const subject = get(params.subject);
  const level = get(params.level);

  const hasFilters = Boolean(
    q || country || subject || level,
  );

  return {
    title:
      page > 1 && !hasFilters
        ? `Programmes - Page ${page}`
        : "Programmes",

    description:
      "Explore undergraduate and postgraduate programmes across Wellyura's global catalogue.",

    alternates: {
      canonical:
        page > 1 && !hasFilters
          ? `/programmes?page=${page}`
          : "/programmes",
    },

    robots: hasFilters
      ? {
          index: false,
          follow: true,
        }
      : {
          index: true,
          follow: true,
        },
  };
}

export default async function ProgrammesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;

  const q = get(params.q);
  const country = get(params.country);
  const subject = get(params.subject);
  const level = get(params.level);
  const page = getPage(params.page);

  const allRows = searchProgrammes({
    query: q,
    country,
    subject,
    level,
  });

  const totalRows = allRows.length;
  const totalPages = Math.max(
    1,
    Math.ceil(totalRows / PAGE_SIZE),
  );

  if (page > totalPages) {
    notFound();
  }

  const start = (page - 1) * PAGE_SIZE;
  const rows = allRows.slice(
    start,
    start + PAGE_SIZE,
  );

  function buildPageHref(targetPage: number) {
    const query = new URLSearchParams();

    if (q) query.set("q", q);
    if (country) query.set("country", country);
    if (subject) query.set("subject", subject);
    if (level) query.set("level", level);

    if (targetPage > 1) {
      query.set("page", String(targetPage));
    }

    const search = query.toString();

    return search
      ? `/programmes?${search}`
      : "/programmes";
  }

  const firstVisible = Math.max(1, page - 2);
  const lastVisible = Math.min(
    totalPages,
    page + 2,
  );

  const visiblePages = Array.from(
    {
      length:
        lastVisible - firstVisible + 1,
    },
    (_, index) => firstVisible + index,
  );

  return (
    <>
      <section className="page-hero">
        <div className="shell page-hero-grid">
          <div>
            <span className="eyebrow">
              Programme catalogue
            </span>

            <h1>
              Study what
              <br />
              <em>moves you.</em>
            </h1>
          </div>

          <div>
            <p>
              Compare programmes by subject, degree
              level, destination, duration and available
              legacy fee context.
            </p>
          </div>
        </div>
      </section>

      <div className="shell search-panel programme-search-panel">
        <form action="/programmes">
          <input
            className="search-field"
            name="q"
            defaultValue={q}
            placeholder="Search programmes or universities"
            aria-label="Search programmes or universities"
          />

          <select
            className="search-field"
            name="country"
            defaultValue={country}
            aria-label="Country"
          >
            <option value="">
              Every country
            </option>

            {countries.map((item) => (
              <option
                value={item.slug}
                key={item.slug}
              >
                {item.name}
              </option>
            ))}
          </select>

          <select
            className="search-field"
            name="subject"
            defaultValue={subject}
            aria-label="Subject"
          >
            <option value="">
              Every subject
            </option>

            {subjects.map((item) => (
              <option
                value={item.name}
                key={item.slug}
              >
                {item.name}
              </option>
            ))}
          </select>

          <button
            className="button button-coral"
            type="submit"
          >
            Find programmes
          </button>
        </form>
      </div>

      <section className="shell results-layout programme-results-layout">
        <aside className="filter-sidebar">
          <h2>Refine your view</h2>

          <form action="/programmes">
            <input type="hidden" name="q" value={q} />
            <input type="hidden" name="country" value={country} />
            <input type="hidden" name="subject" value={subject} />

            <div className="filter-group">
              <label htmlFor="level">
                Degree level
              </label>

              <select
                id="level"
                name="level"
                defaultValue={level}
              >
                <option value="">
                  All levels
                </option>

                <option value="UG">
                  Undergraduate
                </option>

                <option value="PG">
                  Postgraduate
                </option>

                <option value="PHD">
                  Doctorate
                </option>
              </select>
            </div>

            <button
              className="button button-dark button-small"
              type="submit"
            >
              Apply filters
            </button>
          </form>

          <div className="filter-group">
            <Link
              className="arrow-link"
              href="/programmes"
            >
              Clear everything
            </Link>
          </div>
        </aside>

        <div className="programme-results-main">
          <div className="results-head">
            <div>
              <h2>
                {totalRows.toLocaleString()} programmes
              </h2>

              {totalRows > 0 && (
                <p>
                  Showing {start + 1}-
                  {Math.min(
                    start + PAGE_SIZE,
                    totalRows,
                  )}{" "}
                  of {totalRows.toLocaleString()} records.
                </p>
              )}
            </div>
          </div>

          {rows.length > 0 ? (
            <>
              <div className="programme-list">
                {rows.map((row) => (
                  <ProgrammeCard
                    programme={row}
                    key={row.id}
                  />
                ))}
              </div>

              <nav
                className="programme-pagination"
                aria-label="Programme pages"
              >
                <div className="programme-pagination-controls">
                  {page > 1 ? (
                    <Link
                      href={buildPageHref(page - 1)}
                      className="programme-page-nav"
                      rel="prev"
                    >
                      ← Previous
                    </Link>
                  ) : (
                    <span />
                  )}

                  <strong>
                    Page {page} of {totalPages}
                  </strong>

                  {page < totalPages ? (
                    <Link
                      href={buildPageHref(page + 1)}
                      className="programme-page-nav"
                      rel="next"
                    >
                      Next →
                    </Link>
                  ) : (
                    <span />
                  )}
                </div>

                {totalPages > 1 && (
                  <div className="programme-page-numbers">
                    {firstVisible > 1 && (
                      <>
                        <Link href={buildPageHref(1)}>
                          1
                        </Link>

                        {firstVisible > 2 && (
                          <span>...</span>
                        )}
                      </>
                    )}

                    {visiblePages.map(
                      (pageNumber) => (
                        <Link
                          key={pageNumber}
                          href={buildPageHref(
                            pageNumber,
                          )}
                          aria-current={
                            pageNumber === page
                              ? "page"
                              : undefined
                          }
                        >
                          {pageNumber}
                        </Link>
                      ),
                    )}

                    {lastVisible < totalPages && (
                      <>
                        {lastVisible <
                          totalPages - 1 && (
                          <span>...</span>
                        )}

                        <Link
                          href={buildPageHref(
                            totalPages,
                          )}
                        >
                          {totalPages}
                        </Link>
                      </>
                    )}
                  </div>
                )}
              </nav>
            </>
          ) : (
            <div className="empty-state">
              <h2>No matching programmes</h2>

              <p>
                Try clearing the degree level or
                broadening your subject and destination
                filters.
              </p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

