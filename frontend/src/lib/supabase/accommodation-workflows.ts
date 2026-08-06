"use client";

import { createClient } from "@/lib/supabase/client";

export type AccommodationReview = {
  review_id: string;
  rating: number;
  comment: string | null;
  author_name: string;
  created_at: string;
  updated_at: string;
  is_mine: boolean;
};

type RawAccommodationReview = {
  review_id: string;
  rating: number | string;
  comment: string | null;
  author_name: string | null;
  created_at: string;
  updated_at: string;
  is_mine: boolean | null;
};

async function requireAuthenticatedClient() {
  const supabase = createClient();

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    throw error;
  }

  if (!session?.user) {
    throw new Error("Authentication required");
  }

  return supabase;
}

export async function submitHousingInquiry(
  accommodationKey: string,
  values: {
    roomType: string;
    checkInDate: string;
    checkOutDate: string;
    message: string;
  },
) {
  const supabase =
    await requireAuthenticatedClient();

  const { data, error } = await supabase.rpc(
    "submit_housing_inquiry",
    {
      p_accommodation_key: accommodationKey,
      p_room_type:
        values.roomType.trim() || null,
      p_check_in_date:
        values.checkInDate || null,
      p_check_out_date:
        values.checkOutDate || null,
      p_message: values.message,
    },
  );

  if (error) {
    throw error;
  }

  return String(data);
}

export async function submitAccommodationReview(
  accommodationKey: string,
  rating: number,
  comment: string,
) {
  const supabase =
    await requireAuthenticatedClient();

  const { data, error } = await supabase.rpc(
    "submit_accommodation_review",
    {
      p_accommodation_key: accommodationKey,
      p_rating: rating,
      p_comment: comment.trim() || null,
    },
  );

  if (error) {
    throw error;
  }

  return String(data);
}

export async function getAccommodationReviews(
  accommodationKey: string,
): Promise<AccommodationReview[]> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc(
    "get_accommodation_reviews",
    {
      p_accommodation_key: accommodationKey,
    },
  );

  if (error) {
    throw error;
  }

  return (
    (data ?? []) as RawAccommodationReview[]
  ).map((row) => ({
    review_id: row.review_id,
    rating: Number(row.rating),
    comment: row.comment,
    author_name:
      row.author_name || "Wellyura student",
    created_at: row.created_at,
    updated_at: row.updated_at,
    is_mine: Boolean(row.is_mine),
  }));
}

export async function deleteAccommodationReview(
  reviewId: string,
) {
  const supabase =
    await requireAuthenticatedClient();

  const { data, error } = await supabase.rpc(
    "delete_my_accommodation_review",
    {
      p_review_id: reviewId,
    },
  );

  if (error) {
    throw error;
  }

  return data === true;
}
