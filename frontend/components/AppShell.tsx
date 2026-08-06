"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type MouseEvent, type ReactNode } from "react";
import { BrandCompass } from "@/components/BrandCompass";
import { GuidedJourneyFooter } from "@/components/GuidedJourneyFooter";
import { api } from "@/lib/api";
import { endAuthenticatedSession } from "@/lib/sessionStorage";

const sections = [
  {
    label: "Build your profile",
    items: [
      ["/profiles", "Career profile"],
      ["/resumes", "Résumé library"],
      ["/resumes/studio", "Resume Studio"],
    ],
  },
  {
    label: "Discover opportunities",
    items: [
      ["/jobs", "Smart job search"],
      ["/companies", "Companies"],
      ["/company-watches", "Career watches"],
    ],
  },
  {
    label: "Prepare applications",
    items: [
      ["/coach", "Application studio"],
      ["/outreach", "Outreach Studio"],
    ],
  },
  {
    label: "Apply and track",
    items: [
      ["/applications", "Application pipeline"],
      ["/crm", "Recruiter CRM"],
    ],
  },
  {
    label: "Interview and follow up",
    items: [
      ["/interviews", "Interview center"],
      ["/interview-coach", "AI interview coach"],
      ["/calendar", "Career calendar"],
      ["/notifications", "Notifications"],
    ],
  },
] as const;

const tools = [
  ["/command-center", "Command center"],
  ["/analytics", "Analytics"],
  ["/reports/weekly", "Weekly report"],
  ["/automation", "Automation"],
  ["/settings/automation", "Automation settings"],
  ["/account", "Account settings"],
] as const;

const mobileNavigation = [
  ["/dashboard", "⌂", "Home"],
  ["/jobs", "⌕", "Jobs"],
  ["/applications", "✓", "Track"],
  ["/interviews", "◎", "Prepare"],
] as const;

const publicPaths = new Set([
  "/features",
  "/about",
  "/pricing",
  "/contact",
  "/privacy",
  "/terms",
  "/ai-job-search",
  "/job-application-tracker",
  "/resume-optimizer",
  "/interview-preparation",
]);

const authenticationPaths = new Set([
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
]);

function active(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function initials(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "CN";
}

type CurrentUser = { id: number; email: string; full_name: string };

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
    setMenuOpen(false);
    setAccountMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (pathname === "/" || publicPaths.has(pathname) || authenticationPaths.has(pathname)) return;
    let mounted = true;
    api("/api/auth/me")
      .then((user: CurrentUser) => {
        if (mounted) setCurrentUser(user);
      })
      .catch(() => undefined);
    return () => { mounted = false; };
  }, [pathname]);

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
        setAccountMenuOpen(false);
      }
    }

    document.body.classList.toggle("mobile-menu-open", menuOpen);
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.classList.remove("mobile-menu-open");
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [menuOpen]);

  if (pathname === "/" || publicPaths.has(pathname)) {
    return <>{children}</>;
  }

  if (authenticationPaths.has(pathname)) {
    return <main className="auth-content">{children}</main>;
  }

  function closeMenuFromLink(event: MouseEvent<HTMLElement>) {
    if ((event.target as HTMLElement).closest("a")) setMenuOpen(false);
  }

  function signOut() {
    setMenuOpen(false);
    setAccountMenuOpen(false);
    endAuthenticatedSession();
    window.location.replace("/login");
  }

  return (
    <div className="app-shell">
      <button
        type="button"
        className={`mobile-nav-overlay ${menuOpen ? "visible" : ""}`}
        aria-label="Close navigation"
        tabIndex={menuOpen ? 0 : -1}
        onClick={() => setMenuOpen(false)}
      />

      <aside
        id="app-navigation"
        className={`app-sidebar ${menuOpen ? "open" : ""}`}
        onClick={closeMenuFromLink}
      >
        <div className="sidebar-brand-row">
          <Link href="/dashboard" className="sidebar-brand" aria-label="CareerNavIQ dashboard">
            <span className="brand-mark"><BrandCompass /></span>
            <span>
              <strong>CareerNavIQ</strong>
              <small>AI career operating system</small>
            </span>
          </Link>
          <button
            type="button"
            className="sidebar-close"
            aria-label="Close navigation"
            onClick={() => setMenuOpen(false)}
          >
            ×
          </button>
        </div>

        <nav className="sidebar-nav" aria-label="Career journey">
          <Link
            href="/dashboard"
            className={`sidebar-dashboard ${active(pathname, "/dashboard") ? "active" : ""}`}
            aria-current={active(pathname, "/dashboard") ? "page" : undefined}
          >
            Dashboard
          </Link>

          <p className="sidebar-kicker">Career journey</p>
          {sections.map((section, index) => (
            <section className="sidebar-step" key={section.label}>
              <div className="sidebar-step-heading">
                <strong>{index + 1}. {section.label}</strong>
              </div>
              <div className="sidebar-step-links">
                {section.items.map(([href, label]) => {
                  const isActive = active(pathname, href);
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={isActive ? "active" : ""}
                      aria-current={isActive ? "page" : undefined}
                    >
                      {label}
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}

          <p className="sidebar-kicker">Insights and tools</p>
          <div className="sidebar-step-links">
            {tools.map(([href, label]) => {
              const isActive = active(pathname, href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={isActive ? "active" : ""}
                  aria-current={isActive ? "page" : undefined}
                >
                  {label}
                </Link>
              );
            })}
          </div>

          <button
            type="button"
            className="button secondary compact"
            style={{ width: "100%", marginTop: 18 }}
            onClick={signOut}
          >
            Sign out
          </button>
        </nav>
      </aside>

      <div className="app-workspace">
        <header className="app-header">
          <button
            type="button"
            className="mobile-menu-button"
            aria-label="Open navigation"
            aria-controls="app-navigation"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(true)}
          >
            <span aria-hidden="true">☰</span>
          </button>

          <Link href="/dashboard" className="header-brand" aria-label="CareerNavIQ dashboard">
            <span className="header-brand-mark"><BrandCompass /></span>
            <span className="header-brand-copy">
              <strong>CareerNavIQ</strong>
              <span>Navigate your next career move with clarity.</span>
            </span>
          </Link>

          <div className="header-actions">
            <Link href="/jobs" className="button secondary compact">Search jobs</Link>
            <Link href="/notifications" className="header-link">Alerts</Link>
            <div className="header-account">
              <button
                type="button"
                className="header-account-button"
                aria-haspopup="menu"
                aria-expanded={accountMenuOpen}
                onClick={() => setAccountMenuOpen((open) => !open)}
              >
                <span className="header-account-avatar">{initials(currentUser?.full_name || "CareerNavIQ")}</span>
                <span>{currentUser?.full_name?.split(" ")[0] || "Account"}</span>
                <span aria-hidden="true">⌄</span>
              </button>
              {accountMenuOpen ? (
                <div className="header-account-menu" role="menu">
                  <div className="header-account-summary">
                    <strong>{currentUser?.full_name || "CareerNavIQ account"}</strong>
                    <span>{currentUser?.email || "Loading account…"}</span>
                  </div>
                  <Link href="/account" role="menuitem">Account settings</Link>
                  <Link href="/profiles" role="menuitem">Career profiles</Link>
                  <Link href="/resumes" role="menuitem">Résumé library</Link>
                  <Link href="/notifications" role="menuitem">Notifications</Link>
                  <button type="button" role="menuitem" onClick={signOut}>Sign out</button>
                </div>
              ) : null}
            </div>
          </div>
        </header>

        <main className="app-content">
          {children}
          <GuidedJourneyFooter pathname={pathname} />
        </main>
      </div>

      <nav className="mobile-bottom-nav" aria-label="Primary mobile navigation">
        {mobileNavigation.map(([href, icon, label]) => {
          const isActive = active(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              className={isActive ? "active" : ""}
              aria-current={isActive ? "page" : undefined}
            >
              <span className="mobile-nav-icon" aria-hidden="true">{icon}</span>
              <small>{label}</small>
            </Link>
          );
        })}
        <button
          type="button"
          className={menuOpen ? "active" : ""}
          aria-label="Open all navigation"
          aria-controls="app-navigation"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(true)}
        >
          <span className="mobile-nav-icon" aria-hidden="true">☰</span>
          <small>More</small>
        </button>
      </nav>
    </div>
  );
}
