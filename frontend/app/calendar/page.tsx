"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";

type CalendarEvent = {
  id: string;
  record_id: number;
  application_id?: number | null;
  kind: "interview" | "application_follow_up" | "recruiter_follow_up";
  title: string;
  detail: string;
  starts_at: string;
  ends_at?: string | null;
  completed: boolean;
  location?: string;
  meeting_url?: string;
  link: string;
  secondary_link?: string;
  secondary_action?: string;
};

type CalendarData = {
  generated_at: string;
  total_events: number;
  upcoming_count: number;
  overdue_count: number;
  today_count: number;
  counts: Record<string, number>;
  agenda: { priority: string; title: string; detail: string; link: string }[];
  events: CalendarEvent[];
};

const filters = [
  ["all", "All activity"],
  ["interview", "Interviews"],
  ["application_follow_up", "Applications"],
  ["recruiter_follow_up", "Recruiters"],
] as const;

function dayKey(value: string) {
  return new Date(value).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function label(kind: CalendarEvent["kind"]) {
  if (kind === "interview") return "Interview";
  if (kind === "application_follow_up") return "Application";
  return "Recruiter";
}

export default function CalendarPage() {
  const [data, setData] = useState<CalendarData | null>(null);
  const [filter, setFilter] = useState<(typeof filters)[number][0]>("all");
  const [range, setRange] = useState<"week" | "month" | "all">("month");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true); setError("");
    try { setData(await api("/api/automation/calendar?days_before=14&days_after=90")); }
    catch (err) { setError(err instanceof Error ? err.message : "Unable to load calendar."); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  const visible = useMemo(() => {
    if (!data) return [];
    const now = new Date();
    const rangeEnd = new Date(now);
    rangeEnd.setDate(rangeEnd.getDate() + (range === "week" ? 7 : range === "month" ? 31 : 365));
    return data.events.filter(item => {
      if (filter !== "all" && item.kind !== filter) return false;
      if (range === "all") return true;
      const when = new Date(item.starts_at);
      return when <= rangeEnd;
    });
  }, [data, filter, range]);

  const grouped = useMemo(() => {
    return visible.reduce<Record<string, CalendarEvent[]>>((acc, item) => {
      const key = dayKey(item.starts_at);
      (acc[key] ||= []).push(item);
      return acc;
    }, {});
  }, [visible]);

  if (loading) return <section className="dashboard-panel"><p className="eyebrow">ROUTE CALENDAR</p><h2>Loading your career timeline…</h2></section>;
  if (error) return <section className="dashboard-panel"><h2>Calendar unavailable</h2><p className="error">{error}</p><button onClick={load}>Try again</button></section>;
  if (!data) return null;

  return <>
    <section className="executive-hero">
      <div><p className="eyebrow">ROUTE CALENDAR</p><h1>Your career timeline</h1><p className="muted">Interviews, application actions, and recruiter follow-ups organized as connected waypoints.</p></div>
      <div className="executive-actions"><button onClick={load}>Refresh calendar</button><Link className="button secondary" href="/interviews">Schedule interview</Link></div>
    </section>

    <section className="executive-kpis" aria-label="Calendar summary">
      <article className="executive-kpi"><span>Today</span><strong>{data.today_count}</strong><small>Scheduled items</small></article>
      <article className="executive-kpi"><span>Upcoming</span><strong>{data.upcoming_count}</strong><small>Future events</small></article>
      <article className="executive-kpi"><span>Overdue</span><strong>{data.overdue_count}</strong><small>Needs attention</small></article>
      <article className="executive-kpi"><span>Interviews</span><strong>{data.counts.interview || 0}</strong><small>In this timeline</small></article>
      <article className="executive-kpi"><span>Total</span><strong>{data.total_events}</strong><small>Tracked calendar items</small></article>
    </section>

    <section className="executive-grid">
      <article className="priority-card"><p className="eyebrow">TODAY'S ROUTE</p><h2>Move in priority order</h2><div className="activity-list">{data.agenda.map((item, index) => <div className="activity-item" key={`${item.title}-${index}`}><span className="badge">{item.priority}</span><strong>{item.title}</strong><small>{item.detail}</small><Link href={item.link}>Open waypoint →</Link></div>)}</div></article>
      <article className="dashboard-panel"><p className="eyebrow">VIEW CONTROLS</p><h2>Focus the timeline</h2><label>Activity type</label><select value={filter} onChange={event => setFilter(event.target.value as typeof filter)}>{filters.map(([value, text]) => <option key={value} value={value}>{text}</option>)}</select><label>Time range</label><select value={range} onChange={event => setRange(event.target.value as typeof range)}><option value="week">Next 7 days</option><option value="month">Next 31 days</option><option value="all">Full timeline</option></select><p className="muted">Showing {visible.length} of {data.total_events} items.</p></article>
    </section>

    <section className="dashboard-panel">
      <div className="row between"><div><p className="eyebrow">ROUTE TIMELINE</p><h2>Scheduled waypoints</h2></div><Link href="/notifications">Open route updates →</Link></div>
      {Object.keys(grouped).length ? Object.entries(grouped).map(([date, items]) => <section key={date} className="activity-list"><h3>{date}</h3>{items.map(item => {
        const overdue = new Date(item.starts_at) < new Date() && !item.completed;
        return <article className="notification-row" key={item.id}><div><div className="row wrap"><span className={`badge ${overdue ? "warning-badge" : ""}`}>{label(item.kind)}</span>{overdue && <span className="badge warning-badge">Overdue</span>}{item.completed && <span className="badge">Completed</span>}</div><strong>{item.title}</strong><p>{item.detail}</p><small>{new Date(item.starts_at).toLocaleString()}{item.location ? ` · ${item.location}` : ""}</small></div><div className="row wrap">{item.meeting_url && <a className="button" href={item.meeting_url} target="_blank" rel="noreferrer">Join meeting</a>}<Link className="button secondary" href={item.link}>Open</Link>{item.secondary_link && <Link className="button secondary" href={item.secondary_link}>{item.secondary_action || "Continue"}</Link>}</div></article>;
      })}</section>) : <p className="muted">No calendar items match this view.</p>}
    </section>
  </>;
}
