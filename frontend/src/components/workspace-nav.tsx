"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  BookMarked,
  CalendarDays,
  GitCompareArrows,
  LayoutDashboard,
  Search,
  UserRound,
} from "lucide-react";

const links = [
  ["Overview", "/workspace", LayoutDashboard],
  ["Saved", "/workspace/saved", BookMarked],
  ["Comparisons", "/compare", GitCompareArrows],
  ["Searches", "/workspace/searches", Search],
  ["Deadlines", "/workspace/deadlines", CalendarDays],
  ["Profile", "/workspace/profile", UserRound],
  ["Alerts", "/workspace/alerts", Bell],
] as const;

export function WorkspaceNav() {
  const pathname = usePathname();

  return (
    <aside className="workspace-sidebar">
      <span className="eyebrow eyebrow-light">Student workspace</span>
      <h2>My Wellyura</h2>
      <nav>
        {links.map(([label, href, Icon]) => {
          const active = href === "/workspace"
            ? pathname === href
            : pathname.startsWith(href);

          return (
            <Link className={active ? "active" : undefined} href={href} key={label}>
              <Icon size={17} /> {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}


