"use client";

import {
  BellRing,
  CalendarClock,
  Megaphone,
  Send,
  Trash2,
} from "lucide-react";

import {
  type FormEvent,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import type {
  AdminAnnouncementRow,
} from "@/lib/admin-types";

import {
  createAdminAnnouncement,
  deleteAdminAnnouncement,
  queueDeadlineNotifications,
  setAnnouncementPublished,
} from "@/lib/supabase/admin-workflows";

type Props = {
  initialAnnouncements: AdminAnnouncementRow[];
};

type AnnouncementForm = {
  type: string;
  title: string;
  message: string;
  linkUrl: string;
  published: boolean;
  publishAt: string;
  expiresAt: string;
};

const emptyForm: AnnouncementForm = {
  type: "general",
  title: "",
  message: "",
  linkUrl: "",
  published: false,
  publishAt: "",
  expiresAt: "",
};

const announcementTypes = [
  "general",
  "scholarship",
  "programme",
  "deadline",
  "system",
] as const;

function errorMessage(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error
  ) {
    return String(
      (error as {
        message: unknown;
      }).message,
    );
  }

  return "The operation could not be completed.";
}

function formatDate(value: string | null) {
  if (!value) {
    return "Not scheduled";
  }

  return new Date(value).toLocaleString();
}

export function AdminAnnouncementsPanel({
  initialAnnouncements,
}: Props) {
  const router = useRouter();

  const [announcements, setAnnouncements] =
    useState(initialAnnouncements);

  const [form, setForm] =
    useState<AnnouncementForm>(emptyForm);

  const [creating, setCreating] =
    useState(false);

  const [workingId, setWorkingId] =
    useState<string | null>(null);

  const [queueing, setQueueing] =
    useState(false);

  const [message, setMessage] =
    useState("");

  async function submitAnnouncement(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (
      !form.title.trim() ||
      !form.message.trim()
    ) {
      setMessage(
        "Title and message are required.",
      );

      return;
    }

    setCreating(true);
    setMessage("");

    try {
      const announcementId =
        await createAdminAnnouncement(form);

      const now =
        new Date().toISOString();

      setAnnouncements((current) => [
        {
          announcement_id:
            announcementId,

          announcement_type:
            form.type,

          title:
            form.title.trim(),

          message:
            form.message.trim(),

          link_url:
            form.linkUrl.trim() ||
            null,

          target_country_id:
            null,

          target_university_id:
            null,

          target_programme_id:
            null,

          is_published:
            form.published,

          publish_at:
            form.publishAt
              ? new Date(
                  form.publishAt,
                ).toISOString()
              : form.published
                ? now
                : null,

          expires_at:
            form.expiresAt
              ? new Date(
                  form.expiresAt,
                ).toISOString()
              : null,

          created_by:
            null,

          created_at:
            now,

          updated_at:
            now,
        },

        ...current,
      ]);

      setForm(emptyForm);

      setMessage(
        form.published
          ? "Announcement published and queued successfully."
          : "Announcement saved as a draft.",
      );

      router.refresh();
    } catch (error) {
      console.warn(
        "Could not create announcement:",
        error,
      );

      setMessage(
        errorMessage(error),
      );
    } finally {
      setCreating(false);
    }
  }

  async function togglePublished(
    announcement: AdminAnnouncementRow,
  ) {
    const nextPublished =
      !announcement.is_published;

    setWorkingId(
      announcement.announcement_id,
    );

    setMessage("");

    try {
      await setAnnouncementPublished(
        announcement.announcement_id,
        nextPublished,
      );

      setAnnouncements((current) =>
        current.map((item) =>
          item.announcement_id ===
          announcement.announcement_id
            ? {
                ...item,

                is_published:
                  nextPublished,

                publish_at:
                  nextPublished
                    ? item.publish_at ??
                      new Date().toISOString()
                    : item.publish_at,

                updated_at:
                  new Date().toISOString(),
              }
            : item,
        ),
      );

      setMessage(
        nextPublished
          ? "Announcement published and added to the notification queue."
          : "Announcement unpublished successfully.",
      );

      router.refresh();
    } catch (error) {
      console.warn(
        "Could not change announcement status:",
        error,
      );

      setMessage(
        errorMessage(error),
      );
    } finally {
      setWorkingId(null);
    }
  }

  async function removeAnnouncement(
    announcementId: string,
  ) {
    if (
      !window.confirm(
        "Delete this announcement? This cannot be undone.",
      )
    ) {
      return;
    }

    setWorkingId(announcementId);
    setMessage("");

    try {
      const deleted =
        await deleteAdminAnnouncement(
          announcementId,
        );

      if (deleted) {
        setAnnouncements((current) =>
          current.filter(
            (item) =>
              item.announcement_id !==
              announcementId,
          ),
        );

        setMessage(
          "Announcement deleted successfully.",
        );

        router.refresh();
      }
    } catch (error) {
      console.warn(
        "Could not delete announcement:",
        error,
      );

      setMessage(
        errorMessage(error),
      );
    } finally {
      setWorkingId(null);
    }
  }

  async function queueDeadlines() {
    setQueueing(true);
    setMessage("");

    try {
      const count =
        await queueDeadlineNotifications();

      setMessage(
        `${count} deadline reminder${
          count === 1 ? "" : "s"
        } added to the notification queue.`,
      );

      router.refresh();
    } catch (error) {
      console.warn(
        "Could not queue deadline reminders:",
        error,
      );

      setMessage(
        errorMessage(error),
      );
    } finally {
      setQueueing(false);
    }
  }

  return (
    <section className="admin-live-panel">
      <div className="admin-live-panel-head">
        <div>
          <span className="eyebrow">
            Platform communication
          </span>

          <h2>
            Announcements and notifications
          </h2>

          <p>
            Publish platform updates and create
            notification events for eligible
            Wellyura users.
          </p>
        </div>

        <span className="admin-count-pill">
          <Megaphone size={15} />

          {announcements.length} announcements
        </span>
      </div>

      {message && (
        <p className="form-message">
          {message}
        </p>
      )}

      <div className="admin-announcement-layout">
        <form
          className="admin-announcement-form"
          onSubmit={submitAnnouncement}
        >
          <div className="admin-form-heading">
            <Send size={19} />

            <div>
              <h3>Create announcement</h3>

              <p>
                Save it as a draft or publish it
                immediately.
              </p>
            </div>
          </div>

          <label>
            Announcement type

            <select
              value={form.type}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  type: event.target.value,
                }))
              }
            >
              {announcementTypes.map(
                (type) => (
                  <option
                    value={type}
                    key={type}
                  >
                    {type
                      .charAt(0)
                      .toUpperCase() +
                      type.slice(1)}
                  </option>
                ),
              )}
            </select>
          </label>

          <label>
            Title

            <input
              type="text"
              value={form.title}
              maxLength={140}
              placeholder="Important Wellyura update"
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  title:
                    event.target.value,
                }))
              }
            />
          </label>

          <label>
            Message

            <textarea
              value={form.message}
              rows={5}
              placeholder="Write the announcement message..."
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  message:
                    event.target.value,
                }))
              }
            />
          </label>

          <label>
            Optional link

            <input
              type="text"
              value={form.linkUrl}
              placeholder="/workspace/deadlines"
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  linkUrl:
                    event.target.value,
                }))
              }
            />
          </label>

          <div className="admin-form-grid">
            <label>
              Publish time

              <input
                type="datetime-local"
                value={form.publishAt}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    publishAt:
                      event.target.value,
                  }))
                }
              />
            </label>

            <label>
              Expiry time

              <input
                type="datetime-local"
                value={form.expiresAt}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    expiresAt:
                      event.target.value,
                  }))
                }
              />
            </label>
          </div>

          <label className="admin-checkbox-row">
            <input
              type="checkbox"
              checked={form.published}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  published:
                    event.target.checked,
                }))
              }
            />

            Publish immediately
          </label>

          <button
            className="button button-dark"
            type="submit"
            disabled={creating}
          >
            <Send size={16} />

            {creating
              ? "Saving..."
              : form.published
                ? "Publish announcement"
                : "Save draft"}
          </button>
        </form>

        <div className="admin-announcement-side">
          <article className="admin-queue-card">
            <BellRing size={20} />

            <div>
              <h3>
                Deadline reminder queue
              </h3>

              <p>
                Scan active student deadlines
                and create reminder events for
                eligible users.
              </p>
            </div>

            <button
              className="button button-light"
              type="button"
              disabled={queueing}
              onClick={queueDeadlines}
            >
              <CalendarClock size={16} />

              {queueing
                ? "Queueing..."
                : "Queue deadline reminders"}
            </button>
          </article>

          <div className="admin-announcement-list">
            {announcements.length === 0 ? (
              <div className="workspace-empty">
                <Megaphone size={24} />

                <h3>No announcements</h3>

                <p>
                  Drafts and published updates
                  will appear here.
                </p>
              </div>
            ) : (
              announcements.map(
                (announcement) => (
                  <article
                    className="admin-announcement-card"
                    key={
                      announcement.announcement_id
                    }
                  >
                    <div className="admin-announcement-card-head">
                      <div>
                        <span className="card-kicker">
                          {
                            announcement.announcement_type
                          }
                        </span>

                        <h3>
                          {announcement.title}
                        </h3>
                      </div>

                      <span
                        className={
                          announcement.is_published
                            ? "admin-status-pill admin-status-published"
                            : "admin-status-pill admin-status-draft"
                        }
                      >
                        {announcement.is_published
                          ? "Published"
                          : "Draft"}
                      </span>
                    </div>

                    <p>
                      {announcement.message}
                    </p>

                    <div className="admin-announcement-dates">
                      <span>
                        Publish:{" "}
                        {formatDate(
                          announcement.publish_at,
                        )}
                      </span>

                      <span>
                        Expires:{" "}
                        {formatDate(
                          announcement.expires_at,
                        )}
                      </span>
                    </div>

                    <div className="admin-announcement-actions">
                      <button
                        className="button button-light button-small"
                        type="button"
                        disabled={
                          workingId ===
                          announcement.announcement_id
                        }
                        onClick={() =>
                          togglePublished(
                            announcement,
                          )
                        }
                      >
                        <Send size={14} />

                        {workingId ===
                        announcement.announcement_id
                          ? "Updating..."
                          : announcement.is_published
                            ? "Unpublish"
                            : "Publish"}
                      </button>

                      <button
                        className="button button-light button-small"
                        type="button"
                        disabled={
                          workingId ===
                          announcement.announcement_id
                        }
                        onClick={() =>
                          removeAnnouncement(
                            announcement.announcement_id,
                          )
                        }
                      >
                        <Trash2 size={14} />

                        Delete
                      </button>
                    </div>
                  </article>
                ),
              )
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
