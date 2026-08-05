"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    setMessage("");

    if (!email || !password) {
      setMessage("Enter your email address and password.");
      return;
    }

    setLoading(true);

    const supabase = createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    router.replace("/workspace");
    router.refresh();
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <div className="auth-form-heading">
        <span>Welcome back</span>
        <h2>Sign in to your plan</h2>
        <p>
          Continue exploring universities, programmes and the choices you saved.
        </p>
      </div>

      <div className="form-stack">
        <div className="form-row">
          <label htmlFor="email">Email address</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            required
          />
        </div>

        <div className="form-row">
          <div className="form-label-row">
            <label htmlFor="password">Password</label>
            <Link href="#">Forgot password?</Link>
          </div>

          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            required
          />
        </div>

        {message && (
          <p
            aria-live="polite"
            style={{
              color: "#b42318",
              fontWeight: 600,
            }}
          >
            {message}
          </p>
        )}

        <button
          className="button button-dark auth-submit"
          type="submit"
          disabled={loading}
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </div>

      <p className="auth-switch">
        New to Wellyura?{" "}
        <Link href="/register">Create an account</Link>
      </p>
    </form>
  );
}
