"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const sections = [
  { label: "Build your profile", items: [["/profiles", "Career profile"], ["/resumes", "Résumé library"], ["/resumes/studio", "Resume Studio"]] },
  { label: "Discover opportunities", items: [["/jobs", "Smart job search"], ["/companies", "Companies"], ["/company-watches", "Career watches"]] },
  { label: "Prepare applications", items: [["/coach", "Application studio"]] },
  { label: "Apply and track", items: [["/applications", "Application pipeline"], ["/crm", "Recruiter CRM"]] },
  { label: "Interview and follow up", items: [["/interviews", "Interview center"], ["/notifications", "Notifications"]] },
] as const;

const tools = [["/command-center", "Command center"], ["/analytics", "Analytics"], ["/automation", "Automation"]] as const;

function active(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/login" || pathname === "/register") return <main className="auth-content">{children}</main>;

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <Link href="/dashboard" className="sidebar-brand">
          <span className="brand-mark">C</span>
          <span><strong>CareerOS</strong><small>Your career command center</small></span>
        </Link>
        <nav className="sidebar-nav" aria-label="Career journey">
          <Link href="/dashboard" className={`sidebar-dashboard ${active(pathname, "/dashboard") ? "active" : ""}`}>Dashboard</Link>
          <p className="sidebar-kicker">Career journey</p>
          {sections.map((section, index) => (
            <section className="sidebar-step" key={section.label}>
              <div className="sidebar-step-heading"><strong>{index + 1}. {section.label}</strong></div>
              <div className="sidebar-step-links">
                {section.items.map(([href, label]) => <Link key={href} href={href} className={active(pathname, href) ? "active" : ""}>{label}</Link>)}
              </div>
            </section>
          ))}
          <p className="sidebar-kicker">Insights and tools</p>
          <div className="sidebar-step-links">
            {tools.map(([href, label]) => <Link key={href} href={href} className={active(pathname, href) ? "active" : ""}>{label}</Link>)}
          </div>
        </nav>
      </aside>
      <div className="app-workspace">
        <header className="app-header">
          <div><strong>CareerOS</strong><span>Turn your experience into the right next opportunity.</span></div>
          <div className="header-actions"><Link href="/jobs" className="button secondary compact">Search jobs</Link><Link href="/notifications" className="header-link">Notifications</Link></div>
        </header>
        <main className="app-content">{children}</main>
      </div>
    </div>
  );
}
