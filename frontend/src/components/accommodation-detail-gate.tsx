"use client";

import {
  useEffect,
  useState,
} from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight, X } from "lucide-react";

import { createClient } from "@/lib/supabase/client";

type AccommodationDetailGateProps = {
  href: string;
  accommodationName: string;
};

export function AccommodationDetailGate({
  href,
  accommodationName,
}: AccommodationDetailGateProps) {
  const router = useRouter();

  const [open, setOpen] =
    useState(false);

  const [mounted, setMounted] =
    useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    function handleEscape(
      event: KeyboardEvent,
    ) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener(
      "keydown",
      handleEscape,
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      window.removeEventListener(
        "keydown",
        handleEscape,
      );
    };
  }, [open]);

  async function handleOpenDetails() {
    const supabase =
      createClient();

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session) {
      router.push(href);
      return;
    }

    setOpen(true);
  }

  const modal =
    open ? (
      <div
        className="auth-gate-overlay"
        role="presentation"
        onClick={() => setOpen(false)}
      >
        <div
          className="auth-gate-card"
          role="dialog"
          aria-modal="true"
          aria-label="Login required"
          onClick={(event) =>
            event.stopPropagation()
          }
        >
          <button
            className="auth-gate-close"
            type="button"
            aria-label="Close"
            onClick={() => setOpen(false)}
          >
            <X size={18} />
          </button>

          <span className="eyebrow">
            Account required
          </span>

          <h2>
            Sign in to view accommodation details
          </h2>

          <p>
            You can browse accommodation
            options freely. To view full
            details for{" "}
            <strong>{accommodationName}</strong>,
            please sign in or create your
            Wellyura account.
          </p>

          <div className="auth-gate-actions">
            <Link
              className="button button-dark"
              href="/login"
            >
              Sign in
            </Link>

            <Link
              className="button"
              href="/register"
            >
              Create account
            </Link>
          </div>
        </div>
      </div>
    ) : null;

  return (
    <>
      <button
        className="round-link"
        type="button"
        aria-label={`View details for ${accommodationName}`}
        onClick={handleOpenDetails}
      >
        <ArrowUpRight size={18} />
      </button>

      {mounted && modal
        ? createPortal(
            modal,
            document.body,
          )
        : null}
    </>
  );
}
