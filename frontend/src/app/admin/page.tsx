import type {
  Metadata,
} from "next";

import {
  BellRing,
  Building2,
  GitCompareArrows,
  GraduationCap,
  Heart,
  Home,
  Search,
  Star,
  Users,
} from "lucide-react";

import {
  redirect,
} from "next/navigation";

import {
  AdminAnnouncementsPanel,
} from "@/components/admin-announcements-panel";

import {
  AdminHousingPanel,
} from "@/components/admin-housing-panel";

import {
  AdminReviewsPanel,
} from "@/components/admin-reviews-panel";

import {
  AdminUsersPanel,
} from "@/components/admin-users-panel";

import type {
  AdminAnnouncementRow,
  AdminHousingInquiryRow,
  AdminMetrics,
  AdminReviewRow,
  AdminUserRow,
} from "@/lib/admin-types";

import {
  createClient,
} from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Admin workspace",
  robots: {
    index: false,
    follow: false,
  },
};

export const dynamic = "force-dynamic";

const defaultMetrics: AdminMetrics = {
  users: 0,
  profiles: 0,
  universities: 0,
  programmes: 0,
  accommodations: 0,
  saved_universities: 0,
  comparisons: 0,
  searches: 0,
  reviews: 0,
  pending_housing_inquiries: 0,
  pending_notifications: 0,
};

export default async function AdminPage() {
  const supabase = await createClient();

  const {
    data: {
      user,
    },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/admin");
  }

  const {
    data: roleRows,
    error: roleError,
  } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);

  if (roleError) {
    throw new Error(roleError.message);
  }

  const isAdmin =
    roleRows?.some(
      (row) => row.role === "admin",
    ) ?? false;

  if (!isAdmin) {
    redirect("/workspace");
  }

  const [
    metricsResult,
    usersResult,
    inquiriesResult,
    reviewsResult,
    announcementsResult,
  ] = await Promise.all([
    supabase.rpc(
      "get_admin_dashboard_metrics",
    ),

    supabase.rpc(
      "admin_list_users",
    ),

    supabase.rpc(
      "admin_list_housing_inquiries",
    ),

    supabase.rpc(
      "admin_list_accommodation_reviews",
    ),

    supabase.rpc(
      "admin_list_announcements",
    ),
  ]);

  const firstError =
    metricsResult.error ??
    usersResult.error ??
    inquiriesResult.error ??
    reviewsResult.error ??
    announcementsResult.error;

  if (firstError) {
    throw new Error(firstError.message);
  }

  const metrics: AdminMetrics = {
    ...defaultMetrics,

    ...(
      metricsResult.data as
        | Partial<AdminMetrics>
        | null
    ),
  };

  const users =
    (usersResult.data ??
      []) as unknown as AdminUserRow[];

  const inquiries =
    (inquiriesResult.data ??
      []) as unknown as AdminHousingInquiryRow[];

  const reviews =
    (reviewsResult.data ??
      []) as unknown as AdminReviewRow[];

  const announcements =
    (announcementsResult.data ??
      []) as unknown as AdminAnnouncementRow[];

  const metricCards = [
    {
      label: "Registered users",
      value: metrics.users,
      icon: Users,
    },
    {
      label: "Universities",
      value: metrics.universities,
      icon: GraduationCap,
    },
    {
      label: "Programmes",
      value: metrics.programmes,
      icon: Search,
    },
    {
      label: "Accommodations",
      value: metrics.accommodations,
      icon: Building2,
    },
    {
      label: "Saved universities",
      value: metrics.saved_universities,
      icon: Heart,
    },
    {
      label: "Comparisons",
      value: metrics.comparisons,
      icon: GitCompareArrows,
    },
    {
      label: "Reviews",
      value: metrics.reviews,
      icon: Star,
    },
    {
      label: "Pending inquiries",
      value:
        metrics.pending_housing_inquiries,
      icon: Home,
    },
    {
      label: "Pending notifications",
      value:
        metrics.pending_notifications,
      icon: BellRing,
    },
  ] as const;

  return (
    <>
      <section className="admin-hero">
        <div className="shell">
          <span className="eyebrow eyebrow-light">
            Wellyura operations
          </span>

          <h1>
            Control the data.
            <br />
            Protect the trust.
          </h1>

          <p>
            Manage platform access, housing
            inquiries, student reviews and
            announcements from one secure
            workspace.
          </p>
        </div>
      </section>

      <section className="shell admin-live-metrics">
        {metricCards.map((metric) => {
          const Icon = metric.icon;

          return (
            <article
              className="admin-live-metric"
              key={metric.label}
            >
              <div className="admin-live-metric-icon">
                <Icon size={19} />
              </div>

              <span>{metric.label}</span>

              <strong>
                {metric.value.toLocaleString()}
              </strong>
            </article>
          );
        })}
      </section>

      <main className="shell admin-live-dashboard">
        <AdminUsersPanel
          initialUsers={users}
        />

        <AdminHousingPanel
          initialInquiries={inquiries}
        />

        <AdminReviewsPanel
          initialReviews={reviews}
        />

        <AdminAnnouncementsPanel
          initialAnnouncements={
            announcements
          }
        />
      </main>
    </>
  );
}
