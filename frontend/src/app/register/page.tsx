import type { Metadata } from "next";
import { AuthMotion } from "@/components/auth-motion";
import { RegisterForm } from "@/components/register-form";
import { safeAuthNext } from "@/lib/auth-next";

export const metadata: Metadata = {
  title: "Create account",
  robots: {
    index: false,
    follow: false,
  },
};

type SearchParams =
  Promise<Record<string, string | string[] | undefined>>;

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;

  const nextPath =
    safeAuthNext(params.next);

  return (
    <section className="auth-page auth-page-register">
      <div className="auth-art">
        <div className="auth-copy">
          <span className="auth-kicker">Start your plan</span>
          <h1>Build a shortlist with a point of view.</h1>
          <p className="auth-description">
            Bring preferences, notes, comparisons and future counselling or
            application steps into one focused workspace.
          </p>
        </div>

        <AuthMotion />
      </div>

      <div className="auth-form-wrap">
        <RegisterForm nextPath={nextPath} />
      </div>
    </section>
  );
}

