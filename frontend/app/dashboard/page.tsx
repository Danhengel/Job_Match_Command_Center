"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";

type Activity = { label: string; detail?: string; created_at?: string };
type DashboardData = {
  user_name?: string;
  average_completeness?: number;
  profile_count?: number;
  resume_count?: number;
  ready_profiles?: number;
  high_match_count?: number;
  active_applications?: number;
  application_count?: number;
  interviews?: number;
  interview_count?: number;
  offers?: number;
  offer_count?: number;
  followups_due?: number;
  stage_counts?: Record<string, number>;
  status_counts?: Record<string, number>;
  recent_activity?: Activity[];
};

type DigestData = { unread_count?: number; high_matches?: number; saved_search_updates?: number; follow_ups_due?: number };

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [digest, setDigest] = useState<DigestData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const dashboard = await api("/api/dashboard");
        if (!active) return;
        setData(dashboard);
        try { setDigest(await api("/api/automation/digest")); } catch { setDigest(null); }
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Unable to load dashboard.");
      }
    })();
    return () => { active = false; };
  }, []);

  const stages = useMemo(() => data?.status_counts || data?.stage_counts || {}, [data]);
  if (error) return <section className="dashboard-panel"><h2>Dashboard unavailable</h2><p className="error">{error}</p><Link className="button" href="/login">Sign in again</Link></section>;
  if (!data) return <section className="dashboard-panel"><p className="eyebrow">CAREEROS</p><h2>Loading your executive dashboard…</h2></section>;

  const firstName = data.user_name?.trim().split(/\s+/)[0] || "there";
  const applications = data.application_count ?? data.active_applications ?? 0;
  const interviews = data.interview_count ?? data.interviews ?? 0;
  const offers = data.offer_count ?? data.offers ?? 0;
  const highMatches = data.high_match_count ?? digest?.high_matches ?? 0;
  const completeness = data.average_completeness ?? (data.ready_profiles ? 100 : 0);
  const followups = data.followups_due ?? digest?.follow_ups_due ?? 0;
  const priority = followups > 0
    ? { title: `Complete ${followups} follow-up${followups === 1 ? "" : "s"}`, detail: "Timely follow-up improves response rates and keeps active opportunities moving.", href: "/applications", action: "Review follow-ups" }
    : highMatches > 0
      ? { title: `Review ${highMatches} strong job match${highMatches === 1 ? "" : "es"}`, detail: "Start with the highest-ranked opportunities and tailor your materials before applying.", href: "/jobs", action: "Review matches" }
      : { title: "Run your next targeted job search", detail: "Use your career profile to find remote and local opportunities that fit your goals.", href: "/jobs", action: "Search jobs" };

  const maxStage = Math.max(1, ...Object.values(stages));
  const stageOrder = ["wishlist", "applied", "recruiter", "interview", "final", "offer", "accepted"];

  return <>
    <section className="executive-hero">
      <div><p className="eyebrow">EXECUTIVE CAREER COMMAND CENTER</p><h1>Welcome back, {firstName}</h1><p className="muted">Your job search, applications, relationships, and interview preparation in one place.</p></div>
      <div className="executive-actions"><Link className="button" href="/jobs">Find opportunities</Link><Link className="button secondary" href="/applications">Open pipeline</Link></div>
    </section>

    <section className="executive-kpis" aria-label="Career performance">
      <article className="executive-kpi"><span>Applications</span><strong>{applications}</strong><small>Tracked opportunities</small></article>
      <article className="executive-kpi"><span>Interviews</span><strong>{interviews}</strong><small>Interview and final stages</small></article>
      <article className="executive-kpi"><span>Strong matches</span><strong>{highMatches}</strong><small>High-priority roles</small></article>
      <article className="executive-kpi"><span>Profile readiness</span><strong>{completeness}%</strong><small>Average profile completion</small></article>
      <article className="executive-kpi"><span>Offers</span><strong>{offers}</strong><small>Offer and accepted stages</small></article>
    </section>

    <section className="executive-grid">
      <article className="priority-card"><p className="eyebrow">TODAY'S PRIORITY</p><h2>{priority.title}</h2><p className="muted">{priority.detail}</p><Link className="button" href={priority.href}>{priority.action}</Link></article>
      <article className="dashboard-panel"><p className="eyebrow">CAREEROS INSIGHT</p><h2>{digest?.unread_count ? `${digest.unread_count} items need attention` : "Your search is organized"}</h2><p className="muted">{digest ? `${digest.saved_search_updates || 0} search updates and ${followups} follow-ups are currently available.` : "Automation insights will appear here as new jobs and follow-ups are detected."}</p><Link href="/notifications">Open notifications →</Link></article>
    </section>

    <section className="executive-grid">
      <article className="dashboard-panel"><div className="row between"><div><p className="eyebrow">APPLICATION PIPELINE</p><h2>Progress by stage</h2></div><Link href="/applications">Manage pipeline →</Link></div><div className="pipeline-list">{stageOrder.map(stage => { const count = stages[stage] || 0; return <div className="pipeline-row" key={stage}><span>{stage[0].toUpperCase() + stage.slice(1)}</span><div className="pipeline-track"><div className="pipeline-fill" style={{width:`${Math.max(count ? 8 : 0, (count / maxStage) * 100)}%`}} /></div><strong>{count}</strong></div>; })}</div></article>
      <article className="dashboard-panel"><p className="eyebrow">QUICK ACTIONS</p><h2>Move your search forward</h2><div className="quick-actions-grid"><Link className="quick-action" href="/jobs"><strong>Search jobs</strong><span>Find and rank opportunities</span></Link><Link className="quick-action" href="/resumes"><strong>Resume studio</strong><span>Analyze and manage résumés</span></Link><Link className="quick-action" href="/interviews"><strong>Interview prep</strong><span>Prepare questions and stories</span></Link><Link className="quick-action" href="/crm"><strong>Recruiter CRM</strong><span>Manage relationships</span></Link></div></article>
    </section>

    <section className="dashboard-panel"><div className="row between"><div><p className="eyebrow">RECENT ACTIVITY</p><h2>Latest progress</h2></div><Link href="/command-center">View command center →</Link></div><div className="activity-list">{data.recent_activity?.length ? data.recent_activity.slice(0,5).map((item,index)=><div className="activity-item" key={`${item.label}-${index}`}><strong>{item.label}</strong><small>{item.detail || "Career activity updated"}</small></div>) : <p className="muted">Your latest résumé, application, and interview activity will appear here.</p>}</div></section>
  </>;
}
