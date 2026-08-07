"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { MetricStrip, Notice, PageHeader, SectionHeader } from "@/components/ui";
import { api } from "@/lib/api";

type Digest = {
  unread_count: number;
  high_matches: number;
  saved_search_updates: number;
  follow_ups_due: number;
  interview_reminders?: number;
};

type Notification = {
  id: number;
  kind: string;
  title: string;
  message: string;
  link: string;
  read: boolean;
  metadata?: Record<string, unknown>;
  created_at: string;
};

const filters = [
  ["all", "All"],
  ["unread", "Unread"],
  ["high_match", "Opportunity signals"],
  ["saved_search", "Market briefs"],
  ["follow_up", "Follow-ups"],
  ["interview_reminder", "Interviews"],
] as const;

const kindLabels: Record<string, string> = {
  high_match: "High alignment",
  saved_search: "Market brief",
  follow_up: "Follow-up",
  interview_reminder: "Interview",
};

export default function Notifications() {
  const [digest, setDigest] = useState<Digest | null>(null);
  const [items, setItems] = useState<Notification[]>([]);
  const [filter, setFilter] = useState("all");
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  async function load() {
    setError("");
    try {
      const [d, n] = await Promise.all([api("/api/automation/digest"), api("/api/automation/notifications")]);
      setDigest(d);
      setItems(n);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load updates.");
    }
  }

  useEffect(() => { void load(); }, []);

  const visible = useMemo(() => {
    if (filter === "all") return items;
    if (filter === "unread") return items.filter((item) => !item.read);
    return items.filter((item) => item.kind === filter);
  }, [items, filter]);

  const urgentCount = useMemo(() => items.filter((item) => !item.read && (item.kind === "follow_up" || item.kind === "interview_reminder")).length, [items]);

  async function refreshRules() {
    setBusy("refresh");
    setNotice("");
    setError("");
    try {
      const result = await api("/api/automation/notifications/refresh", { method: "POST" });
      const created = Number(result.follow_ups_created || 0) + Number(result.interview_reminders_created || 0);
      setNotice(created ? `${created} new time-sensitive update${created === 1 ? "" : "s"} created.` : "You are up to date. No new time-sensitive items were found.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to refresh updates.");
    } finally {
      setBusy(null);
    }
  }

  async function read(item: Notification) {
    setBusy(`read-${item.id}`);
    try {
      await api(`/api/automation/notifications/${item.id}/read`, { method: "POST" });
      await load();
    } finally {
      setBusy(null);
    }
  }

  async function dismiss(item: Notification) {
    setBusy(`dismiss-${item.id}`);
    try {
      await api(`/api/automation/notifications/${item.id}`, { method: "DELETE" });
      await load();
    } finally {
      setBusy(null);
    }
  }

  async function readAll() {
    setBusy("read-all");
    try {
      await api("/api/automation/notifications/read-all", { method: "POST" });
      await load();
    } finally {
      setBusy(null);
    }
  }

  if (!digest && !error) return <section className="executive-loading"><p className="eyebrow">UPDATES</p><h2>Preparing your actionable inbox…</h2></section>;

  return (
    <>
      <PageHeader
        eyebrow="UPDATES"
        title="Keep time-sensitive decisions and follow-ups in one place"
        description="CareerNavIQ combines high-alignment opportunities, scheduled market reviews, overdue follow-ups, and upcoming interviews into one actionable inbox."
        actions={<div className="row wrap"><button onClick={refreshRules} disabled={busy === "refresh"}>{busy === "refresh" ? "Checking…" : "Check for updates"}</button><button className="secondary" onClick={readAll} disabled={busy === "read-all" || !digest?.unread_count}>{busy === "read-all" ? "Updating…" : "Mark all read"}</button></div>}
      />

      {error ? <Notice title="Updates could not be refreshed" tone="error"><p>{error}</p></Notice> : null}
      {notice ? <Notice title="Update check complete" tone="success"><p>{notice}</p></Notice> : null}

      <MetricStrip
        ariaLabel="Updates summary"
        items={[
          { label: "Unread", value: digest?.unread_count || 0, detail: "items awaiting review" },
          { label: "Time-sensitive", value: urgentCount, detail: "follow-ups and interviews" },
          { label: "High alignment", value: digest?.high_matches || 0, detail: "strong opportunities" },
          { label: "Market updates", value: digest?.saved_search_updates || 0, detail: "scheduled review results" },
          { label: "Interview reminders", value: digest?.interview_reminders || 0, detail: "within the next 48 hours" },
        ]}
      />

      <section className="dashboard-panel">
        <SectionHeader
          eyebrow="ACTIONABLE INBOX"
          title={`${visible.length} update${visible.length === 1 ? "" : "s"} in view`}
          description="Filter the inbox without losing the distinction between market signals and commitments that require action."
          actions={<div className="row wrap">{filters.map(([value, label]) => <button key={value} className={filter === value ? "" : "secondary"} onClick={() => setFilter(value)}>{label}</button>)}</div>}
        />

        <div className="activity-list">
          {visible.map((item) => (
            <article className={`notification-row ${item.read ? "read" : ""}`} key={item.id}>
              <div>
                <div className="row wrap"><span className="badge">{kindLabels[item.kind] || item.kind.replaceAll("_", " ")}</span>{!item.read ? <span className="badge">Unread</span> : null}</div>
                <h3>{item.title}</h3><p>{item.message}</p><small>{new Date(item.created_at).toLocaleString()}</small>
              </div>
              <div className="row wrap">
                {item.link ? <Link className="button" href={item.link}>Open action</Link> : null}
                {!item.read ? <button className="secondary" onClick={() => read(item)} disabled={busy === `read-${item.id}`}>Mark read</button> : null}
                <button className="danger" onClick={() => dismiss(item)} disabled={busy === `dismiss-${item.id}`}>Dismiss</button>
              </div>
            </article>
          ))}
          {!visible.length ? (
            <div>
              <h3>No updates in this view</h3>
              <p className="muted">Schedule a market review, add an interview, or set a follow-up date. CareerNavIQ will surface the next action here.</p>
              <div className="row wrap"><Link className="button" href="/automation">Manage automation</Link><Link className="button secondary" href="/interviews">Interview advisory</Link></div>
            </div>
          ) : null}
        </div>
      </section>
    </>
  );
}
