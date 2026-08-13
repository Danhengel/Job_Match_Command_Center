"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState, type MouseEvent, type ReactNode } from "react";

import { BrandCompass } from "@/components/BrandCompass";
import { GuidedJourneyFooter } from "@/components/GuidedJourneyFooter";
import {
  CAREER_STAGES,
  UTILITY_LINKS,
  getCareerStage,
  getCurrentPageLabel,
  isActivePath,
} from "@/lib/careerJourney";
import { endAuthenticatedSession } from "@/lib/sessionStorage";

const mobileNavigation = [
  ["/dashboard", "⌂", "Home"],
  ["/jobs", "⌕", "Jobs"],
  ["/applications", "✓", "Applications"],
  ["/resumes", "▤", "Resume"],
] as const;

const toolLinks = [
  { href: "/crm", label: "Contacts" },
  { href: "/calendar", label: "Calendar" },
  { href: "/analytics", label: "Analytics" },
  { href: "/reports/weekly", label: "Weekly Report" },
  { href: "/automation", label: "Automation" },
  { href: "/notifications", label: "Notifications" },
];

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
  const [toolsOpen, setToolsOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState("");
  const currentStage = getCareerStage(pathname);
  const currentPageLabel = getCurrentPageLabel(pathname);
  const commandLinks = useMemo(() => {
    const all = [
      { href: "/dashboard", label: "Home" },
      ...CAREER_STAGES.flatMap((stage) => stage.items),
      ...toolLinks,
      ...UTILITY_LINKS,
    ];
    return [...new Map(all.map((item) => [item.href, item])).values()].filter((item) =>
      item.label.toLowerCase().includes(commandQuery.trim().toLowerCase()),
    );
  }, [commandQuery]);

  useEffect(() => {
    setMenuOpen(false);
    setToolsOpen(false);
    setAccountOpen(false);
    setCommandOpen(false);
    setCommandQuery("");
  }, [pathname]);

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
        setToolsOpen(false);
        setAccountOpen(false);
        setCommandOpen(false);
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen(true);
      }
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

        <nav className="sidebar-nav" aria-label="CareerNavIQ navigation">
          <Link href="/dashboard" className={`sidebar-home-link ${isActivePath(pathname, "/dashboard") ? "active" : ""}`}>Career overview</Link>

          <div className="sidebar-stage-list">
            {CAREER_STAGES.map((stage) => {
              const stageActive = stage.items.some((item) => isActivePath(pathname, item.href));
              return (
                <details className={`sidebar-stage ${stageActive ? "active" : ""}`} key={`${stage.id}-${pathname}`} open={stageActive || undefined}>
                  <summary className="sidebar-stage-summary">
                    <span><strong>{stage.shortLabel}</strong><small>{stage.description}</small></span>
                  </summary>
                  <div className="sidebar-stage-links">
                    {stage.items.map((item) => {
                      const itemActive = isActivePath(pathname, item.href);
                      return <Link key={item.href} href={item.href} className={itemActive ? "active" : ""} aria-current={itemActive ? "page" : undefined}>{item.label}</Link>;
                    })}
                  </div>
                </details>
              );
            })}
          </div>

          <div className="sidebar-utility-actions">
            <button type="button" className="sidebar-tools-trigger" onClick={() => setToolsOpen((value) => !value)} aria-expanded={toolsOpen}>
              <span>Tools</span><small>{toolsOpen ? "Close" : "Open"}</small>
            </button>
            <button type="button" className="sidebar-command-trigger" onClick={() => setCommandOpen(true)}>
              <span>Search & commands</span><kbd>⌘K</kbd>
            </button>
          </div>

          <div className={`sidebar-tools-drawer ${toolsOpen ? "open" : ""}`} aria-hidden={!toolsOpen}>
            <div className="sidebar-tools-drawer-head"><strong>Tools</strong><button type="button" onClick={() => setToolsOpen(false)} aria-label="Close tools">×</button></div>
            <div className="sidebar-utility-links">
            {toolLinks.map((item) => {
              const itemActive = isActivePath(pathname, item.href);
              return <Link key={item.href} href={item.href} className={itemActive ? "active" : ""} aria-current={itemActive ? "page" : undefined}>{item.label}</Link>;
            })}
            </div>
          </div>

          <div className="sidebar-account">
            <button type="button" className="sidebar-account-trigger" onClick={() => setAccountOpen((value) => !value)} aria-expanded={accountOpen}>Account <span>•••</span></button>
            {accountOpen ? <div className="sidebar-account-menu"><Link href="/settings/automation">Settings</Link><button type="button" onClick={signOut}>Sign out</button></div> : null}
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

          <Link href="/dashboard" className="header-brand" aria-label="CareerNavIQ home">
            <span className="header-brand-mark"><BrandCompass /></span>
            <span className="header-brand-copy">
              <strong>{currentPageLabel}</strong>
              <span>{currentStage?.description ?? "Your career search, progress, and next steps"}</span>
            </span>
          </Link>

          <div className="header-actions">
            <Link href="/jobs" className="button compact">Find Jobs</Link>
            <Link href="/notifications" className="header-link">Notifications</Link>
            <button type="button" className="button secondary compact header-signout" onClick={signOut}>Sign out</button>
          </div>
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

      {commandOpen ? (
        <div className="command-palette-backdrop" role="presentation" onMouseDown={() => setCommandOpen(false)}>
          <section className="command-palette" role="dialog" aria-modal="true" aria-label="Search CareerNavIQ" onMouseDown={(event) => event.stopPropagation()}>
            <div className="command-palette-input-row">
              <span aria-hidden="true">⌕</span>
              <input autoFocus value={commandQuery} onChange={(event) => setCommandQuery(event.target.value)} placeholder="Search pages and tools" aria-label="Search pages and tools" />
              <button type="button" onClick={() => setCommandOpen(false)} aria-label="Close command palette">×</button>
            </div>
            <div className="command-palette-results">
              {commandLinks.length ? commandLinks.map((item) => <Link key={item.href} href={item.href}><span>{item.label}</span><small>{item.href}</small></Link>) : <p>No matching destination</p>}
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
