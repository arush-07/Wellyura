import { ArrowUpRight, Bookmark, Compass, GitCompareArrows } from "lucide-react";

const journeySteps = [
  { number: "01", label: "Discover", detail: "Find your fit", icon: Compass, className: "auth-journey-step-one" },
  { number: "02", label: "Shortlist", detail: "Keep the best", icon: Bookmark, className: "auth-journey-step-two" },
  { number: "03", label: "Compare", detail: "Choose clearly", icon: GitCompareArrows, className: "auth-journey-step-three" },
];

export function AuthMotion() {
  return (
    <div className="auth-journey" aria-hidden="true">
      <div className="auth-journey-glow" />

      <div className="auth-journey-card">
        <div className="auth-journey-header">
          <div>
            <span className="auth-journey-eyebrow">Your study route</span>
            <strong>Focused decisions, one connected workspace.</strong>
          </div>
          <span className="auth-journey-live">
            <i /> Live workspace
          </span>
        </div>

        <div className="auth-journey-route">
          <svg viewBox="0 0 100 100" role="presentation" preserveAspectRatio="none">
            <defs>
              <linearGradient id="authJourneyGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#c9f36a" />
                <stop offset="50%" stopColor="#ffffff" />
                <stop offset="100%" stopColor="#ff6b4a" />
              </linearGradient>
            </defs>
            <path className="auth-journey-route-shadow" d="M9 70 C21 38 34 33 46 52 S69 76 91 36" />
            <path className="auth-journey-route-line" d="M9 70 C21 38 34 33 46 52 S69 76 91 36" />
          </svg>

          <span className="auth-journey-traveller" />
          <span className="auth-journey-node auth-journey-node-one" />
          <span className="auth-journey-node auth-journey-node-two" />
          <span className="auth-journey-node auth-journey-node-three" />

          {journeySteps.map(({ number, label, detail, icon: Icon, className }) => (
            <div className={`auth-journey-step ${className}`} key={label}>
              <span className="auth-journey-step-badge">{number}</span>
              <span className="auth-journey-step-copy">
                <strong>{label}</strong>
                <small>{detail}</small>
              </span>
              <span className="auth-journey-step-glyph"><Icon size={14} strokeWidth={2.1} /></span>
            </div>
          ))}
        </div>

        <div className="auth-journey-footer">
          <div className="auth-journey-stat">
            <span className="auth-journey-stat-icon"><Bookmark size={14} strokeWidth={2.1} /></span>
            <span>
              <small>Shortlist</small>
              <strong>6 saved choices</strong>
            </span>
          </div>

          <div className="auth-journey-next">
            <span>
              <small>Suggested next step</small>
              <strong>Compare tuition and fit</strong>
            </span>
            <ArrowUpRight size={17} strokeWidth={2.15} />
          </div>
        </div>
      </div>

      <span className="auth-journey-float auth-journey-float-one">New match</span>
      <span className="auth-journey-float auth-journey-float-two">Plan synced</span>
    </div>
  );
}
