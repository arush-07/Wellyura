import type { Metadata } from "next";
import { WorkspaceNav } from "@/components/workspace-nav";
import { DeadlineManager } from "@/components/deadline-manager";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Deadlines" };

export default async function DeadlinesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: deadlines } = await supabase
    .from("user_deadlines")
    .select("id, title, due_date, notes, is_completed")
    .eq("user_id", user!.id)
    .order("due_date");

  return (
    <section className="workspace-shell">
      <div className="shell workspace-grid">
        <WorkspaceNav />
        <div className="workspace-main">
          <section className="workspace-panel workspace-page-panel">
            <div className="workspace-panel-head">
              <div>
                <span className="eyebrow">Planner</span>
                <h2>Deadlines</h2>
              </div>
            </div>
            <DeadlineManager initialDeadlines={deadlines ?? []} />
          </section>
        </div>
      </div>
    </section>
  );
}

