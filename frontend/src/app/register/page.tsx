import type { Metadata } from "next";
import { AuthMotion } from "@/components/auth-motion";
import { RegisterForm } from "@/components/register-form";

export const metadata: Metadata = {
  title: "Create account",
  robots: {
    index: false,
    follow: false,
  },
};

export default function RegisterPage() {
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
        <RegisterForm />
      </div>
    </section>
  );
}

