"use client";

import Link from "next/link";

import {
  ExternalLink,
  Star,
  Trash2,
} from "lucide-react";

import {
  useRouter,
} from "next/navigation";

import {
  useState,
} from "react";

import type {
  AdminReviewRow,
} from "@/lib/admin-types";

import {
  deleteAdminReview,
} from "@/lib/supabase/admin-workflows";

type Props = {
  initialReviews: AdminReviewRow[];
};

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

  return "Could not delete the review.";
}

function stars(rating: number) {
  const safeRating = Math.max(
    0,
    Math.min(5, Math.round(rating)),
  );

  return (
    "★".repeat(safeRating) +
    "☆".repeat(5 - safeRating)
  );
}

export function AdminReviewsPanel({
  initialReviews,
}: Props) {
  const router = useRouter();

  const [reviews, setReviews] =
    useState(initialReviews);

  const [workingId, setWorkingId] =
    useState<string | null>(null);

  const [message, setMessage] =
    useState("");

  async function removeReview(
    reviewId: string,
  ) {
    if (
      !window.confirm(
        "Delete this accommodation review? This cannot be undone.",
      )
    ) {
      return;
    }

    setWorkingId(reviewId);
    setMessage("");

    try {
      const deleted =
        await deleteAdminReview(reviewId);

      if (deleted) {
        setReviews((current) =>
          current.filter(
            (review) =>
              review.review_id !== reviewId,
          ),
        );

        setMessage(
          "Review deleted successfully.",
        );

        router.refresh();
      }
    } catch (error) {
      console.warn(
        "Could not delete accommodation review:",
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
            Content moderation
          </span>

          <h2>Accommodation reviews</h2>

          <p>
            Review student feedback and remove
            inappropriate or invalid submissions.
          </p>
        </div>

        <span className="admin-count-pill">
          <Star size={15} />
          {reviews.length} reviews
        </span>
      </div>

      {message && (
        <p className="form-message">
          {message}
        </p>
      )}

      {reviews.length === 0 ? (
        <div className="workspace-empty">
          <Star size={24} />

          <h3>No accommodation reviews</h3>

          <p>
            Submitted reviews will appear here.
          </p>
        </div>
      ) : (
        <div className="admin-review-list">
          {reviews.map((review) => (
            <article
              className="admin-review-card"
              key={review.review_id}
            >
              <div className="admin-review-heading">
                <div>
                  <span className="card-kicker">
                    {review.accommodation_name ??
                      "Accommodation"}
                  </span>

                  <h3>
                    {review.author_name}
                  </h3>

                  {review.user_email && (
                    <span>
                      {review.user_email}
                    </span>
                  )}
                </div>

                <span className="admin-review-stars">
                  {stars(review.rating)}
                </span>
              </div>

              {review.comment ? (
                <p>{review.comment}</p>
              ) : (
                <p className="muted-copy">
                  No written comment was provided.
                </p>
              )}

              <div className="admin-review-footer">
                <span>
                  Submitted{" "}
                  {new Date(
                    review.created_at,
                  ).toLocaleString()}
                </span>

                <div className="admin-review-actions">
                  {review.accommodation_slug && (
                    <Link
                      className="arrow-link"
                      href={`/accommodation/${review.accommodation_slug}`}
                    >
                      View listing
                      <ExternalLink size={14} />
                    </Link>
                  )}

                  <button
                    className="button button-light button-small"
                    type="button"
                    disabled={
                      workingId ===
                      review.review_id
                    }
                    onClick={() =>
                      removeReview(
                        review.review_id,
                      )
                    }
                  >
                    <Trash2 size={15} />

                    {workingId ===
                    review.review_id
                      ? "Deleting..."
                      : "Delete"}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
