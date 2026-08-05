"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type AlertPreferencesProps = {
  initialValues: {
    deadline_reminders: boolean;
    scholarship_updates: boolean;
    programme_updates: boolean;
    email_notifications: boolean;
  };
};

export function AlertPreferences({ initialValues }: AlertPreferencesProps) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    setLoading(true);
    setMessage("");

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      setMessage("Your session expired. Please sign in again.");
      return;
    }

    const { error } = await supabase
      .from("user_alert_preferences")
      .upsert({
        user_id: user.id,
        deadline_reminders: formData.get("deadline_reminders") === "on",
        scholarship_updates: formData.get("scholarship_updates") === "on",
        programme_updates: formData.get("programme_updates") === "on",
        email_notifications: formData.get("email_notifications") === "on",
      }, { onConflict: "user_id" });

    setLoading(false);
    setMessage(error ? error.message : "Alert preferences saved.");
  }

  return (
    <form className="form-stack workspace-form" onSubmit={handleSubmit}>
      <label className="alert-option">
        <input
          name="deadline_reminders"
          type="checkbox"
          defaultChecked={initialValues.deadline_reminders}
        />
        <span><strong>Deadline reminders</strong><small>Remind me about approaching application and document deadlines.</small></span>
      </label>

      <label className="alert-option">
        <input
          name="scholarship_updates"
          type="checkbox"
          defaultChecked={initialValues.scholarship_updates}
        />
        <span><strong>Scholarship updates</strong><small>Keep scholarship opportunities in my alert preferences.</small></span>
      </label>

      <label className="alert-option">
        <input
          name="programme_updates"
          type="checkbox"
          defaultChecked={initialValues.programme_updates}
        />
        <span><strong>Programme updates</strong><small>Track changes related to programmes I explore.</small></span>
      </label>

      <label className="alert-option">
        <input
          name="email_notifications"
          type="checkbox"
          defaultChecked={initialValues.email_notifications}
        />
        <span><strong>Email notifications</strong><small>Allow Wellyura to email enabled alerts after delivery automation is connected.</small></span>
      </label>

      {message && <p className="form-message">{message}</p>}

      <button className="button button-dark" type="submit" disabled={loading}>
        {loading ? "Saving..." : "Save alert preferences"}
      </button>
    </form>
  );
}

