import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "Job Match Command Center",
  description: "Executive career search, tailoring, application tracking, and interview preparation.",
};

const NAV_ITEMS = [
  ["/dashboard", "Dashboard"],
  ["/command-center", "Command Center"],
  ["/jobs", "Job Matches"],
  ["/applications", "Applications"],
  ["/resumes", "Resume Studio"],
  ["/profiles", "Profiles"],
  ["/companies", "Companies"],
  ["/company-watches", "Career Watches"],
  ["/interviews", "Interview Center"],
  ["/crm", "Recruiter CRM"],
  ["/notifications", "Notifications"],
  ["/analytics", "Analytics"],
  ["/automation", "Automation"],
  ["/coach", "Career Coach"],
] as const;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <nav className="nav" aria-label="Primary navigation">
          <Link href="/dashboard" className="brand">🎯 <span>Job Match Command Center</span></Link>
          <div className="navlinks">
            {NAV_ITEMS.map(([href, label]) => <Link key={href} href={href}>{label}</Link>)}
          </div>
        </nav>
        <main className="wrap">{children}</main>
      </body>
    </html>
  );
}
