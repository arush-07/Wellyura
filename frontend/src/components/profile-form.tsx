"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type CountryOption = {
  id: string;
  name: string;
};

type ProfileFormProps = {
  email: string;
  initialFullName: string;
  initialPhone: string;
  initialCountryId: string;
  countries: CountryOption[];
};

export function ProfileForm({
  email,
  initialFullName,
  initialPhone,
  initialCountryId,
  countries,
}: ProfileFormProps) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const fullName = String(formData.get("full_name") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").trim();
    const preferredCountryId = String(formData.get("preferred_country_id") ?? "").trim();

    if (!fullName) {
      setIsError(true);
      setMessage("Full name is required.");
      return;
    }

    setLoading(true);
    setMessage("");
    setIsError(false);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      setIsError(true);
      setMessage("Your session expired. Please sign in again.");
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        phone: phone || null,
        preferred_country_id: preferredCountryId || null,
      })
      .eq("id", user.id);

    if (!error) {
      await supabase.auth.updateUser({ data: { full_name: fullName } });
    }

    setLoading(false);

    if (error) {
      setIsError(true);
      setMessage(error.message);
      return;
    }

    setMessage("Profile updated successfully.");
    window.dispatchEvent(new Event("wellyura:profile-updated"));
    router.refresh();
  }

  return (
    <form className="form-stack workspace-form" onSubmit={handleSubmit}>
      <div className="form-row">
        <label htmlFor="profile-email">Email address</label>
        <input id="profile-email" value={email} disabled />
      </div>

      <div className="form-row">
        <label htmlFor="full_name">Full name</label>
        <input
          id="full_name"
          name="full_name"
          defaultValue={initialFullName}
          autoComplete="name"
          required
        />
      </div>

      <div className="form-row">
        <label htmlFor="phone">Phone number</label>
        <input
          id="phone"
          name="phone"
          defaultValue={initialPhone}
          autoComplete="tel"
          placeholder="Optional"
        />
      </div>

      <div className="form-row">
        <label htmlFor="preferred_country_id">Preferred destination</label>
        <select
          id="preferred_country_id"
          name="preferred_country_id"
          defaultValue={initialCountryId}
        >
          <option value="">Still exploring</option>
          {countries.map((country) => (
            <option value={country.id} key={country.id}>{country.name}</option>
          ))}
        </select>
      </div>

      {message && (
        <p className={isError ? "form-message form-message-error" : "form-message form-message-success"}>
          {message}
        </p>
      )}

      <button className="button button-dark" type="submit" disabled={loading}>
        {loading ? "Saving..." : "Save profile"}
      </button>
    </form>
  );
}

