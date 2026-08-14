"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MetricStrip, Notice, PageHeader, SectionHeader } from "@/components/ui";
import { api } from "@/lib/api";

type Report = {
  period_start: string; period_end: string; applications_created: number; applications_submitted: number;
  interviews_completed: number; interviews_upcoming: number; recruiter_contacts_updated: number;
  jobs_discovered: number; matches_created: number; high_matches: number; offers_active: number;
  follow_ups_overdue: number; unread_notifications: number; response_rate: number; interview_rate: number;
  stage_counts: Record<string, number>; recommendations: string[];
};

export default function WeeklyReportPage() {
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  async function load() {
    setError("");
    try {
      setReport(await api("/api/automation/weekly-report"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load weekly briefing.");
    }
  }

  useEffect(() => { void load(); }, []);

  function summary() {
    if (!report) return "";
    return `CareerNavIQ Weekly Briefing\n${new Date(report.period_start).toLocaleDateString()}–${new Date(report.period_end).toLocaleDateString()}\n\nApplications submitted: ${report.applications_submitted}\nOpportunities discovered: ${report.jobs_discovered}\nHigh-alignment opportunities: ${report.high_matches}\nRecruiter contacts updated: ${report.recruiter_contacts_updated}\nInterviews completed: ${report.interviews_completed}\nUpcoming interviews: ${report.interviews_upcoming}\nResponse rate: ${report.response_rate}%\nInterview rate: ${report.interview_rate}%\nOverdue follow-ups: ${report.follow_ups_overdue}\n\nRecommended priorities:\n${report.recommendations.map((item, i) => `${i + 1}. ${item}`).join("\n")}`;
  }

  async function copyReport() {
    await navigator.clipboard.writeText(summary());
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  if (error) return <Notice title="Weekly briefing unavailable" tone="error"><p>{error}</p><button onClick={load}>Try again</button></Notice>;
  if (!report) return <section className="executive-loading"><p className="eyebrow">WEEKLY BRIEFING</p><h2>Preparing your seven-day review…</h2></section>;

  const stages = ["wishlist", "applied", "recruiter", "interview", "final", "offer", "accepted"];
  const maxStage = Math.max(1, ...stages.map((stage) => report.stage_counts[stage] || 0));

  return (
    <>
      <PageHeader
        eyebrow="WEEKLY BRIEFING"
        title="A concise review of progress, conversion, and priorities"
        description={`${new Date(report.period_start).toLocaleDateString()} through ${new Date(report.period_end).toLocaleDateString()} · based only on activity recorded in CareerNavIQ.`}
        actions={<div className="row wrap"><button onClick={copyReport}>{copied ? "Copied" : "Copy briefing"}</button><button className="secondary" onClick={load}>Refresh</button></div>}
      />

      <MetricStrip
        ariaLabel="Weekly career briefing summary"
        items={[
          { label: "Applications", value: report.applications_submitted, detail: "submitted this week" },
          { label: "Opportunities discovered", value: report.jobs_discovered, detail: "across market reviews" },
          { label: "High alignment", value: report.high_matches, detail: "70% or stronger" },
          { label: "Relationship activity", value: report.recruiter_contacts_updated, detail: "contacts updated" },
          { label: "Interviews", value: report.interviews_completed, detail: "completed this week" },
          { label: "Offers", value: report.offers_active, detail: "active or accepted" },
        ]}
      />

      <section className="executive-grid">
        <article className="dashboard-panel">
          <SectionHeader eyebrow="CONVERSION" title="Response and interview performance" />
          <div className="metrics-grid"><div className="metric-card"><span>Response rate</span><strong>{report.response_rate}%</strong></div><div className="metric-card"><span>Interview rate</span><strong>{report.interview_rate}%</strong></div><div className="metric-card"><span>Upcoming interviews</span><strong>{report.interviews_upcoming}</strong></div><div className="metric-card"><span>Overdue follow-ups</span><strong>{report.follow_ups_overdue}</strong></div></div>
          <p className="muted">Rates are calculated from applications currently recorded beyond the selected stage.</p>
        </article>
        <article className="priority-card">
          <SectionHeader eyebrow="NEXT-WEEK PRIORITIES" title="Recommended focus" />
          <ol>{report.recommendations.map((item) => <li key={item}>{item}</li>)}</ol>
          <div className="row wrap"><Link className="button" href="/dashboard">Career command center</Link><Link className="button secondary" href="/notifications">Review updates</Link></div>
        </article>
      </section>

      <section className="dashboard-panel">
        <SectionHeader eyebrow="PORTFOLIO SNAPSHOT" title="Current opportunities by stage" actions={<Link href="/applications">Open portfolio →</Link>} />
        <div className="pipeline-list">
          {stages.map((stage) => {
            const count = report.stage_counts[stage] || 0;
            const display = stage === "wishlist" ? "Selected" : stage[0].toUpperCase() + stage.slice(1);
            return <div className="pipeline-row" key={stage}><span>{display}</span><div className="pipeline-track"><div className="pipeline-fill" style={{ width: `${Math.max(count ? 8 : 0, count / maxStage * 100)}%` }} /></div><strong>{count}</strong></div>;
          })}
        </div>
      </section>

      <section className="dashboard-panel">
        <SectionHeader eyebrow="REQUIRES ATTENTION" title="Open actions" />
        <div className="quick-actions-grid">
          <Link className="quick-action" href="/notifications"><strong>{report.unread_notifications} unread updates</strong><span>Review reminders and market changes</span></Link>
          <Link className="quick-action" href="/applications"><strong>{report.follow_ups_overdue} overdue follow-ups</strong><span>Advance active opportunities</span></Link>
          <Link className="quick-action" href="/interviews"><strong>{report.interviews_upcoming} upcoming interviews</strong><span>Confirm preparation and logistics</span></Link>
          <Link className="quick-action" href="/automation"><strong>{report.matches_created} signals added</strong><span>Review scheduled market intelligence</span></Link>
        </div>
      </section>
    </>
  );
}
