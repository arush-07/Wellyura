"use client";

import { FormEvent, useState } from "react";

const CONTACT_EMAIL = "contact@wellyura.com";

export function ContactForm() {
  const [status, setStatus] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = new FormData(event.currentTarget);

    const name = String(form.get("name") || "");
    const email = String(form.get("email") || "");
    const topic = String(form.get("topic") || "");
    const message = String(form.get("message") || "");

    const subject = encodeURIComponent(`Wellyura enquiry - ${topic}`);

    const body = encodeURIComponent(
      `Name: ${name}\nEmail: ${email}\nTopic: ${topic}\n\nMessage:\n${message}`,
    );

    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;

    setStatus("Opening your email app...");
  }

  return (
    <form className="contact-form" onSubmit={handleSubmit}>
      <label>
        <span>Name</span>
        <input name="name" type="text" placeholder="Your name" required />
      </label>

      <label>
        <span>Email</span>
        <input name="email" type="email" placeholder="you@example.com" required />
      </label>

      <label>
        <span>What can we help with?</span>
        <select name="topic" defaultValue="General enquiry">
          <option>General enquiry</option>
          <option>Student support</option>
          <option>Data correction</option>
          <option>University partnership</option>
          <option>Accommodation enquiry</option>
          <option>Collaboration</option>
        </select>
      </label>

      <label>
        <span>Message</span>
        <textarea
          name="message"
          placeholder="Tell us a little about your request"
          rows={6}
          required
        />
      </label>

      <button className="button button-dark" type="submit">
        Send enquiry
      </button>

      {status && <p className="form-message">{status}</p>}
    </form>
  );
}
