import "./globals.css";
import Link from "next/link";

export const metadata = { title: "Job Match Command Center" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>
    <nav className="nav">
      <Link href="/dashboard" className="brand">🎯 Job Match Command Center</Link>
      <div className="navlinks">
        <Link href="/command-center">Command Center</Link>
        <Link href="/dashboard">Dashboard</Link>
        <Link href="/profiles">Profiles</Link>
        <Link href="/jobs">Job Matches</Link>
        <Link href="/applications">Applications</Link>
        <Link href="/resumes">Tailoring Studio</Link>
        <Link href="/companies">Companies</Link>
        <Link href="/company-watches">Career Watches</Link>
        <Link href="/coach">Career Coach</Link>
        <Link href="/analytics">Analytics</Link>
        <Link href="/automation">Automation</Link>
        <Link href="/notifications">Notifications</Link>
        <Link href="/crm">Recruiter CRM</Link>
        <Link href="/interviews">Interview Calendar</Link>
      </div>
    </nav>
    <main className="wrap">{children}</main>
  </body></html>;
}
