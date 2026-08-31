import type { Metadata } from "next";
import { AuthMotion } from "@/components/auth-motion";
import { LoginForm } from "@/components/login-form";
import { safeAuthNext } from "@/lib/auth-next";

export const metadata: Metadata = {
  title: "Sign in",
  robots: {
    index: false,
    follow: false,
  },
};

type SearchParams =
  Promise<Record<string, string | string[] | undefined>>;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;

  const nextPath =
    safeAuthNext(params.next);

  return (
    <section className="auth-page">
      <div className="auth-art">
        <div className="auth-copy">
          <span className="auth-kicker">Student workspace</span>
          <h1>Your plan remembers the why.</h1>
          <p className="auth-description">
            Keep saved choices, comparison boards, notes and future
            application tasks together across devices.
          </p>
        </div>

        <AuthMotion />
      </div>

      <div className="auth-form-wrap">
        <LoginForm nextPath={nextPath} />
      </div>
    </section>
  );
}
