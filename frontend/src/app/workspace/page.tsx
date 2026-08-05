import type { Metadata } from "next";
import { WorkspaceNav } from "@/components/workspace-nav";
import { WorkspaceOverview } from "@/components/workspace-overview";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "My study plan" };

export default async function WorkspacePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: profile }, { count: deadlineCount }] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user!.id)
      .maybeSingle(),
    supabase
      .from("user_deadlines")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user!.id)
      .eq("is_completed", false),
  ]);

  const fullName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "Student";

  const firstName = String(fullName).trim().split(/\s+/)[0] || "Student";

  return (
    <section className="workspace-shell">
      <div className="shell workspace-grid">
        <WorkspaceNav />
        <WorkspaceOverview
          firstName={firstName}
          deadlineCount={deadlineCount ?? 0}
        />
      </div>
    </section>
  );
}

