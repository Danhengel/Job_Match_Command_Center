"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const journey = [
  {
    label: "1. Build profile",
    description: "Define your goals and experience",
    items: [
      ["/profiles", "Career profile"],
      ["/resumes", "Resume library"],
    ],
  },
  {
    label: "2. Discover jobs",
    description: "Find and review strong matches",
    items: [
      ["/jobs", "Smart search"],
      ["/companies", "Companies"],
      ["/company-watches", "Career watches"],
    ],
  },
  {
    label: "3. Prepare application",
    description: "Tailor materials for each role",
    items: [["/coach", "Application studio"]],
  },
  {
    label: "4. Apply and track",
    description: "Manage every opportunity",
    items: [
      ["/applications", "Applications"],
      ["/crm", "Recruiter CRM"],
    ],
  },
  {
    label: "5. Interview and follow up",
    description: "Prepare and stay on schedule",
    items: [
      ["/interviews", "Interview coach"],
      ["/notifications", "Notifications"],
    ],
  },
] as const;

const tools = [
  ["/command-center", "Command center"],
  ["/analytics", "Analytics"],
  ["/automation", "Automation"],
] as const;

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === "/login" || pathname === "/register";

  if (isAuthPage) return <main className="auth-content">{children}</main>;

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <Link href="/dashboard" className="sidebar-brand" aria-label="CareerOS dashboard">
          <span className="brand-mark">C</span>
          <span>
            <strong>CareerOS</strong>
            <small>Your career command center</small>
          </span>
        </Link>

        <nav className="sidebar-nav" aria-label="Career journey">
          <Link className={`sidebar-dashboard ${isActive(pathname, "/dashboard") ? "active" : ""}`} href="/dashboard">
            Dashboard
          </Link>

          <p className="sidebar-kicker">Career journey</p>
          {journey.map((step) => (
            <section className="sidebar-step" key={step.label}>
              <div className="sidebar-step-heading">
                <strong>{step.label}</strong>
                <small>{step.description}</small>
              </div>
              <div className="sidebar-step-links">
                {step.items.map(([href, label]) => (
                  <Link className={isActive(pathname, href) ? "active" : ""} href={href} key={href}>
                    {label}
                  </Link>
                ))}
              </div>
            </section>
          ))}

          <p className="sidebar-kicker">Insights and tools</p>
          <div className="sidebar-step-links">
            {tools.map(([href, label]) => (
              <Link className={isActive(pathname, href) ? "active" : ""} href={href} key={href}>
                {label}
              </Link>
            ))}
          </div>
        </nav>
      </aside>

      <div className="app-workspace">
        <header className="app-header">
          <div>
            <strong>CareerOS</strong>
            <span>Move from profile to offer with a clear next step.</span>
          </div>
          <div className="header-actions">
            <Link href="/jobs" className="button secondary compact">Search jobs</Link>
            <Link href="/notifications" className="header-link">Notifications</Link>
          </div>
        </header>
        <main className="app-content">{children}</main>
      </div>
    </div>
  );
}
