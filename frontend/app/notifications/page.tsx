"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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
  ["high_match", "Job matches"],
  ["saved_search", "Search updates"],
  ["follow_up", "Follow-ups"],
  ["interview_reminder", "Interviews"],
] as const;

const kindLabels: Record<string, string> = {
  high_match: "High match",
  saved_search: "Saved search",
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
      const [d, n] = await Promise.all([
        api("/api/automation/digest"),
        api("/api/automation/notifications"),
      ]);
      setDigest(d);
      setItems(n);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load notifications.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  const visible = useMemo(() => {
    if (filter === "all") return items;
    if (filter === "unread") return items.filter((item) => !item.read);
    return items.filter((item) => item.kind === filter);
  }, [items, filter]);

  const urgentCount = useMemo(
    () =>
      items.filter(
        (item) =>
          !item.read &&
          (item.kind === "follow_up" || item.kind === "interview_reminder"),
      ).length,
    [items],
  );

  async function refreshRules() {
    setBusy("refresh");
    setNotice("");
    setError("");
    try {
      const result = await api("/api/automation/notifications/refresh", {
        method: "POST",
      });
      const created =
        Number(result.follow_ups_created || 0) +
        Number(result.interview_reminders_created || 0);
      setNotice(
        created
          ? `${created} new time-sensitive notification${created === 1 ? "" : "s"} created.`
          : "You are up to date. No new time-sensitive items were found.",
      );
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to refresh notifications.");
    } finally {
      setBusy(null);
    }
  }

  async function read(item: Notification) {
    setBusy(`read-${item.id}`);
    try {
      await api(`/api/automation/notifications/${item.id}/read`, {
        method: "POST",
      });
      await load();
    } finally {
      setBusy(null);
    }
  }

  async function dismiss(item: Notification) {
    setBusy(`dismiss-${item.id}`);
    try {
      await api(`/api/automation/notifications/${item.id}`, {
        method: "DELETE",
      });
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

  if (!digest && !error) {
    return (
      <section className="dashboard-panel">
        <p className="eyebrow">SMART NOTIFICATIONS</p>
        <h2>Loading your priority inbox…</h2>
      </section>
    );
  }

  return (
    <>
      <section className="executive-hero">
        <div>
          <p className="eyebrow">SMART NOTIFICATION CENTER</p>
          <h1>Know what needs attention next.</h1>
          <p className="muted">
            CareerOS combines high-match jobs, saved-search results, overdue
            follow-ups, and upcoming interviews in one actionable inbox.
          </p>
        </div>
        <div className="executive-actions">
          <button onClick={refreshRules} disabled={busy === "refresh"}>
            {busy === "refresh" ? "Checking…" : "Check for updates"}
          </button>
          <button
            className="secondary"
            onClick={readAll}
            disabled={busy === "read-all" || !digest?.unread_count}
          >
            {busy === "read-all" ? "Updating…" : "Mark all read"}
          </button>
        </div>
      </section>

      {error ? (
        <section className="resume-alert resume-alert-error">
          <strong>Unable to update notifications</strong>
          <span>{error}</span>
        </section>
      ) : null}
      {notice ? (
        <section className="resume-alert">
          <strong>Notification check complete</strong>
          <span>{notice}</span>
        </section>
      ) : null}

      <section className="executive-kpis" aria-label="Notification summary">
        <article className="executive-kpi">
          <span>Unread</span>
          <strong>{digest?.unread_count || 0}</strong>
          <small>items awaiting review</small>
        </article>
        <article className="executive-kpi">
          <span>Time-sensitive</span>
          <strong>{urgentCount}</strong>
          <small>follow-ups and interviews</small>
        </article>
        <article className="executive-kpi">
          <span>High matches</span>
          <strong>{digest?.high_matches || 0}</strong>
          <small>strong-fit opportunities</small>
        </article>
        <article className="executive-kpi">
          <span>Search updates</span>
          <strong>{digest?.saved_search_updates || 0}</strong>
          <small>saved-search results</small>
        </article>
        <article className="executive-kpi">
          <span>Interview reminders</span>
          <strong>{digest?.interview_reminders || 0}</strong>
          <small>within the next 48 hours</small>
        </article>
      </section>

      <section className="dashboard-panel">
        <div className="row between wrap">
          <div>
            <p className="eyebrow">PRIORITY INBOX</p>
            <h2>{visible.length} notification{visible.length === 1 ? "" : "s"}</h2>
          </div>
          <div className="row wrap">
            {filters.map(([value, label]) => (
              <button
                key={value}
                className={filter === value ? "" : "secondary"}
                onClick={() => setFilter(value)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="activity-list">
          {visible.map((item) => (
            <article
              className={`notification-row ${item.read ? "read" : ""}`}
              key={item.id}
            >
              <div>
                <div className="row wrap">
                  <span className="badge">
                    {kindLabels[item.kind] || item.kind.replaceAll("_", " ")}
                  </span>
                  {!item.read ? <span className="badge">Unread</span> : null}
                </div>
                <h3>{item.title}</h3>
                <p>{item.message}</p>
                <small>{new Date(item.created_at).toLocaleString()}</small>
              </div>
              <div className="row wrap">
                {item.link ? (
                  <Link className="button" href={item.link}>
                    Open action
                  </Link>
                ) : null}
                {!item.read ? (
                  <button
                    className="secondary"
                    onClick={() => read(item)}
                    disabled={busy === `read-${item.id}`}
                  >
                    Mark read
                  </button>
                ) : null}
                <button
                  className="danger"
                  onClick={() => dismiss(item)}
                  disabled={busy === `dismiss-${item.id}`}
                >
                  Dismiss
                </button>
              </div>
            </article>
          ))}
          {!visible.length ? (
            <div>
              <h3>No notifications in this view</h3>
              <p className="muted">
                Run a saved search, add an interview, or schedule an application
                follow-up. CareerOS will surface the next action here.
              </p>
              <div className="row wrap">
                <Link className="button" href="/automation">
                  Manage saved searches
                </Link>
                <Link className="button secondary" href="/interviews">
                  Open Interview Center
                </Link>
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </>
  );
}
