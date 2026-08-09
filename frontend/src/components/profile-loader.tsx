"use client";

import {
  useEffect,
  useState,
} from "react";

import { ProfileForm } from "@/components/profile-form";
import { authenticatedApiFetch } from "@/lib/api/client";

type CountryOption = {
  id: string;
  name: string;
};

type ProfileResponse = {
  email: string | null;
  full_name: string | null;
  preferred_country_id: string | null;
};

type ApiErrorResponse = {
  detail?: string;
};

type ProfileLoaderProps = {
  countries: CountryOption[];
};

export function ProfileLoader({
  countries,
}: ProfileLoaderProps) {
  const [profile, setProfile] =
    useState<ProfileResponse | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [message, setMessage] =
    useState("");

  async function loadProfile() {
    setLoading(true);
    setMessage("");

    try {
      const response =
        await authenticatedApiFetch(
          "/api/v1/profile",
        );

      if (!response.ok) {
        let errorMessage =
          "Unable to load your profile.";

        try {
          const error =
            (await response.json()) as ApiErrorResponse;

          if (
            typeof error.detail ===
            "string"
          ) {
            errorMessage =
              error.detail;
          }
        } catch {
          // Keep generic message.
        }

        throw new Error(errorMessage);
      }

      const data =
        (await response.json()) as ProfileResponse;

      setProfile(data);
    } catch (error) {
      setProfile(null);

      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to load your profile.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadProfile();
  }, []);

  if (loading) {
    return (
      <div className="form-stack">
        <p className="form-message">
          Loading your profile...
        </p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="form-stack">
        <p className="form-message form-message-error">
          {message ||
            "Unable to load your profile."}
        </p>

        <button
          className="button button-dark"
          type="button"
          onClick={() => {
            void loadProfile();
          }}
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <ProfileForm
      email={profile.email ?? ""}
      initialFullName={
        profile.full_name ?? ""
      }
      initialCountryId={
        profile.preferred_country_id ?? ""
      }
      countries={countries}
    />
  );
}
