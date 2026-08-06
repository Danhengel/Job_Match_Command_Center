"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type MouseEvent, type ReactNode } from "react";

import { BrandCompass } from "@/components/BrandCompass";
import { GuidedJourneyFooter } from "@/components/GuidedJourneyFooter";
import {
  CAREER_STAGES,
  UTILITY_LINKS,
  getActiveJourneyItem,
  getCareerStage,
  getCurrentPageLabel,
  isActivePath,
} from "@/lib/careerJourney";
import { endAuthenticatedSession } from "@/lib/sessionStorage";

const mobileNavigation = [
  ["/dashboard", "⌂", "Office"],
  ["/jobs", "◇", "Intelligence"],
  ["/applications", "▤", "Portfolio"],
  ["/interviews", "◎", "Briefings"],
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

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const currentStage = getCareerStage(pathname);
  const currentPageLabel = getCurrentPageLabel(pathname);
  const activeUtilityItem = getActiveJourneyItem(pathname, UTILITY_LINKS);

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

  function signOut() {
    setMenuOpen(false);
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
          <Link
            href="/dashboard"
            className="sidebar-brand"
            aria-label="CareerNavIQ dashboard"
          >
            <span className="brand-mark"><BrandCompass /></span>
            <span>
              <strong>CareerNavIQ</strong>
              <small>Private career intelligence</small>
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

        <nav className="sidebar-nav" aria-label="Career workflow">
          <Link
            href="/dashboard"
            className={`sidebar-dashboard ${isActivePath(pathname, "/dashboard") ? "active" : ""}`}
            aria-current={isActivePath(pathname, "/dashboard") ? "page" : undefined}
          >
            <span className="sidebar-dashboard-icon" aria-hidden="true">⌂</span>
            <span>
              <strong>Private office</strong>
              <small>Your daily executive brief</small>
            </span>
          </Link>

          <div className="sidebar-section-heading">
            <span>Advisory path</span>
            <small>5 disciplines</small>
          </div>

          <div className="sidebar-stage-list">
            {CAREER_STAGES.map((stage) => {
              const stageActive = currentStage?.id === stage.id;
              const activeStageItem = getActiveJourneyItem(
                pathname,
                stage.items,
              );

              return (
                <section
                  className={`sidebar-stage ${stageActive ? "active" : ""}`}
                  key={stage.id}
                >
                  <Link
                    href={stage.href}
                    className="sidebar-stage-summary"
                    aria-current={stageActive ? "step" : undefined}
                  >
                    <span className="sidebar-stage-number">{stage.number}</span>
                    <span className="sidebar-stage-copy">
                      <strong>{stage.shortLabel}</strong>
                      <small>{stage.description}</small>
                    </span>
                    <span className="sidebar-stage-arrow" aria-hidden="true">›</span>
                  </Link>

                  <div className="sidebar-stage-links">
                    {stage.items.map((item) => {
                      const itemActive = activeStageItem?.href === item.href;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={itemActive ? "active" : ""}
                          aria-current={itemActive ? "page" : undefined}
                        >
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>

          <div className="sidebar-section-heading sidebar-tools-heading">
            <span>Private office</span>
          </div>
          <div className="sidebar-utility-links">
            {UTILITY_LINKS.map((item) => {
              const itemActive = activeUtilityItem?.href === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={itemActive ? "active" : ""}
                  aria-current={itemActive ? "page" : undefined}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          <button
            type="button"
            className="sidebar-signout"
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

          <Link
            href="/dashboard"
            className="header-brand"
            aria-label="CareerNavIQ dashboard"
          >
            <span className="header-brand-mark"><BrandCompass /></span>
            <span className="header-brand-copy">
              <strong>{currentPageLabel}</strong>
              <span>
                {currentStage?.description
                  ?? "Intelligence, priorities, and next decisions"}
              </span>
            </span>
          </Link>

          <div className="header-actions">
            <Link href="/jobs" className="button compact">Explore intelligence</Link>
            <Link href="/notifications" className="header-link">Briefings</Link>
            <button
              type="button"
              className="button secondary compact header-signout"
              onClick={signOut}
            >
              Sign out
            </button>
          </div>
        </header>

        <main className="app-content">
          {children}
          <GuidedJourneyFooter pathname={pathname} />
        </main>
      </div>

      <nav className="mobile-bottom-nav" aria-label="Primary mobile navigation">
        {mobileNavigation.map(([href, icon, label]) => {
          const itemActive = isActivePath(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              className={itemActive ? "active" : ""}
              aria-current={itemActive ? "page" : undefined}
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
