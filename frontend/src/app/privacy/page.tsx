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
        Cookies, Meta Pixel and
        Conversions API
      </h2>

      <p>
        Wellyura uses essential cookies for
        core functionality such as account
        sessions. Optional measurement and
        advertising technologies are used
        only after you accept optional
        cookies.
      </p>

      <p>
        If you accept optional cookies,
        Wellyura may use Meta Pixel and
        Meta Conversions API to understand
        website visits and measure
        advertising effectiveness.
      </p>

      <p>
        Depending on the event, information
        sent for measurement may include the
        page visited, event time, browser or
        device information, IP address,
        referral or advertising identifiers,
        and identifiers stored by Meta
        technologies. Browser and server
        events may use matching event IDs so
        Meta can identify duplicate reports
        of the same interaction.
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