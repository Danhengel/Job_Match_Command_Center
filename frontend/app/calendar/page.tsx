"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { MetricStrip, Notice, PageHeader, SectionHeader } from "@/components/ui";
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
  ["recruiter_follow_up", "Relationships"],
] as const;

function dayKey(value: string) {
  return new Date(value).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function label(kind: CalendarEvent["kind"]) {
  if (kind === "interview") return "Interview";
  if (kind === "application_follow_up") return "Application";
  return "Relationship";
}

export default function CalendarPage() {
  const [data, setData] = useState<CalendarData | null>(null);
  const [filter, setFilter] = useState<(typeof filters)[number][0]>("all");
  const [range, setRange] = useState<"week" | "month" | "all">("month");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setError("");
    try {
      setData(await api("/api/automation/calendar?days_before=14&days_after=90"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load calendar.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  const visible = useMemo(() => {
    if (!data) return [];
    const now = new Date();
    const rangeEnd = new Date(now);
    rangeEnd.setDate(rangeEnd.getDate() + (range === "week" ? 7 : range === "month" ? 31 : 365));
    return data.events.filter((item) => {
      if (filter !== "all" && item.kind !== filter) return false;
      if (range === "all") return true;
      return new Date(item.starts_at) <= rangeEnd;
    });
  }, [data, filter, range]);

  const grouped = useMemo(() => visible.reduce<Record<string, CalendarEvent[]>>((acc, item) => {
    const key = dayKey(item.starts_at);
    (acc[key] ||= []).push(item);
    return acc;
  }, {}), [visible]);

  if (loading) return <section className="executive-loading"><p className="eyebrow">CALENDAR</p><h2>Preparing your schedule…</h2></section>;
  if (error) return <Notice title="Calendar unavailable" tone="error"><p>{error}</p><button onClick={load}>Try again</button></Notice>;
  if (!data) return null;

  return (
    <>
      <PageHeader
        eyebrow="CALENDAR"
        title="Keep every interview and follow-up visible"
        description="See interviews, application actions, and relationship follow-ups in one schedule so important commitments do not disappear into separate tools."
        actions={<div className="row wrap"><button onClick={load}>Refresh calendar</button><Link className="button secondary" href="/interviews">Interview advisory</Link></div>}
      />

      <MetricStrip
        ariaLabel="Calendar summary"
        items={[
          { label: "Today", value: data.today_count, detail: "scheduled items" },
          { label: "Upcoming", value: data.upcoming_count, detail: "future events" },
          { label: "Overdue", value: data.overdue_count, detail: "need attention" },
          { label: "Interviews", value: data.counts.interview || 0, detail: "in this schedule" },
          { label: "Total", value: data.total_events, detail: "tracked calendar items" },
        ]}
      />

      <section className="executive-grid">
        <article className="priority-card">
          <SectionHeader eyebrow="TODAY'S PRIORITIES" title="Work in priority order" description="Use the agenda to address the most time-sensitive commitments first." />
          <div className="activity-list">
            {data.agenda.map((item, index) => <div className="activity-item" key={`${item.title}-${index}`}><span className="badge">{item.priority}</span><strong>{item.title}</strong><small>{item.detail}</small><Link href={item.link}>Open item →</Link></div>)}
          </div>
        </article>
        <article className="dashboard-panel">
          <SectionHeader eyebrow="VIEW CONTROLS" title="Focus the schedule" />
          <label>Activity type</label>
          <select value={filter} onChange={(event) => setFilter(event.target.value as typeof filter)}>{filters.map(([value, text]) => <option key={value} value={value}>{text}</option>)}</select>
          <label>Time range</label>
          <select value={range} onChange={(event) => setRange(event.target.value as typeof range)}><option value="week">Next 7 days</option><option value="month">Next 31 days</option><option value="all">Full schedule</option></select>
          <p className="muted">Showing {visible.length} of {data.total_events} items.</p>
        </article>
      </section>

      <section className="dashboard-panel">
        <SectionHeader eyebrow="SCHEDULE" title="Upcoming commitments" actions={<Link href="/notifications">Open updates →</Link>} />
        {Object.keys(grouped).length ? Object.entries(grouped).map(([date, items]) => (
          <section key={date} className="activity-list">
            <h3>{date}</h3>
            {items.map((item) => {
              const overdue = new Date(item.starts_at) < new Date() && !item.completed;
              return (
                <article className="notification-row" key={item.id}>
                  <div>
                    <div className="row wrap"><span className={`badge ${overdue ? "warning-badge" : ""}`}>{label(item.kind)}</span>{overdue ? <span className="badge warning-badge">Overdue</span> : null}{item.completed ? <span className="badge">Completed</span> : null}</div>
                    <strong>{item.title}</strong><p>{item.detail}</p><small>{new Date(item.starts_at).toLocaleString()}{item.location ? ` · ${item.location}` : ""}</small>
                  </div>
                  <div className="row wrap">{item.meeting_url ? <a className="button" href={item.meeting_url} target="_blank" rel="noreferrer">Join meeting</a> : null}<Link className="button secondary" href={item.link}>Open</Link>{item.secondary_link ? <Link className="button secondary" href={item.secondary_link}>{item.secondary_action || "Continue"}</Link> : null}</div>
                </article>
              );
            })}
          </section>
        )) : <p className="muted">No calendar items match this view.</p>}
      </section>
    </>
  );
}
