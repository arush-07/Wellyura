import type {
  Metadata,
} from "next";

export const metadata: Metadata = {
  title: "Privacy policy",
};

export default function PrivacyPage() {
  return (
    <div className="prose-shell">
      <span className="eyebrow">
        Legal
      </span>

      <h1>Privacy policy</h1>

      <p>
        This privacy information describes
        how Wellyura handles information used
        to operate and improve the platform.
        It should be reviewed by qualified
        legal counsel as the service and its
        data practices evolve.
      </p>

      <h2>
        Information collected
      </h2>

      <p>
        Account and platform functionality
        may collect profile details, study
        preferences, saved choices,
        enquiries and application-planning
        information when you choose to
        provide or save it.
      </p>

      <h2>
        Cookies and Meta Pixel
      </h2>

      <p>
        Wellyura uses essential cookies for
        core functionality such as account
        sessions. Optional cookies are used
        only after you accept them.
      </p>

      <p>
        If you accept optional cookies,
        Wellyura may use Meta Pixel, provided
        by Meta Platforms, to understand
        website visits and measure the
        effectiveness of advertising. This
        may involve information such as page
        visits, browser or device information,
        referring pages and identifiers used
        by Meta for measurement and
        advertising services.
      </p>

      <h2>
        How information is used
      </h2>

      <p>
        Information may be used to operate
        the platform, personalise the student
        workspace, respond to enquiries,
        improve the service, understand
        website performance and measure
        advertising effectiveness.
      </p>

      <h2>Your choices</h2>

      <p>
        You can accept or reject optional
        cookies through the cookie banner.
        Rejecting optional cookies does not
        prevent access to the core Wellyura
        website.
      </p>

      <p>
        Additional privacy rights, including
        access, correction and deletion
        rights, may apply depending on your
        jurisdiction.
      </p>
    </div>
  );
}