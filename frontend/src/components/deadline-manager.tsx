"use client";

import { FormEvent, useState } from "react";
import { Check, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Deadline = {
  id: string;
  title: string;
  due_date: string;
  notes: string | null;
  is_completed: boolean;
};

type DeadlineManagerProps = {
  initialDeadlines: Deadline[];
};

export function DeadlineManager({ initialDeadlines }: DeadlineManagerProps) {
  const [deadlines, setDeadlines] = useState(initialDeadlines);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function addDeadline(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const title = String(formData.get("title") ?? "").trim();
    const dueDate = String(formData.get("due_date") ?? "").trim();
    const notes = String(formData.get("notes") ?? "").trim();

    if (!title || !dueDate) {
      setMessage("Add a title and due date.");
      return;
    }

    setLoading(true);
    setMessage("");

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      setMessage("Your session expired. Please sign in again.");
      return;
    }

    const { data, error } = await supabase
      .from("user_deadlines")
      .insert({
        user_id: user.id,
        title,
        due_date: dueDate,
        notes: notes || null,
      })
      .select("id, title, due_date, notes, is_completed")
      .single();

    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setDeadlines((current) => [...current, data].sort((a, b) => a.due_date.localeCompare(b.due_date)));
    setMessage("Deadline added.");
    form.reset();
  }

  async function toggleDeadline(deadline: Deadline) {
    const supabase = createClient();
    const nextValue = !deadline.is_completed;

    const { error } = await supabase
      .from("user_deadlines")
      .update({ is_completed: nextValue })
      .eq("id", deadline.id);

    if (error) {
      setMessage(error.message);
      return;
    }

    setDeadlines((current) =>
      current.map((item) => item.id === deadline.id ? { ...item, is_completed: nextValue } : item)
    );
  }

  async function removeDeadline(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from("user_deadlines").delete().eq("id", id);

    if (error) {
      setMessage(error.message);
      return;
    }

    setDeadlines((current) => current.filter((item) => item.id !== id));
  }

  return (
    <div className="deadline-manager">
      <form className="form-stack deadline-form" onSubmit={addDeadline}>
        <div className="workspace-form-grid">
          <div className="form-row">
            <label htmlFor="deadline-title">Deadline</label>
            <input id="deadline-title" name="title" placeholder="Application deadline" required />
          </div>

          <div className="form-row">
            <label htmlFor="deadline-date">Due date</label>
            <input id="deadline-date" name="due_date" type="date" required />
          </div>
        </div>

        <div className="form-row">
          <label htmlFor="deadline-notes">Notes</label>
          <textarea id="deadline-notes" name="notes" placeholder="Documents, university or next action" />
        </div>

        {message && <p className="form-message">{message}</p>}

        <button className="button button-dark" type="submit" disabled={loading}>
          {loading ? "Adding..." : "Add deadline"}
        </button>
      </form>

      <div className="deadline-list">
        {deadlines.length === 0 ? (
          <div className="workspace-empty">
            <h3>No deadlines yet</h3>
            <p>Add your first application, scholarship or document deadline.</p>
          </div>
        ) : (
          deadlines.map((deadline) => (
            <article className={deadline.is_completed ? "deadline-item completed" : "deadline-item"} key={deadline.id}>
              <button
                className="deadline-check"
                type="button"
                onClick={() => toggleDeadline(deadline)}
                aria-label={deadline.is_completed ? "Mark incomplete" : "Mark complete"}
              >
                {deadline.is_completed && <Check size={16} />}
              </button>

              <div>
                <strong>{deadline.title}</strong>
                <span>{new Date(`${deadline.due_date}T00:00:00`).toLocaleDateString()}</span>
                {deadline.notes && <p>{deadline.notes}</p>}
              </div>

              <button
                className="mini-action"
                type="button"
                onClick={() => removeDeadline(deadline.id)}
                aria-label="Delete deadline"
              >
                <Trash2 size={16} />
              </button>
            </article>
          ))
        )}
      </div>
    </div>
  );
}

