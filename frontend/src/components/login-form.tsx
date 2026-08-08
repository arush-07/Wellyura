"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const router = useRouter();

  const [email, setEmail] =
    useState("");

  const [otp, setOtp] =
    useState("");

  const [otpSent, setOtpSent] =
    useState(false);

  const [resendSeconds, setResendSeconds] =
    useState(0);

  const [message, setMessage] =
    useState("");

  const [isError, setIsError] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  useEffect(() => {
    if (resendSeconds <= 0) {
      return;
    }

    const timer = window.setTimeout(
      () => {
        setResendSeconds(
          (seconds) =>
            Math.max(0, seconds - 1),
        );
      },
      1000,
    );

    return () =>
      window.clearTimeout(timer);
  }, [resendSeconds]);

  function resetMessage() {
    setMessage("");
    setIsError(false);
  }

  function showError(text: string) {
    setIsError(true);
    setMessage(text);
  }

  function showSuccess(text: string) {
    setIsError(false);
    setMessage(text);
  }

  async function sendOtp() {
    const cleanEmail =
      email.trim().toLowerCase();

    if (!cleanEmail) {
      throw new Error(
        "Enter your email address.",
      );
    }

    const supabase =
      createClient();

    const { error } =
      await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          shouldCreateUser: false,
        },
      });

    if (error) {
      throw error;
    }

    setEmail(cleanEmail);
    setOtpSent(true);
    setOtp("");
    setResendSeconds(30);

    showSuccess(
      "We sent a verification code to your email.",
    );
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    resetMessage();
    setLoading(true);

    try {
      await sendOtp();
    } catch (error) {
      showError(
        error instanceof Error
          ? error.message
          : "Unable to send verification code.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleResendOtp() {
    if (resendSeconds > 0) {
      return;
    }

    resetMessage();
    setLoading(true);

    try {
      await sendOtp();

      showSuccess(
        "A new verification code was sent to your email.",
      );
    } catch (error) {
      showError(
        error instanceof Error
          ? error.message
          : "Unable to resend verification code.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp() {
    const cleanOtp =
      otp.trim();

    if (!/^\d{6}$/.test(cleanOtp)) {
      showError(
        "Enter the 6-digit verification code.",
      );
      return;
    }

    resetMessage();
    setLoading(true);

    try {
      const supabase =
        createClient();

      const { error } =
        await supabase.auth.verifyOtp({
          email,
          token: cleanOtp,
          type: "email",
        });

      if (error) {
        throw error;
      }

      router.replace("/workspace");
      router.refresh();
    } catch (error) {
      showError(
        error instanceof Error
          ? error.message
          : "Unable to verify the code.",
      );
    } finally {
      setLoading(false);
    }
  }

  function changeDetails() {
    setOtpSent(false);
    setOtp("");
    setResendSeconds(0);
    resetMessage();
  }

  return (
    <form
      className="auth-form"
      onSubmit={handleSubmit}
    >
      <span className="eyebrow">
        Welcome back
      </span>

      <h1>
        Sign in to your plan
      </h1>

      <p>
        Continue using your verified
        email address.
      </p>

      <div className="form-stack">
        <div className="form-row">
          <label htmlFor="email">
            Email address
          </label>

          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) =>
              setEmail(
                event.target.value,
              )
            }
            autoComplete="email"
            placeholder="you@example.com"
            disabled={otpSent}
            required
          />
        </div>

        {!otpSent ? (
          <button
            className="button button-dark auth-submit"
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Sending code..."
              : "Send verification code"}
          </button>
        ) : (
          <>
            <div className="form-row">
              <label htmlFor="login-otp">
                Verification code
              </label>

              <input
                id="login-otp"
                value={otp}
                onChange={(event) =>
                  setOtp(
                    event.target.value
                      .replace(/\D/g, "")
                      .slice(0, 6),
                  )
                }
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="6-digit code"
                maxLength={6}
              />
            </div>

            <button
              className="button button-dark auth-submit"
              type="button"
              disabled={loading}
              onClick={handleVerifyOtp}
            >
              {loading
                ? "Verifying..."
                : "Verify & sign in"}
            </button>

            <button
              className="button"
              type="button"
              disabled={
                loading ||
                resendSeconds > 0
              }
              onClick={handleResendOtp}
            >
              {resendSeconds > 0
                ? `Resend code in ${resendSeconds}s`
                : "Resend code"}
            </button>

            <button
              className="button"
              type="button"
              disabled={loading}
              onClick={changeDetails}
            >
              Change email
            </button>
          </>
        )}

        {message && (
          <p
            aria-live="polite"
            style={{
              color: isError
                ? "#b42318"
                : "#067647",
              fontWeight: 600,
            }}
          >
            {message}
          </p>
        )}
      </div>

      <p className="auth-switch">
        New to Wellyura?{" "}
        <Link href="/register">
          Create an account
        </Link>
      </p>
    </form>
  );
}
