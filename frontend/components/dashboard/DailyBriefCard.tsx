"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type DailyBrief = {
  user_name: string;
  generated_at: string;
  career_health: number;
  summary: {
    new_match_alerts: number;
    high_match_total: number;
    follow_ups_due: number;
    interviews_next_48h: number;
    active_applications: number;
    applications_this_week: number;
    weekly_application_progress: number;
    unread_notifications: number;
  };
  top_priority: {
    kind: string;
    title: string;
    detail: string;
    link: string;
    action: string;
  };
  quick_actions: Array<{ label: string; link: string }>;
  methodology: string;
};

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function DailyBriefCard() {
  const [brief, setBrief] = useState<DailyBrief | null>(null);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    setRefreshing(true);
    setError("");
    try {
      setBrief(await api("/api/dashboard/daily-brief"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load the Daily Brief.");
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (!brief && !error) {
    return <section className="card"><p>Preparing your Daily Brief…</p></section>;
  }

  if (!brief) {
    return <section className="card"><p className="error">{error}</p><button onClick={load}>Try again</button></section>;
  }

  const firstName = brief.user_name?.trim().split(/\s+/)[0] || "there";
  const items = [
    ["New opportunity alerts", brief.summary.new_match_alerts],
    ["Follow-ups due", brief.summary.follow_ups_due],
    ["Interviews within 48 hours", brief.summary.interviews_next_48h],
    ["Active applications", brief.summary.active_applications],
  ];

  return (
    <section className="command-panel daily-brief-card">
      <div className="row between wrap">
        <div>
          <p className="eyebrow">DAILY BRIEF</p>
          <h2>{greeting()}, {firstName}.</h2>
          <p className="muted">Generated from your recorded CareerOS activity.</p>
        </div>
        <div className="health-ring" style={{ "--health": `${brief.career_health * 3.6}deg` } as React.CSSProperties}>
          <div><strong>{brief.career_health}</strong><span>Career health</span></div>
        </div>
      </div>

      <div className="command-kpis">
        {items.map(([label, value]) => (
          <article key={String(label)}><span>{label}</span><strong>{value}</strong></article>
        ))}
        <article><span>Applications this week</span><strong>{brief.summary.applications_this_week}</strong><small>{brief.summary.weekly_application_progress}% of planning target</small></article>
      </div>

      <article className="priority-item">
        <span className="priority-number">1</span>
        <div>
          <small>{brief.top_priority.kind.replaceAll("_", " ")}</small>
          <h3>{brief.top_priority.title}</h3>
          <p>{brief.top_priority.detail}</p>
        </div>
        <Link className="button compact" href={brief.top_priority.link}>{brief.top_priority.action}</Link>
      </article>

      <div className="row wrap">
        {brief.quick_actions.map((item) => <Link className="button secondary compact" href={item.link} key={item.link}>{item.label}</Link>)}
        <button className="secondary compact" onClick={load} disabled={refreshing}>{refreshing ? "Refreshing…" : "Refresh brief"}</button>
      </div>
      <small className="muted">{brief.methodology}</small>
      {error && <p className="error">{error}</p>}
    </section>
  );
}
