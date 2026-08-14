"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type MouseEvent, type ReactNode } from "react";

import { BrandCompass } from "@/components/BrandCompass";
import { GuidedJourneyFooter } from "@/components/GuidedJourneyFooter";
import {
  PRIMARY_NAV,
  SECONDARY_NAV,
  isActivePath,
} from "@/lib/careerJourney";
import { endAuthenticatedSession } from "@/lib/sessionStorage";

const mobileNavigation = [
  ["/dashboard", "⌂", "Home"],
  ["/jobs", "⌕", "Jobs"],
  ["/applications", "✓", "Applications"],
  ["/resumes", "▤", "Resume"],
] as const;

const primaryDescriptions: Record<string, string> = {
  "/dashboard": "What needs your attention now",
  "/jobs": "Find and compare matching roles",
  "/applications": "Track progress and next actions",
  "/resumes": "Manage and tailor your resume",
  "/profiles": "Goals, preferences, and experience",
};

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

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const toolsActive = pathname === "/tools" || SECONDARY_NAV.some((item) => isActivePath(pathname, item.href));

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

  if (pathname === "/" || publicPaths.has(pathname)) return <>{children}</>;
  if (pathname === "/login" || pathname === "/register") return <main className="auth-content">{children}</main>;

  function closeMenuFromLink(event: MouseEvent<HTMLElement>) {
    if ((event.target as HTMLElement).closest("a")) setMenuOpen(false);
  }

  function signOut() {
    setMenuOpen(false);
    endAuthenticatedSession();
    window.location.replace("/login");
  }

  return (
    <div className="app-shell executive-platform">
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
          <Link href="/dashboard" className="sidebar-brand" aria-label="CareerNavIQ home">
            <span className="brand-mark"><BrandCompass /></span>
            <span>
              <strong>CareerNavIQ</strong>
              <small>Career intelligence</small>
            </span>
          </Link>
          <button type="button" className="sidebar-close" aria-label="Close navigation" onClick={() => setMenuOpen(false)}>×</button>
        </div>

        <nav className="sidebar-nav sidebar-nav-refined" aria-label="CareerNavIQ navigation">
          <div className="sidebar-stage-list">
            {PRIMARY_NAV.map((item) => {
              const itemActive = isActivePath(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`sidebar-dashboard ${itemActive ? "active" : ""}`}
                  aria-current={itemActive ? "page" : undefined}
                >
                  <span>
                    <strong>{item.label}</strong>
                    <small>{primaryDescriptions[item.href]}</small>
                  </span>
                </Link>
              );
            })}
          </div>

          <div className="sidebar-tools-entry">
            <Link
              href="/tools"
              className={`sidebar-dashboard ${toolsActive ? "active" : ""}`}
              aria-current={pathname === "/tools" ? "page" : undefined}
            >
              <span>
                <strong>Tools</strong>
                <small>Planning, preparation & insights</small>
              </span>
            </Link>
          </div>

          <div className="sidebar-utility-links sidebar-bottom-links">
            <Link href="/notifications" className={isActivePath(pathname, "/notifications") ? "active" : ""}>Notifications</Link>
            <Link href="/settings/automation" className={isActivePath(pathname, "/settings/automation") ? "active" : ""}>Settings</Link>
          </div>

          <button type="button" className="sidebar-signout" onClick={signOut}>Sign out</button>
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

          <nav className="header-actions header-utilities" aria-label="Page utilities">
            <Link href="/contact" className="header-link">Help</Link>
            <Link href="/jobs" className="header-link">Search</Link>
            <Link href="/notifications" className="header-link">Notifications</Link>
          </nav>
        </header>

        <main className="app-content">
          <div className="executive-page-frame">
            {children}
            <GuidedJourneyFooter pathname={pathname} />
          </div>
        </main>
      </div>

      <nav className="mobile-bottom-nav" aria-label="Primary mobile navigation">
        {mobileNavigation.map(([href, icon, label]) => {
          const itemActive = isActivePath(pathname, href);
          return (
            <Link key={href} href={href} className={itemActive ? "active" : ""} aria-current={itemActive ? "page" : undefined}>
              <span className="mobile-nav-icon" aria-hidden="true">{icon}</span>
              <small>{label}</small>
            </Link>
          );
        })}
        <button type="button" className={menuOpen ? "active" : ""} aria-label="Open all navigation" aria-controls="app-navigation" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}>
          <span className="mobile-nav-icon" aria-hidden="true">•••</span>
          <small>More</small>
        </button>
      </nav>
    </div>
  );
}
