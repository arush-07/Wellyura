"use client";

import {
  useEffect,
  useState,
} from "react";
import Link from "next/link";

const COOKIE_NAME =
  "wellyura_cookie_consent";

const COOKIE_MAX_AGE =
  60 * 60 * 24 * 180;

type ConsentChoice =
  "accepted" | "rejected";

function getCookieConsent() {
  if (
    typeof document === "undefined"
  ) {
    return null;
  }

  const cookies =
    document.cookie.split("; ");

  const consentCookie =
    cookies.find((cookie) =>
      cookie.startsWith(
        `${COOKIE_NAME}=`,
      ),
    );

  if (!consentCookie) {
    return null;
  }

  const value =
    consentCookie.split("=")[1];

  if (
    value === "accepted" ||
    value === "rejected"
  ) {
    return value;
  }

  return null;
}

function setCookieConsent(
  choice: ConsentChoice,
) {
  const isSecure =
    window.location.protocol === "https:";

  document.cookie = [
    `${COOKIE_NAME}=${choice}`,
    `Max-Age=${COOKIE_MAX_AGE}`,
    "Path=/",
    "SameSite=Lax",
    isSecure ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ");
}

export function CookieConsentBanner() {
  const [visible, setVisible] =
    useState(false);

  useEffect(() => {
    const existingConsent =
      getCookieConsent();

    setVisible(!existingConsent);
  }, []);

  function handleChoice(
    choice: ConsentChoice,
  ) {
    setCookieConsent(choice);
    setVisible(false);

    window.dispatchEvent(
      new CustomEvent(
        "wellyura:cookie-consent",
        {
          detail: {
            choice,
          },
        },
      ),
    );
  }

  if (!visible) {
    return null;
  }

  return (
    <section
      className="cookie-consent"
      aria-label="Cookie consent"
    >
      <div className="cookie-consent-card">
        <div>
          <span className="eyebrow">
            Cookies
          </span>

          <h2>
            We use cookies
          </h2>

          <p>
            Wellyura uses essential cookies
            to keep your account signed in.
            We may also use optional cookies
            later to improve the website
            experience. You can accept or
            reject optional cookies now.
          </p>

          <p className="cookie-consent-link">
            Read our{" "}
            <Link href="/privacy">
              Privacy Policy
            </Link>
            .
          </p>
        </div>

        <div className="cookie-consent-actions">
          <button
            className="button"
            type="button"
            onClick={() =>
              handleChoice("rejected")
            }
          >
            Reject optional
          </button>

          <button
            className="button button-dark"
            type="button"
            onClick={() =>
              handleChoice("accepted")
            }
          >
            Accept cookies
          </button>
        </div>
      </div>
    </section>
  );
}
