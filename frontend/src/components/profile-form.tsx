"use client";

import {
  FormEvent,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import { authenticatedApiFetch } from "@/lib/api/client";
import { createClient } from "@/lib/supabase/client";

type CountryOption = {
  id: string;
  name: string;
};

type ProfileFormProps = {
  email: string;
  initialFullName: string;
  initialCountryId: string;
  countries: CountryOption[];
};

type ApiErrorResponse = {
  detail?: string;
};

export function ProfileForm({
  email,
  initialFullName,
  initialCountryId,
  countries,
}: ProfileFormProps) {
  const router = useRouter();

  const [message, setMessage] =
    useState("");

  const [isError, setIsError] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const formData =
      new FormData(event.currentTarget);

    const fullName = String(
      formData.get("full_name") ?? "",
    ).trim();

    const preferredCountryId = String(
      formData.get(
        "preferred_country_id",
      ) ?? "",
    ).trim();

    if (!fullName) {
      setIsError(true);
      setMessage(
        "Full name is required.",
      );
      return;
    }

    setLoading(true);
    setMessage("");
    setIsError(false);

    try {
      const response =
        await authenticatedApiFetch(
          "/api/v1/profile",
          {
            method: "PATCH",
            body: JSON.stringify({
              full_name: fullName,
              preferred_country_id:
                preferredCountryId || null,
            }),
          },
        );

      if (!response.ok) {
        let errorMessage =
          "Unable to update profile.";

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

        throw new Error(
          errorMessage,
        );
      }

      const supabase =
        createClient();

      const {
        error: metadataError,
      } =
        await supabase.auth.updateUser({
          data: {
            full_name: fullName,
          },
        });

      if (metadataError) {
        console.error(
          "Auth metadata update failed:",
          metadataError,
        );
      }

      setIsError(false);
      setMessage(
        "Profile updated successfully.",
      );

      window.dispatchEvent(
        new Event(
          "wellyura:profile-updated",
        ),
      );

      router.refresh();
    } catch (error) {
      setIsError(true);

      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to update profile.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      className="form-stack workspace-form"
      onSubmit={handleSubmit}
    >
      <div className="form-row">
        <label htmlFor="profile-email">
          Email address
        </label>

        <input
          id="profile-email"
          value={email}
          disabled
        />
      </div>

      <div className="form-row">
        <label htmlFor="full_name">
          Full name
        </label>

        <input
          id="full_name"
          name="full_name"
          defaultValue={initialFullName}
          autoComplete="name"
          required
        />
      </div>

      <div className="form-row">
        <label htmlFor="preferred_country_id">
          Preferred destination
        </label>

        <select
          id="preferred_country_id"
          name="preferred_country_id"
          defaultValue={initialCountryId}
        >
          <option value="">
            Still exploring
          </option>

          {countries.map(
            (country) => (
              <option
                value={country.id}
                key={country.id}
              >
                {country.name}
              </option>
            ),
          )}
        </select>
      </div>

      {message && (
        <p
          className={
            isError
              ? "form-message form-message-error"
              : "form-message form-message-success"
          }
        >
          {message}
        </p>
      )}

      <button
        className="button button-dark"
        type="submit"
        disabled={loading}
      >
        {loading
          ? "Saving..."
          : "Save profile"}
      </button>
    </form>
  );
}
