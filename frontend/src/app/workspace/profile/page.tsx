import type { Metadata } from "next";

import { ProfileLoader } from "@/components/profile-loader";
import { WorkspaceNav } from "@/components/workspace-nav";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Profile",
};

export default async function ProfilePage() {
  const supabase = await createClient();

  const { data: countries } =
    await supabase
      .from("countries")
      .select("id, name")
      .order("name");

  return (
    <section className="workspace-shell">
      <div className="workspace-content">
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

            <ProfileLoader
              countries={countries ?? []}
            />
          </section>
        </div>
      </div>
    </section>
  );
}
