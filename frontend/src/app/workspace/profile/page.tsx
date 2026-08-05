import type { Metadata } from "next";
import { WorkspaceNav } from "@/components/workspace-nav";
import { ProfileForm } from "@/components/profile-form";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: profile }, { data: countries }] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, phone, preferred_country_id")
      .eq("id", user!.id)
      .maybeSingle(),
    supabase
      .from("countries")
      .select("id, name")
      .order("name"),
  ]);

  return (
    <section className="workspace-shell">
      <div className="shell workspace-grid">
        <WorkspaceNav />
        <div className="workspace-main">
          <section className="workspace-panel workspace-page-panel">
            <div className="workspace-panel-head">
              <div>
                <span className="eyebrow">Account</span>
                <h2>Your profile</h2>
              </div>
            </div>

            <ProfileForm
              email={user?.email ?? ""}
              initialFullName={profile?.full_name ?? user?.user_metadata?.full_name ?? ""}
              initialPhone={profile?.phone ?? ""}
              initialCountryId={profile?.preferred_country_id ?? ""}
              countries={countries ?? []}
            />
          </section>
        </div>
      </div>
    </section>
  );
}

