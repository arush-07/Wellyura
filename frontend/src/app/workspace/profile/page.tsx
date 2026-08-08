import type { Metadata } from "next";
import { ProfileForm } from "@/components/profile-form";
import { WorkspaceNav } from "@/components/workspace-nav";
import { authenticatedServerApiFetch } from "@/lib/api/server";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Profile" };

type ProfileResponse = {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  preferred_country_id: string | null;
};

export default async function ProfilePage() {
  const supabase = await createClient();

  const [
    profileResponse,
    { data: countries },
  ] = await Promise.all([
    authenticatedServerApiFetch(
      "/api/v1/profile",
    ),
    supabase
      .from("countries")
      .select("id, name")
      .order("name"),
  ]);

  if (!profileResponse.ok) {
    throw new Error(
      "Unable to load your profile.",
    );
  }

  const profile =
    (await profileResponse.json()) as ProfileResponse;

  return (
    <section className="workspace-shell">
      <div className="shell workspace-grid">
        <WorkspaceNav />

        <div className="workspace-main">
          <section className="workspace-panel workspace-page-panel">
            <div className="workspace-panel-head">
              <div>
                <span className="eyebrow">
                  Account
                </span>
                <h2>Your profile</h2>
              </div>
            </div>

            <ProfileForm
              email={profile.email ?? ""}
              initialFullName={
                profile.full_name ?? ""
              }
              initialCountryId={
                profile.preferred_country_id ??
                ""
              }
              countries={countries ?? []}
            />
          </section>
        </div>
      </div>
    </section>
  );
}
