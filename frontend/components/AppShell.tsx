"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState, type MouseEvent, type ReactNode } from "react";

import { BrandCompass } from "@/components/BrandCompass";
import { GuidedJourneyFooter } from "@/components/GuidedJourneyFooter";
import {
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

const sidebarSections = [
  {
    label: "Workspace",
    items: [
      { href: "/dashboard", label: "Home", icon: "⌂" },
      { href: "/jobs", label: "Jobs", icon: "⌕" },
      { href: "/applications", label: "Applications", icon: "✓" },
    ],
  },
  {
    label: "Career tools",
    items: [
      { href: "/profiles", label: "Profile", icon: "○" },
      { href: "/resumes", label: "Resume", icon: "▤" },
      { href: "/companies", label: "Companies", icon: "◇" },
      { href: "/crm", label: "Contacts", icon: "◎" },
      { href: "/interviews", label: "Interviews", icon: "◷" },
    ],
  },
  {
    label: "Insights",
    items: [
      { href: "/analytics", label: "Analytics", icon: "↗" },
      { href: "/reports/weekly", label: "Weekly report", icon: "≡" },
      { href: "/automation", label: "Automation", icon: "⚙" },
    ],
  },
];

const sidebarLinks = sidebarSections.flatMap((section) => section.items);

const headerActions: Array<{ match: string; href: string; label: string }> = [
  { match: "/jobs", href: "/jobs", label: "Run job search" },
  { match: "/applications", href: "/applications", label: "Review pipeline" },
  { match: "/resumes", href: "/resumes/studio", label: "Tailor résumé" },
  { match: "/profiles", href: "/profiles/new", label: "Create profile" },
  { match: "/interviews", href: "/interviews", label: "Plan interview" },
  { match: "/interview-coach", href: "/interview-coach", label: "Start practice" },
  { match: "/companies", href: "/companies", label: "Review companies" },
  { match: "/crm", href: "/crm", label: "Manage contacts" },
  { match: "/calendar", href: "/calendar", label: "Open calendar" },
  { match: "/dashboard", href: "/jobs", label: "Explore opportunities" },
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
  const [headerAccountOpen, setHeaderAccountOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState("");
  const currentStage = getCareerStage(pathname);
  const currentPageLabel = getCurrentPageLabel(pathname);
  const headerAction = headerActions.find((action) => isActivePath(pathname, action.match)) ?? { href: "/dashboard", label: "Home" };
  const commandLinks = useMemo(() => {
    const all = [
      { href: "/dashboard", label: "Home" },
      ...sidebarLinks,
      { href: "/calendar", label: "Calendar" },
      { href: "/notifications", label: "Notifications" },
      { href: "/settings/automation", label: "Settings" },
    ];
    return [...new Map(all.map((item) => [item.href, item])).values()].filter((item) =>
      item.label.toLowerCase().includes(commandQuery.trim().toLowerCase()),
    );
  }, [commandQuery]);

  useEffect(() => {
    setMenuOpen(false);
    setHeaderAccountOpen(false);
    setCommandOpen(false);
    setCommandQuery("");
  }, [pathname]);

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
        setHeaderAccountOpen(false);
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
          <div className="sidebar-primary-navigation">
            {sidebarSections.map((section) => (
              <section className="sidebar-nav-section" key={section.label} aria-labelledby={`nav-${section.label.toLowerCase().replaceAll(" ", "-")}`}>
                <h2 id={`nav-${section.label.toLowerCase().replaceAll(" ", "-")}`}>{section.label}</h2>
                <div>
                  {section.items.map((item) => {
                    const itemActive = isActivePath(pathname, item.href);
                    return (
                      <Link key={item.href} href={item.href} className={itemActive ? "active" : ""} aria-current={itemActive ? "page" : undefined}>
                        <span className="sidebar-nav-icon" aria-hidden="true">{item.icon}</span>
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
          <Link href="/settings/automation" className={`sidebar-settings-link ${isActivePath(pathname, "/settings") ? "active" : ""}`} aria-current={isActivePath(pathname, "/settings") ? "page" : undefined}>
            <span className="sidebar-nav-icon" aria-hidden="true">⚙</span><span>Settings</span>
          </Link>
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
            <span className="header-brand-copy">
              <span>{currentStage?.shortLabel ?? "Workspace"}</span>
              <strong>{currentPageLabel}</strong>
            </span>
          </Link>

          <button type="button" className="header-command" onClick={() => setCommandOpen(true)}>
            <span aria-hidden="true">⌕</span>
            <span>Search or ask CareerNavIQ</span>
            <kbd>⌘K</kbd>
          </button>

          <div className="header-actions">
            <Link href={headerAction.href} className="button compact header-primary-action">{headerAction.label}</Link>
            <Link href="/notifications" className="header-attention"><span aria-hidden="true">◆</span><span>Attention</span></Link>
            <div className="header-account">
              <button type="button" className="header-account-trigger" onClick={() => setHeaderAccountOpen((value) => !value)} aria-expanded={headerAccountOpen} aria-label="Open account menu">DH</button>
              {headerAccountOpen ? <div className="header-account-menu"><Link href="/profiles">Profile</Link><Link href="/settings/automation">Settings</Link><Link href="/automation">Automation</Link><button type="button" onClick={signOut}>Sign out</button></div> : null}
            </div>
          </div>
        </header>

        <main className="app-content">
          <div className="executive-page-frame">
            {children}
            <GuidedJourneyFooter pathname={pathname} />
          </div>
          <footer className="app-footer">
            <span>© {new Date().getFullYear()} CareerNavIQ</span>
            <nav aria-label="Product and legal links">
              <Link href="/features">Features</Link>
              <Link href="/contact">Support</Link>
              <Link href="/privacy">Privacy</Link>
              <Link href="/terms">Terms</Link>
            </nav>
          </footer>
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
