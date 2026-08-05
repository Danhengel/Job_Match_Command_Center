"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type MouseEvent, type ReactNode } from "react";

const sections = [
  { label: "Build your profile", items: [["/profiles", "Career profile"], ["/resumes", "Résumé library"], ["/resumes/studio", "Resume Studio"]] },
  { label: "Discover opportunities", items: [["/jobs", "Smart job search"], ["/companies", "Companies"], ["/company-watches", "Career watches"]] },
  { label: "Prepare applications", items: [["/coach", "Application studio"], ["/outreach", "Outreach Studio"]] },
  { label: "Apply and track", items: [["/applications", "Application pipeline"], ["/crm", "Recruiter CRM"]] },
  { label: "Interview and follow up", items: [["/interviews", "Interview center"], ["/interview-coach", "AI interview coach"], ["/calendar", "Career calendar"], ["/notifications", "Notifications"]] },
] as const;

const tools = [["/command-center", "Command center"], ["/analytics", "Analytics"], ["/reports/weekly", "Weekly report"], ["/automation", "Automation"], ["/settings/automation", "Automation settings"]] as const;

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

function active(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
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

  if (pathname === "/login" || pathname === "/register") {
    return <main className="auth-content">{children}</main>;
  }

  function closeMenuFromLink(event: MouseEvent<HTMLElement>) {
    if ((event.target as HTMLElement).closest("a")) setMenuOpen(false);
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
          <Link href="/dashboard" className="sidebar-brand">
            <span className="brand-mark">C</span>
            <span><strong>CareerNavIQ</strong><small>Your career command center</small></span>
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
          <Link href="/dashboard" className={`sidebar-dashboard ${active(pathname, "/dashboard") ? "active" : ""}`}>Dashboard</Link>
          <p className="sidebar-kicker">Career journey</p>
          {sections.map((section, index) => (
            <section className="sidebar-step" key={section.label}>
              <div className="sidebar-step-heading"><strong>{index + 1}. {section.label}</strong></div>
              <div className="sidebar-step-links">
                {section.items.map(([href, label]) => (
                  <Link key={href} href={href} className={active(pathname, href) ? "active" : ""}>{label}</Link>
                ))}
              </div>
            </section>
          ))}
          <p className="sidebar-kicker">Insights and tools</p>
          <div className="sidebar-step-links">
            {tools.map(([href, label]) => (
              <Link key={href} href={href} className={active(pathname, href) ? "active" : ""}>{label}</Link>
            ))}
          </div>
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

          <Link href="/dashboard" className="header-brand">
            <span className="header-brand-mark">C</span>
            <span className="header-brand-copy">
              <strong>CareerNavIQ</strong>
              <span>Turn your experience into the right next opportunity.</span>
            </span>
          </Link>

          <div className="header-actions">
            <Link href="/jobs" className="button secondary compact">Search jobs</Link>
            <Link href="/notifications" className="header-link">Alerts</Link>
          </div>
        </header>

        <main className="app-content">{children}</main>
      </div>

      <nav className="mobile-bottom-nav" aria-label="Primary mobile navigation">
        {mobileNavigation.map(([href, icon, label]) => (
          <Link
            key={href}
            href={href}
            className={active(pathname, href) ? "active" : ""}
            aria-current={active(pathname, href) ? "page" : undefined}
          >
            <span className="mobile-nav-icon" aria-hidden="true">{icon}</span>
            <small>{label}</small>
          </Link>
        ))}
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
