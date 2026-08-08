"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { countries } from "@/lib/catalog";
import { createClient } from "@/lib/supabase/client";

export function RegisterForm() {
  const router = useRouter();

  const [fullName, setFullName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [destination, setDestination] =
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
    const cleanName =
      fullName.trim();

    const cleanEmail =
      email.trim().toLowerCase();

    if (!cleanName) {
      throw new Error(
        "Enter your full name.",
      );
    }

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
          shouldCreateUser: true,
          data: {
            full_name: cleanName,
            destination_interest:
              destination || null,
          },
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
        Create account
      </span>

      <h1>
        Start your Wellyura plan
      </h1>

      <p>
        Create your account using your
        email address.
      </p>

      <div className="form-stack">
        <div className="form-row">
          <label htmlFor="name">
            Full name
          </label>

          <input
            id="name"
            value={fullName}
            onChange={(event) =>
              setFullName(
                event.target.value,
              )
            }
            autoComplete="name"
            placeholder="Your full name"
            disabled={otpSent}
            required
          />
        </div>

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

        <div className="form-row">
          <label htmlFor="country">
            Destination interest
          </label>

          <select
            id="country"
            value={destination}
            onChange={(event) =>
              setDestination(
                event.target.value,
              )
            }
            disabled={otpSent}
          >
            <option value="">
              Still exploring
            </option>

            {countries.map(
              (country) => (
                <option
                  value={country.slug}
                  key={country.slug}
                >
                  {country.name}
                </option>
              ),
            )}
          </select>
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
              <label htmlFor="otp">
                Verification code
              </label>

              <input
                id="otp"
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
                : "Verify & create account"}
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
              Change details
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

      <p className="auth-terms">
        By creating an account, you agree
        to Wellyura&apos;s{" "}
        <Link href="/terms">
          Terms
        </Link>{" "}
        and{" "}
        <Link href="/privacy">
          Privacy Policy
        </Link>
        .
      </p>

      <p className="auth-switch">
        Already registered?{" "}
        <Link href="/login">
          Sign in
        </Link>
      </p>
    </form>
  );
}
