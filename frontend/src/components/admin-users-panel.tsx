"use client";

import {
  useState,
} from "react";

import {
  ShieldCheck,
  UserCog,
} from "lucide-react";

import {
  useRouter,
} from "next/navigation";

import type {
  AdminUserRow,
} from "@/lib/admin-types";

import {
  setAdminUserRole,
  type AdminRole,
} from "@/lib/supabase/admin-workflows";

type Props = {
  initialUsers: AdminUserRow[];
};

const roles: AdminRole[] = [
  "student",
  "support",
  "editor",
  "publisher",
  "admin",
];

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

  return "Could not update this user.";
}

function formatDate(value: string | null) {
  if (!value) {
    return "Never";
  }

  return new Date(value).toLocaleString();
}

export function AdminUsersPanel({
  initialUsers,
}: Props) {
  const router = useRouter();

  const [users, setUsers] =
    useState(initialUsers);

  const [workingKey, setWorkingKey] =
    useState<string | null>(null);

  const [message, setMessage] =
    useState("");

  async function toggleRole(
    userId: string,
    role: AdminRole,
  ) {
    const user = users.find(
      (item) => item.user_id === userId,
    );

    if (!user) {
      return;
    }

    const enabled =
      user.roles.includes(role);

    const key = `${userId}:${role}`;

    setWorkingKey(key);
    setMessage("");

    try {
      await setAdminUserRole(
        userId,
        role,
        !enabled,
      );

      setUsers((current) =>
        current.map((item) => {
          if (item.user_id !== userId) {
            return item;
          }

          return {
            ...item,

            roles: enabled
              ? item.roles.filter(
                  (existingRole) =>
                    existingRole !== role,
                )
              : Array.from(
                  new Set([
                    ...item.roles,
                    role,
                  ]),
                ),
          };
        }),
      );

      setMessage(
        `${role} role ${
          enabled ? "removed" : "added"
        } successfully.`,
      );

      router.refresh();
    } catch (error) {
      console.warn(
        "Could not update user role:",
        error,
      );

      setMessage(
        errorMessage(error),
      );
    } finally {
      setWorkingKey(null);
    }
  }

  return (
    <section className="admin-live-panel">
      <div className="admin-live-panel-head">
        <div>
          <span className="eyebrow">
            Access control
          </span>

          <h2>User roles</h2>

          <p>
            Assign student, support, editorial,
            publishing and administrator access.
          </p>
        </div>

        <span className="admin-count-pill">
          <UserCog size={15} />
          {users.length} users
        </span>
      </div>

      {message && (
        <p className="form-message">
          {message}
        </p>
      )}

      <div className="admin-user-list">
        {users.map((user) => (
          <article
            className="admin-user-card"
            key={user.user_id}
          >
            <div className="admin-user-identity">
              <div className="admin-user-avatar">
                {(user.full_name ||
                  user.email ||
                  "U")
                  .trim()
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div>
                <strong>
                  {user.full_name ||
                    "Wellyura user"}
                </strong>

                <span>{user.email}</span>
              </div>
            </div>

            <div className="admin-user-dates">
              <span>
                Joined{" "}
                {formatDate(
                  user.created_at,
                )}
              </span>

              <span>
                Last sign-in{" "}
                {formatDate(
                  user.last_sign_in_at,
                )}
              </span>
            </div>

            <div className="admin-role-grid">
              {roles.map((role) => {
                const enabled =
                  user.roles.includes(role);

                const key =
                  `${user.user_id}:${role}`;

                return (
                  <button
                    className={
                      enabled
                        ? "admin-role-button active"
                        : "admin-role-button"
                    }
                    type="button"
                    key={role}
                    disabled={
                      workingKey === key
                    }
                    onClick={() =>
                      toggleRole(
                        user.user_id,
                        role,
                      )
                    }
                  >
                    {role === "admin" && (
                      <ShieldCheck
                        size={14}
                      />
                    )}

                    {workingKey === key
                      ? "Updating..."
                      : role}
                  </button>
                );
              })}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
