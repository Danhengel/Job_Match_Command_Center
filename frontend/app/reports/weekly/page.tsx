"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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
    try { setReport(await api("/api/automation/weekly-report")); }
    catch (e) { setError(e instanceof Error ? e.message : "Unable to load weekly report."); }
  }
  useEffect(() => { load(); }, []);

  function summary() {
    if (!report) return "";
    return `CareerNavIQ Weekly Executive Report\n${new Date(report.period_start).toLocaleDateString()}–${new Date(report.period_end).toLocaleDateString()}\n\nApplications submitted: ${report.applications_submitted}\nOpportunities discovered: ${report.jobs_discovered}\nHigh-alignment opportunities: ${report.high_matches}\nRecruiter contacts updated: ${report.recruiter_contacts_updated}\nInterviews completed: ${report.interviews_completed}\nUpcoming interviews: ${report.interviews_upcoming}\nResponse rate: ${report.response_rate}%\nInterview rate: ${report.interview_rate}%\nOverdue follow-ups: ${report.follow_ups_overdue}\n\nNext priorities:\n${report.recommendations.map((item, i) => `${i + 1}. ${item}`).join("\n")}`;
  }

  async function copyReport() {
    await navigator.clipboard.writeText(summary()); setCopied(true); setTimeout(() => setCopied(false), 1800);
  }

  if (error) return <section className="dashboard-panel"><h1>Weekly report unavailable</h1><p className="error">{error}</p><button onClick={load}>Try again</button></section>;
  if (!report) return <section className="dashboard-panel"><p className="eyebrow">WEEKLY EXECUTIVE REPORT</p><h2>Building your seven-day summary…</h2></section>;

  const stages = ["wishlist", "applied", "recruiter", "interview", "final", "offer", "accepted"];
  const maxStage = Math.max(1, ...stages.map((stage) => report.stage_counts[stage] || 0));

  return <>
    <section className="executive-hero">
      <div><p className="eyebrow">WEEKLY EXECUTIVE REPORT</p><h1>Your career portfolio, week by week.</h1><p className="muted">{new Date(report.period_start).toLocaleDateString()} through {new Date(report.period_end).toLocaleDateString()} · based only on recorded CareerNavIQ activity.</p></div>
      <div className="executive-actions"><button onClick={copyReport}>{copied ? "Copied" : "Copy report"}</button><button className="secondary" onClick={load}>Refresh</button></div>
    </section>

    <section className="executive-kpis">
      <article className="executive-kpi"><span>Applications</span><strong>{report.applications_submitted}</strong><small>submitted this week</small></article>
      <article className="executive-kpi"><span>Opportunities discovered</span><strong>{report.jobs_discovered}</strong><small>across direct and standing reviews</small></article>
      <article className="executive-kpi"><span>High alignment</span><strong>{report.high_matches}</strong><small>70% or stronger</small></article>
      <article className="executive-kpi"><span>Recruiter activity</span><strong>{report.recruiter_contacts_updated}</strong><small>contacts updated</small></article>
      <article className="executive-kpi"><span>Interviews</span><strong>{report.interviews_completed}</strong><small>completed this week</small></article>
      <article className="executive-kpi"><span>Offers</span><strong>{report.offers_active}</strong><small>active or accepted</small></article>
    </section>

    <section className="executive-grid">
      <article className="dashboard-panel"><p className="eyebrow">CONVERSION</p><h2>Response and interview performance</h2><div className="metrics-grid"><div className="metric-card"><span>Response rate</span><strong>{report.response_rate}%</strong></div><div className="metric-card"><span>Interview rate</span><strong>{report.interview_rate}%</strong></div><div className="metric-card"><span>Upcoming interviews</span><strong>{report.interviews_upcoming}</strong></div><div className="metric-card"><span>Overdue follow-ups</span><strong>{report.follow_ups_overdue}</strong></div></div><p className="muted">Rates are calculated from applications currently recorded beyond the wishlist stage.</p></article>
      <article className="priority-card"><p className="eyebrow">NEXT-WEEK PRIORITIES</p><h2>Recommended focus</h2><ol>{report.recommendations.map((item) => <li key={item}>{item}</li>)}</ol><div className="row wrap"><Link className="button" href="/dashboard">Open command center</Link><Link className="button secondary" href="/notifications">Review alerts</Link></div></article>
    </section>

    <section className="dashboard-panel"><div className="row between"><div><p className="eyebrow">PIPELINE SNAPSHOT</p><h2>Current applications by stage</h2></div><Link href="/applications">Manage pipeline →</Link></div><div className="pipeline-list">{stages.map((stage) => { const count = report.stage_counts[stage] || 0; return <div className="pipeline-row" key={stage}><span>{stage[0].toUpperCase() + stage.slice(1)}</span><div className="pipeline-track"><div className="pipeline-fill" style={{ width: `${Math.max(count ? 8 : 0, count / maxStage * 100)}%` }} /></div><strong>{count}</strong></div>; })}</div></section>

    <section className="dashboard-panel"><p className="eyebrow">ACTIVITY CHECK</p><h2>Work still requiring attention</h2><div className="quick-actions-grid"><Link className="quick-action" href="/notifications"><strong>{report.unread_notifications} unread alerts</strong><span>Review reminders and briefing updates</span></Link><Link className="quick-action" href="/applications"><strong>{report.follow_ups_overdue} overdue follow-ups</strong><span>Move active opportunities forward</span></Link><Link className="quick-action" href="/interviews"><strong>{report.interviews_upcoming} upcoming interviews</strong><span>Confirm preparation and logistics</span></Link><Link className="quick-action" href="/automation"><strong>{report.matches_created} signals added</strong><span>Review and manage standing briefs</span></Link></div></section>
  </>;
}
