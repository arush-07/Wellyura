import type { Metadata } from "next";
import { AuthMotion } from "@/components/auth-motion";
import { LoginForm } from "@/components/login-form";

export const metadata: Metadata = {
  title: "Sign in",
  robots: {
    index: false,
    follow: false,
  },
};

export default function LoginPage() {
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
        <LoginForm />
      </div>
    </section>
  );
}
