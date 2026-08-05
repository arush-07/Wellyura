"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useWorkspaceStore } from "@/lib/workspace-store";

type WorkspaceOverviewProps = {
  firstName: string;
  deadlineCount: number;
};

export function WorkspaceOverview({ firstName, deadlineCount }: WorkspaceOverviewProps) {
  const savedCount = useWorkspaceStore((state) => state.savedUniversityIds.length);
  const compareCount = useWorkspaceStore((state) => state.compareUniversityIds.length);

  return (
    <div className="workspace-main">
      <section className="workspace-welcome">
        <div>
          <span className="eyebrow">Welcome, {firstName}</span>
          <h1>Make the next<br />choice clearer.</h1>
          <p>Your account is connected. Manage your profile, deadlines and alert preferences from one workspace.</p>
        </div>
        <Link className="button button-dark" href="/discover">
          Discover options <ArrowRight size={17} />
        </Link>
      </section>

      <div className="workspace-metrics">
        <article><strong>{savedCount}</strong><span>Saved institutions</span></article>
        <article><strong>{compareCount}</strong><span>Choices in comparison</span></article>
        <article><strong>{deadlineCount}</strong><span>Active deadlines</span></article>
      </div>

      <section className="workspace-panel">
        <div className="workspace-panel-head">
          <h2>Your decision route</h2>
          <span className="data-note">Account connected</span>
        </div>
        <div className="plan-steps">
          <article className="plan-step"><span>01</span><h3>Set preferences</h3><p>Add subject, degree level, destination and budget preferences.</p></article>
          <article className="plan-step"><span>02</span><h3>Build a shortlist</h3><p>Save options and group them by target, ambitious or safe choices.</p></article>
          <article className="plan-step"><span>03</span><h3>Compare details</h3><p>Review costs, intakes, requirements and location side by side.</p></article>
          <article className="plan-step"><span>04</span><h3>Track next steps</h3><p>Add deadlines and control your alert preferences.</p></article>
        </div>
      </section>

      <section className="workspace-panel">
        <div className="workspace-panel-head">
          <h2>Continue your research</h2>
          <Link className="arrow-link" href="/workspace/saved">
            View saved <ArrowRight size={16} />
          </Link>
        </div>
        <p>You have {savedCount} saved institutions and {compareCount} choices ready to compare.</p>
      </section>
    </div>
  );
}

