"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type DashboardData = {
  user_name: string;
  profile_count: number;
  resume_count: number;
  ready_profiles: number;
  active_applications: number;
  interviews: number;
  offers: number;
  tailored_resume_count: number;
  followups_due: number;
  stage_counts: Record<string, number>;
};

type DigestData = {
  unread_count: number;
  high_matches: number;
  saved_search_updates: number;
  follow_ups_due: number;
};

const METRICS: Array<[keyof DashboardData, string, string]> = [
  ["profile_count", "Career profiles", "Defined target strategies"],
  ["resume_count", "Résumé versions", "Master and tailored drafts"],
  ["ready_profiles", "Profiles ready", "Prepared for matching"],
  ["active_applications", "Active applications", "In the current pipeline"],
  ["interviews", "Upcoming interviews", "Scheduled and incomplete"],
  ["offers", "Offers", "Offer and accepted stages"],
  ["tailored_resume_count", "Tailored résumés", "Job-specific versions"],
  ["followups_due", "Follow-ups due", "Actions needing attention"],
];

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [digest, setDigest] = useState<DigestData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      setError("");
      try {
        const dashboardData = await api("/api/dashboard");
        if (!active) return;
        setData(dashboardData);

        // The digest is useful but optional. A digest failure should never
        // take down the main dashboard.
        try {
          const digestData = await api("/api/automation/digest");
          if (active) setDigest(digestData);
        } catch {
          if (active) setDigest(null);
        }
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Unable to load dashboard.");
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, []);

  if (error) {
    return (
      <section className="card dashboard-error-card">
        <p className="eyebrow">DASHBOARD</p>
        <h2>Dashboard unavailable</h2>
        <p className="error">{error}</p>
        <Link className="button secondary" href="/login">
          Sign in again
        </Link>
      </section>
    );
  }

  if (!data) {
    return (
      <section className="card dashboard-loading-card">
        <p className="eyebrow">EXECUTIVE CAREER COMMAND CENTER</p>
        <h2>Loading your dashboard…</h2>
        <p className="muted">Pulling your current applications, résumés, and interview activity.</p>
      </section>
    );
  }

  const stageEntries = Object.entries(data.stage_counts || {}).sort(([a], [b]) => a.localeCompare(b));
  const firstName = data.user_name?.trim().split(/\s+/)[0] || "Dan";

  return (
    <>
      <section className="dashboard-hero">
        <div>
          <p className="eyebrow">EXECUTIVE CAREER COMMAND CENTER</p>
          <h1>Welcome back, {firstName}</h1>
          <p className="muted">Search, tailor, apply, prepare, and follow up from one workspace.</p>
        </div>
        <div className="row wrap">
          <Link className="button" href="/jobs">Find opportunities</Link>
          <Link className="button secondary" href="/applications">Open pipeline</Link>
        </div>
      </section>

      <section className="dashboard-metrics-grid" aria-label="Career metrics">
        {METRICS.map(([key, label, detail]) => (
          <article className="dashboard-metric-card" key={key}>
            <span>{label}</span>
            <strong>{Number(data[key] ?? 0)}</strong>
            <small>{detail}</small>
          </article>
        ))}
      </section>

      <section className="card dashboard-digest-card">
        <div className="row between">
          <div>
            <p className="eyebrow">DAILY DIGEST</p>
            <h2>{digest ? `${digest.unread_count} items need attention` : "No urgent actions"}</h2>
            <p className="muted">
              {digest
                ? `${digest.high_matches} high matches · ${digest.follow_ups_due} follow-ups · ${digest.saved_search_updates} search updates`
                : "Your dashboard is available. Optional automation updates will appear here when ready."}
            </p>
          </div>
          <Link className="button" href="/notifications">Open notifications</Link>
        </div>
      </section>

      <section className="two-col dashboard-lower-grid">
        <section className="card">
          <div className="row between">
            <div>
              <p className="eyebrow">APPLICATION FUNNEL</p>
              <h2>Pipeline by stage</h2>
            </div>
            <Link className="button secondary" href="/applications">Manage pipeline</Link>
          </div>
          {stageEntries.length ? (
            <div className="dashboard-funnel-list">
              {stageEntries.map(([stage, count]) => (
                <div className="dashboard-funnel-row" key={stage}>
                  <span>{stage.replaceAll("_", " ")}</span>
                  <strong>{count}</strong>
                </div>
              ))}
            </div>
          ) : (
            <div className="dashboard-empty-state">
              <h3>No applications yet</h3>
              <p className="muted">Save a strong job match to begin tracking your pipeline.</p>
              <Link className="button" href="/jobs">Search jobs</Link>
            </div>
          )}
        </section>

        <section className="card">
          <p className="eyebrow">QUICK ACTIONS</p>
          <h2>Move your search forward</h2>
          <div className="dashboard-action-grid">
            <Link className="dashboard-action-card" href="/jobs"><strong>Find opportunities</strong><span>Search and rank new roles</span></Link>
            <Link className="dashboard-action-card" href="/applications"><strong>Manage applications</strong><span>Update stages and next actions</span></Link>
            <Link className="dashboard-action-card" href="/resumes"><strong>Resume Studio</strong><span>Analyze and manage résumés</span></Link>
            <Link className="dashboard-action-card" href="/interviews"><strong>Interview Center</strong><span>Review upcoming preparation</span></Link>
            <Link className="dashboard-action-card" href="/crm"><strong>Recruiter CRM</strong><span>Track relationships and follow-ups</span></Link>
            <Link className="dashboard-action-card" href="/coach"><strong>Career coach</strong><span>Review strategic recommendations</span></Link>
          </div>
        </section>
      </section>
    </>
  );
}
