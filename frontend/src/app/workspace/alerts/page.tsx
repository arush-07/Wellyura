import type { Metadata } from "next";
import { WorkspaceNav } from "@/components/workspace-nav";
import { AlertPreferences } from "@/components/alert-preferences";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Alerts" };

const defaults = {
  deadline_reminders: true,
  scholarship_updates: true,
  programme_updates: false,
  email_notifications: true,
};

export default async function AlertsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: preferences } = await supabase
    .from("user_alert_preferences")
    .select("deadline_reminders, scholarship_updates, programme_updates, email_notifications")
    .eq("user_id", user!.id)
    .maybeSingle();

  return (
    <section className="workspace-shell">
      <div className="shell workspace-grid">
        <WorkspaceNav />
        <div className="workspace-main">
          <section className="workspace-panel workspace-page-panel">
            <div className="workspace-panel-head">
              <div>
                <span className="eyebrow">Notifications</span>
                <h2>Alert preferences</h2>
              </div>
            </div>
            <AlertPreferences initialValues={preferences ?? defaults} />
          </section>
        </div>
      </div>
    </section>
  );
}

