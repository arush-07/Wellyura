"use client";

import Link from "next/link";
import { ArrowLeft, Menu, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BrandMark } from "@/components/brand-mark";
import { createClient } from "@/lib/supabase/client";
import { siteConfig } from "@/lib/site";

const globalBannerItems = Array.from(
  { length: 8 },
  () => "Wellyura"
);

type SiteHeaderProps = {
  compact?: boolean;
};

export function SiteHeader({
  compact = false,
}: SiteHeaderProps) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [open, setOpen] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [firstName, setFirstName] = useState("Student");
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!mounted) return;

      if (!user) {
        setAuthenticated(false);
        setIsAdmin(false);
        setFirstName("Student");
        return;
      }

      setAuthenticated(true);

      const [
        { data: profile },
        { data: adminRole },
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .maybeSingle(),

        supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("role", "admin")
          .maybeSingle(),
      ]);

      if (!mounted) return;

      const name =
        profile?.full_name ||
        user.user_metadata?.full_name ||
        user.email?.split("@")[0] ||
        "Student";

      setFirstName(
        String(name).trim().split(/\s+/)[0] ||
          "Student"
      );

      setIsAdmin(Boolean(adminRole));
    }

    void loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      window.setTimeout(() => {
        if (event === "SIGNED_OUT") {
          setAuthenticated(false);
          setIsAdmin(false);
          setFirstName("Student");
          setSigningOut(false);
          return;
        }

        void loadUser();
      }, 0);
    });

    window.addEventListener(
      "wellyura:profile-updated",
      loadUser
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();

      window.removeEventListener(
        "wellyura:profile-updated",
        loadUser
      );
    };
  }, [supabase]);

  async function handleSignOut() {
    if (signingOut) return;

    setSigningOut(true);

    try {
      const { error } = await supabase.auth.signOut({
        scope: "local",
      });

      if (error) {
        throw error;
      }

      setAuthenticated(false);
      setIsAdmin(false);
      setOpen(false);

      router.replace("/login");
      router.refresh();
    } catch (error) {
      console.error("Sign out failed:", error);
      setSigningOut(false);

      window.alert(
        "Could not sign out. Please try again."
      );
    }
  }

  if (compact) {
    return (
      <header className="auth-site-header">
        <div className="auth-header-inner shell">
          <BrandMark />

          <Link
            className="auth-back-link"
            href="/"
          >
            <ArrowLeft
              size={17}
              aria-hidden="true"
            />
            Back to Wellyura
          </Link>
        </div>
      </header>
    );
  }

  return (
    <header className="site-header">
      <div
        className="announcement-bar"
        aria-label="Wellyura"
      >
        <div
          className="announcement-track"
          aria-hidden="true"
        >
          {[0, 1].map((group) => (
            <div
              className="announcement-group"
              key={group}
            >
              {globalBannerItems.map(
                (item, index) => (
                  <span
                    key={`${group}-${index}`}
                  >
                    {item}
                  </span>
                )
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="header-inner shell">
        <BrandMark />

        <nav
          className="desktop-nav"
          aria-label="Primary navigation"
        >
          {siteConfig.nav.map((item) => (
            <Link
              href={item.href}
              key={item.href}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="header-actions">
          {authenticated ? (
            <>
              <span className="header-user-name">
                Welcome, {firstName}
              </span>

              <Link
                className="text-link"
                href="/workspace"
              >
                My plan
              </Link>

              {isAdmin && (
                <Link
                  className="text-link"
                  href="/admin"
                >
                  Admin
                </Link>
              )}

              <button
                className="button button-dark button-small header-signout"
                type="button"
                onClick={handleSignOut}
                disabled={signingOut}
              >
                {signingOut
                  ? "Signing out..."
                  : "Sign out"}
              </button>
            </>
          ) : (
            <>
              <Link
                className="text-link"
                href="/login"
              >
                Sign in
              </Link>

              <Link
                className="button button-dark button-small"
                href="/register"
              >
                Create account
              </Link>
            </>
          )}

          <button
            className="menu-button"
            onClick={() =>
              setOpen((value) => !value)
            }
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            {open ? (
              <X size={22} />
            ) : (
              <Menu size={22} />
            )}
          </button>
        </div>
      </div>

      {open && (
        <div className="mobile-menu">
          <nav aria-label="Mobile navigation">
            {siteConfig.nav.map((item) => (
              <Link
                href={item.href}
                key={item.href}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}

            {authenticated ? (
              <>
                <Link
                  href="/workspace"
                  onClick={() => setOpen(false)}
                >
                  Welcome, {firstName} — My plan
                </Link>

                {isAdmin && (
                  <Link
                    href="/admin"
                    onClick={() =>
                      setOpen(false)
                    }
                  >
                    Admin dashboard
                  </Link>
                )}

                <button
                  type="button"
                  onClick={handleSignOut}
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                >
                  Sign in
                </Link>

                <Link
                  href="/register"
                  onClick={() => setOpen(false)}
                >
                  Create account
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

