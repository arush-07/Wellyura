import type {
  AdminRole,
} from "@/lib/supabase/admin-workflows";

export type AdminMetrics = {
  users: number;
  profiles: number;
  universities: number;
  programmes: number;
  accommodations: number;
  saved_universities: number;
  comparisons: number;
  searches: number;
  reviews: number;
  pending_housing_inquiries: number;
  pending_notifications: number;
};

export type AdminUserRow = {
  user_id: string;
  email: string;
  full_name: string | null;
  roles: AdminRole[];
  created_at: string;
  last_sign_in_at: string | null;
};

export type AdminHousingInquiryRow = {
  inquiry_id: string;
  user_id: string;
  user_email: string | null;
  student_name: string;
  accommodation_id: string | null;
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

export type AdminReviewRow = {
  review_id: string;
  user_id: string | null;
  user_email: string | null;
  author_name: string;
  accommodation_id: string;
  accommodation_slug: string | null;
  accommodation_name: string | null;
  rating: number;
  comment: string | null;
  created_at: string;
  updated_at: string;
};

export type AdminAnnouncementRow = {
  announcement_id: string;
  announcement_type: string;
  title: string;
  message: string;
  link_url: string | null;
  target_country_id: string | null;
  target_university_id: string | null;
  target_programme_id: string | null;
  is_published: boolean;
  publish_at: string | null;
  expires_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};
