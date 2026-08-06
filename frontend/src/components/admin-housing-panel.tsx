"use client";

import Link from "next/link";

import {
  CalendarDays,
  ExternalLink,
  Home,
  Mail,
} from "lucide-react";

import {
  useRouter,
} from "next/navigation";

import {
  useState,
} from "react";

import type {
  AdminHousingInquiryRow,
} from "@/lib/admin-types";

import {
  setHousingInquiryStatus,
} from "@/lib/supabase/admin-workflows";

type Props = {
  initialInquiries: AdminHousingInquiryRow[];
};

const statuses = [
  "pending",
  "contacted",
  "approved",
  "confirmed",
  "rejected",
  "cancelled",
] as const;

function errorMessage(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error
  ) {
    return String(
      (error as {
        message: unknown;
      }).message,
    );
  }

  return "Could not update the inquiry.";
}

function formatDate(value: string | null) {
  if (!value) {
    return "Flexible";
  }

  return new Date(
    `${value}T00:00:00`,
  ).toLocaleDateString();
}

function statusClass(status: string) {
  return status
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-");
}

export function AdminHousingPanel({
  initialInquiries,
}: Props) {
  const router = useRouter();

  const [inquiries, setInquiries] =
    useState(initialInquiries);

  const [workingId, setWorkingId] =
    useState<string | null>(null);

  const [message, setMessage] =
    useState("");

  async function updateStatus(
    inquiryId: string,
    status: string,
  ) {
    setWorkingId(inquiryId);
    setMessage("");

    try {
      await setHousingInquiryStatus(
        inquiryId,
        status,
      );

      setInquiries((current) =>
        current.map((inquiry) =>
          inquiry.inquiry_id === inquiryId
            ? {
                ...inquiry,
                status,
                updated_at:
                  new Date().toISOString(),
              }
            : inquiry,
        ),
      );

      setMessage(
        "Inquiry status updated successfully.",
      );

      router.refresh();
    } catch (error) {
      console.warn(
        "Could not update housing inquiry:",
        error,
      );

      setMessage(
        errorMessage(error),
      );
    } finally {
      setWorkingId(null);
    }
  }

  return (
    <section className="admin-live-panel">
      <div className="admin-live-panel-head">
        <div>
          <span className="eyebrow">
            Accommodation operations
          </span>

          <h2>Housing inquiries</h2>

          <p>
            Review student requests and update
            each inquiry as the housing team
            contacts the student.
          </p>
        </div>

        <span className="admin-count-pill">
          <Home size={15} />
          {inquiries.length} inquiries
        </span>
      </div>

      {message && (
        <p className="form-message">
          {message}
        </p>
      )}

      {inquiries.length === 0 ? (
        <div className="workspace-empty">
          <Home size={24} />

          <h3>No housing inquiries</h3>

          <p>
            New accommodation requests will
            appear here.
          </p>
        </div>
      ) : (
        <div className="admin-housing-list">
          {inquiries.map((inquiry) => (
            <article
              className="admin-housing-card"
              key={inquiry.inquiry_id}
            >
              <div className="admin-housing-heading">
                <div>
                  <span className="card-kicker">
                    Availability request
                  </span>

                  <h3>
                    {inquiry.accommodation_name ??
                      "Accommodation"}
                  </h3>
                </div>

                <span
                  className={`admin-status-pill admin-status-${statusClass(
                    inquiry.status,
                  )}`}
                >
                  {inquiry.status}
                </span>
              </div>

              <div className="admin-housing-student">
                <strong>
                  {inquiry.student_name}
                </strong>

                {inquiry.user_email && (
                  <a
                    href={`mailto:${inquiry.user_email}`}
                  >
                    <Mail size={14} />
                    {inquiry.user_email}
                  </a>
                )}
              </div>

              <div className="admin-housing-meta">
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

              <p className="admin-housing-message">
                {inquiry.message}
              </p>

              <div className="admin-housing-actions">
                <label>
                  Inquiry status

                  <select
                    value={inquiry.status}
                    disabled={
                      workingId ===
                      inquiry.inquiry_id
                    }
                    onChange={(event) =>
                      updateStatus(
                        inquiry.inquiry_id,
                        event.target.value,
                      )
                    }
                  >
                    {statuses.map((status) => (
                      <option
                        value={status}
                        key={status}
                      >
                        {status
                          .charAt(0)
                          .toUpperCase() +
                          status.slice(1)}
                      </option>
                    ))}
                  </select>
                </label>

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
  );
}
