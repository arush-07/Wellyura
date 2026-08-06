"use client";

import { createClient } from "@/lib/supabase/client";

export type AdminRole =
  | "student"
  | "support"
  | "editor"
  | "publisher"
  | "admin";

async function requireAdminClient() {
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

export async function setAdminUserRole(
  userId: string,
  role: AdminRole,
  enabled: boolean,
) {
  const supabase = await requireAdminClient();

  const { error } = await supabase.rpc(
    "admin_set_user_role",
    {
      target_user_id: userId,
      target_role: role,
      enabled,
    },
  );

  if (error) {
    throw error;
  }
}

export async function setHousingInquiryStatus(
  inquiryId: string,
  status: string,
) {
  const supabase = await requireAdminClient();

  const { error } = await supabase.rpc(
    "admin_set_housing_inquiry_status",
    {
      p_inquiry_id: inquiryId,
      p_status: status,
    },
  );

  if (error) {
    throw error;
  }
}

export async function deleteAdminReview(
  reviewId: string,
) {
  const supabase = await requireAdminClient();

  const { data, error } = await supabase.rpc(
    "admin_delete_accommodation_review",
    {
      p_review_id: reviewId,
    },
  );

  if (error) {
    throw error;
  }

  return data === true;
}

export async function createAdminAnnouncement(
  values: {
    type: string;
    title: string;
    message: string;
    linkUrl: string;
    published: boolean;
    publishAt: string;
    expiresAt: string;
  },
) {
  const supabase = await requireAdminClient();

  const { data, error } = await supabase.rpc(
    "admin_create_announcement",
    {
      p_announcement_type: values.type,
      p_title: values.title,
      p_message: values.message,
      p_link_url:
        values.linkUrl.trim() || null,
      p_is_published: values.published,
      p_publish_at:
        values.publishAt
          ? new Date(values.publishAt).toISOString()
          : null,
      p_expires_at:
        values.expiresAt
          ? new Date(values.expiresAt).toISOString()
          : null,
    },
  );

  if (error) {
    throw error;
  }

  return String(data);
}

export async function setAnnouncementPublished(
  announcementId: string,
  published: boolean,
) {
  const supabase = await requireAdminClient();

  const { error } = await supabase.rpc(
    "admin_set_announcement_published",
    {
      p_announcement_id: announcementId,
      p_is_published: published,
    },
  );

  if (error) {
    throw error;
  }
}

export async function deleteAdminAnnouncement(
  announcementId: string,
) {
  const supabase = await requireAdminClient();

  const { data, error } = await supabase.rpc(
    "admin_delete_announcement",
    {
      p_announcement_id: announcementId,
    },
  );

  if (error) {
    throw error;
  }

  return data === true;
}

export async function queueDeadlineNotifications() {
  const supabase = await requireAdminClient();

  const { data, error } = await supabase.rpc(
    "queue_deadline_reminder_events",
  );

  if (error) {
    throw error;
  }

  return Number(data ?? 0);
}
