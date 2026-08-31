import type { Metadata } from "next";
import { SavedUniversities } from "@/components/saved-universities";
import { WorkspaceNav } from "@/components/workspace-nav";
import { requireWorkspaceUser } from "@/lib/supabase/require-workspace-user";

export const metadata: Metadata = { title: "Saved choices" };

export default async function SavedPage() {
  await requireWorkspaceUser(
    "/workspace/saved",
  );
  return <section className="workspace-shell"><div className="shell workspace-grid"><WorkspaceNav /><div className="workspace-main"><div className="workspace-panel" style={{ marginTop: 0 }}><div className="workspace-panel-head"><div><span className="eyebrow">Shortlist</span><h2>Saved choices</h2></div></div><SavedUniversities /></div></div></div></section>;
}
