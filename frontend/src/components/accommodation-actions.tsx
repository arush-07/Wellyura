"use client";

import type { FormEvent } from "react";
import { useCallback, useEffect, useState } from "react";
import { CalendarDays, Send, Star, Trash2 } from "lucide-react";

import {
  deleteAccommodationReview,
  getAccommodationReviews,
  submitAccommodationReview,
  submitHousingInquiry,
  type AccommodationReview,
} from "@/lib/supabase/accommodation-workflows";

type Props = {
  accommodationSlug: string;
  accommodationName: string;
  accommodationType: string;
};

function getErrorMessage(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error
  ) {
    return String(
      (error as { message: unknown }).message,
    );
  }

  return "Something went wrong.";
}

function handleAuthError(error: unknown) {
  const message = getErrorMessage(error);

  if (
    !message.toLowerCase().includes("authentication")
  ) {
    return false;
  }

  window.location.assign(
    `/login?next=${encodeURIComponent(
      window.location.pathname,
    )}`,
  );

  return true;
}

function stars(rating: number) {
  const value = Math.max(
    0,
    Math.min(5, Math.round(rating)),
  );

  return "★".repeat(value) +
    "☆".repeat(5 - value);
}

export function AccommodationActions({
  accommodationSlug,
  accommodationName,
  accommodationType,
}: Props) {
  const [showInquiry, setShowInquiry] =
    useState(false);

  const [roomType, setRoomType] =
    useState("");

  const [checkInDate, setCheckInDate] =
    useState("");

  const [checkOutDate, setCheckOutDate] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [inquiryStatus, setInquiryStatus] =
    useState("");

  const [sendingInquiry, setSendingInquiry] =
    useState(false);

  const [reviews, setReviews] =
    useState<AccommodationReview[]>([]);

  const [loadingReviews, setLoadingReviews] =
    useState(true);

  const [rating, setRating] =
    useState("5");

  const [comment, setComment] =
    useState("");

  const [reviewStatus, setReviewStatus] =
    useState("");

  const [savingReview, setSavingReview] =
    useState(false);

  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  const loadReviews = useCallback(async () => {
    setLoadingReviews(true);

    try {
      const rows =
        await getAccommodationReviews(
          accommodationSlug,
        );

      setReviews(rows);
    } catch (error) {
      console.warn(
        "Could not load reviews:",
        error,
      );
    } finally {
      setLoadingReviews(false);
    }
  }, [accommodationSlug]);

  useEffect(() => {
    void loadReviews();
  }, [loadReviews]);

  useEffect(() => {
    const mine = reviews.find(
      (review) => review.is_mine,
    );

    if (!mine) {
      return;
    }

    setRating(String(Math.round(mine.rating)));
    setComment(mine.comment ?? "");
  }, [reviews]);

  async function submitInquiry(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setSendingInquiry(true);
    setInquiryStatus("");

    try {
      await submitHousingInquiry(
        accommodationSlug,
        {
          roomType,
          checkInDate,
          checkOutDate,
          message,
        },
      );

      setRoomType("");
      setCheckInDate("");
      setCheckOutDate("");
      setMessage("");
      setShowInquiry(false);

      setInquiryStatus(
        "Availability request submitted.",
      );
    } catch (error) {
      if (handleAuthError(error)) {
        return;
      }

      setInquiryStatus(
        getErrorMessage(error),
      );
    } finally {
      setSendingInquiry(false);
    }
  }

  async function submitReview(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setSavingReview(true);
    setReviewStatus("");

    try {
      await submitAccommodationReview(
        accommodationSlug,
        Number(rating),
        comment,
      );

      setReviewStatus(
        "Your review has been saved.",
      );

      await loadReviews();
    } catch (error) {
      if (handleAuthError(error)) {
        return;
      }

      setReviewStatus(
        getErrorMessage(error),
      );
    } finally {
      setSavingReview(false);
    }
  }

  async function removeReview(
    reviewId: string,
  ) {
    if (
      !window.confirm(
        "Delete your accommodation review?",
      )
    ) {
      return;
    }

    setDeletingId(reviewId);
    setReviewStatus("");

    try {
      await deleteAccommodationReview(
        reviewId,
      );

      setRating("5");
      setComment("");

      setReviewStatus(
        "Your review has been deleted.",
      );

      await loadReviews();
    } catch (error) {
      if (handleAuthError(error)) {
        return;
      }

      setReviewStatus(
        getErrorMessage(error),
      );
    } finally {
      setDeletingId(null);
    }
  }

  const ownReview = reviews.find(
    (review) => review.is_mine,
  );

  const today =
    new Date().toISOString().slice(0, 10);

  return (
    <div className="accommodation-actions">
      <section className="sidebar-card accommodation-request-card">
        <span className="card-kicker">
          Availability
        </span>

        <h3>Interested in this stay?</h3>

        <p>
          Send your dates and preferences to the
          Wellyura housing team.
        </p>

        <button
          className="button button-lime"
          type="button"
          onClick={() =>
            setShowInquiry((current) => !current)
          }
        >
          <CalendarDays size={16} />

          {showInquiry
            ? "Close request form"
            : "Request availability"}
        </button>

        {showInquiry && (
          <form
            className="accommodation-form"
            onSubmit={submitInquiry}
          >
            <label>
              Preferred room type

              <input
                type="text"
                value={roomType}
                placeholder={accommodationType}
                onChange={(event) =>
                  setRoomType(event.target.value)
                }
              />
            </label>

            <div className="accommodation-form-row">
              <label>
                Check-in

                <input
                  type="date"
                  min={today}
                  value={checkInDate}
                  onChange={(event) =>
                    setCheckInDate(
                      event.target.value,
                    )
                  }
                />
              </label>

              <label>
                Check-out

                <input
                  type="date"
                  min={checkInDate || today}
                  value={checkOutDate}
                  onChange={(event) =>
                    setCheckOutDate(
                      event.target.value,
                    )
                  }
                />
              </label>
            </div>

            <label>
              Message

              <textarea
                required
                minLength={10}
                rows={5}
                value={message}
                placeholder={`I would like to ask about availability at ${accommodationName}.`}
                onChange={(event) =>
                  setMessage(event.target.value)
                }
              />
            </label>

            <button
              className="button button-dark"
              type="submit"
              disabled={sendingInquiry}
            >
              <Send size={16} />

              {sendingInquiry
                ? "Submitting..."
                : "Submit request"}
            </button>
          </form>
        )}

        {inquiryStatus && (
          <p className="form-message">
            {inquiryStatus}
          </p>
        )}
      </section>

      <section className="entity-section accommodation-review-section">
        <div className="accommodation-section-heading">
          <div>
            <span className="eyebrow">
              Student feedback
            </span>

            <h2>Reviews</h2>

            <p>
              Feedback from signed-in Wellyura
              students.
            </p>
          </div>

          <span className="review-count-pill">
            {reviews.length}{" "}
            {reviews.length === 1
              ? "review"
              : "reviews"}
          </span>
        </div>

        <form
          className="accommodation-form accommodation-review-form"
          onSubmit={submitReview}
        >
          <label>
            Rating

            <select
              value={rating}
              onChange={(event) =>
                setRating(event.target.value)
              }
            >
              <option value="5">
                5 — Excellent
              </option>

              <option value="4">
                4 — Very good
              </option>

              <option value="3">
                3 — Good
              </option>

              <option value="2">
                2 — Fair
              </option>

              <option value="1">
                1 — Poor
              </option>
            </select>
          </label>

          <label>
            Your review

            <textarea
              rows={5}
              maxLength={1000}
              value={comment}
              placeholder="Share your experience or useful information."
              onChange={(event) =>
                setComment(event.target.value)
              }
            />
          </label>

          <button
            className="button button-dark"
            type="submit"
            disabled={savingReview}
          >
            <Star size={16} />

            {savingReview
              ? "Saving..."
              : ownReview
                ? "Update review"
                : "Submit review"}
          </button>

          {reviewStatus && (
            <p className="form-message">
              {reviewStatus}
            </p>
          )}
        </form>

        <div className="accommodation-review-list">
          {loadingReviews ? (
            <p>Loading reviews...</p>
          ) : reviews.length === 0 ? (
            <div className="workspace-empty">
              <Star size={23} />

              <h3>No reviews yet</h3>

              <p>
                Be the first student to review
                this accommodation.
              </p>
            </div>
          ) : (
            reviews.map((review) => (
              <article
                className="accommodation-review-card"
                key={review.review_id}
              >
                <div className="accommodation-review-top">
                  <div>
                    <strong>
                      {review.author_name}
                    </strong>

                    <span className="review-stars">
                      {stars(review.rating)}
                    </span>
                  </div>

                  {review.is_mine && (
                    <button
                      className="mini-action"
                      type="button"
                      aria-label="Delete review"
                      disabled={
                        deletingId ===
                        review.review_id
                      }
                      onClick={() =>
                        removeReview(
                          review.review_id,
                        )
                      }
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>

                {review.comment && (
                  <p>{review.comment}</p>
                )}

                <span className="review-date">
                  {new Date(
                    review.updated_at ||
                      review.created_at,
                  ).toLocaleDateString()}
                </span>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
