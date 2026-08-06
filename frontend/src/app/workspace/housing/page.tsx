import type { Metadata } from "next";

import Link from "next/link";
import { redirect } from "next/navigation";

import {
  CalendarDays,
  ExternalLink,
  Home,
} from "lucide-react";

import {
  WorkspaceNav,
} from "@/components/workspace-nav";

import {
  createClient,
} from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Housing inquiries",
};

type HousingInquiryRow = {
  inquiry_id: string;
  accommodation_id: string;
  accommodation_slug: string | null;
  accommodation_name: string | null;
  room_type: string | null;
  check_in_date: string | null;
  check_out_date: string | null;
  message: string;
  status: string;
  created_at: string;
  updated_at: string;
};

function formatDate(value: string | null) {
  if (!value) {
    return "Flexible";
  }

  return new Date(
    `${value}T00:00:00`,
  ).toLocaleDateString();
}

export default async function HousingPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(
      "/login?next=/workspace/housing",
    );
  }

  const {
    data,
    error,
  } = await supabase.rpc(
    "get_my_housing_inquiries",
  );

  if (error) {
    throw new Error(error.message);
  }

  const inquiries =
    (data ?? []) as HousingInquiryRow[];

  return (
    <section className="workspace-shell">
      <div className="shell workspace-grid">
        <WorkspaceNav />

        <div className="workspace-main">
          <section className="workspace-panel workspace-page-panel">
            <div className="workspace-panel-head">
              <div>
                <span className="eyebrow">
                  Accommodation
                </span>

                <h2>Housing inquiries</h2>

                <p>
                  Track your submitted availability
                  requests and their current status.
                </p>
              </div>

              <Link
                className="button button-dark button-small"
                href="/accommodation"
              >
                <Home size={15} />
                Browse stays
              </Link>
            </div>

            {inquiries.length === 0 ? (
              <div className="workspace-empty">
                <Home size={24} />

                <h3>No housing inquiries yet</h3>

                <p>
                  Request availability from an
                  accommodation page to see it here.
                </p>

                <Link
                  className="button button-dark button-small"
                  href="/accommodation"
                >
                  Explore accommodation
                </Link>
              </div>
            ) : (
              <div className="housing-inquiry-list">
                {inquiries.map((inquiry) => (
                  <article
                    className="housing-inquiry-card"
                    key={inquiry.inquiry_id}
                  >
                    <div className="housing-inquiry-heading">
                      <div>
                        <span className="card-kicker">
                          Availability request
                        </span>

                        <h3>
                          {inquiry.accommodation_name ??
                            "Accommodation"}
                        </h3>
                      </div>

                      <span className="housing-status">
                        {inquiry.status}
                      </span>
                    </div>

                    <div className="housing-inquiry-meta">
                      <span>
                        <CalendarDays size={14} />

                        {formatDate(
                          inquiry.check_in_date,
                        )}

                        {" → "}

                        {formatDate(
                          inquiry.check_out_date,
                        )}
                      </span>

                      <span>
                        {inquiry.room_type ||
                          "Room type flexible"}
                      </span>
                    </div>

                    <p>{inquiry.message}</p>

                    <div className="housing-inquiry-footer">
                      <span>
                        Submitted{" "}
                        {new Date(
                          inquiry.created_at,
                        ).toLocaleDateString()}
                      </span>

                      {inquiry.accommodation_slug && (
                        <Link
                          className="arrow-link"
                          href={`/accommodation/${inquiry.accommodation_slug}`}
                        >
                          View listing
                          <ExternalLink size={14} />
                        </Link>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </section>
  );
}
