"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { countries } from "@/lib/catalog";
import { createClient } from "@/lib/supabase/client";

export function RegisterForm() {
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const fullName = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const country = String(formData.get("country") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    setMessage("");
    setIsError(false);

    if (!fullName || !email || password.length < 8) {
      setIsError(true);
      setMessage("Enter your name, email and a password of at least 8 characters.");
      return;
    }

    setLoading(true);

    const supabase = createClient();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          full_name: fullName,
          destination_interest: country || null,
        },
      },
    });

    setLoading(false);

    if (error) {
      setIsError(true);
      setMessage(error.message);
      return;
    }

    if (data.session) {
      window.location.href = "/";
      return;
    }

    setMessage("Account created. Check your email to confirm your account.");
    form.reset();
  }

  return (
    <form
      className="auth-form auth-form-register"
      onSubmit={handleSubmit}
    >
      <div className="auth-form-heading">
        <span>Create account</span>
        <h2>Start your Wellyura plan</h2>
        <p>
          Begin with the essentials. You can shape your study preferences
          later.
        </p>
      </div>

      <div className="form-stack">
        <div className="form-row">
          <label htmlFor="name">Full name</label>
          <input
            id="name"
            name="name"
            autoComplete="name"
            placeholder="Your full name"
            required
          />
        </div>

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
          <label htmlFor="country">Destination interest</label>
          <select id="country" name="country" defaultValue="">
            <option value="">Still exploring</option>
            {countries.map((country) => (
              <option value={country.slug} key={country.slug}>
                {country.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-row">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            minLength={8}
            required
          />
          <small className="field-hint">
            Use at least 8 characters with a mix of letters and numbers.
          </small>
        </div>

        {message && (
          <p
            aria-live="polite"
            style={{
              color: isError ? "#b42318" : "#067647",
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
          {loading ? "Creating account..." : "Create account"}
        </button>
      </div>

      <p className="auth-terms">
        By creating an account, you agree to Wellyura&apos;s{" "}
        <Link href="/terms">Terms</Link> and{" "}
        <Link href="/privacy">Privacy Policy</Link>.
      </p>

      <p className="auth-switch">
        Already registered? <Link href="/login">Sign in</Link>
      </p>
    </form>
  );
}
