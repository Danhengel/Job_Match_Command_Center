"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Notice, PageHeader } from "@/components/ui";
import { api } from "@/lib/api";

const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const frequencies = ["instant", "daily", "weekdays", "weekly", "manual"];
const hours = Array.from({ length: 24 }, (_, hour) => hour);

type AutomationPreferences = {
  daily_brief_enabled: boolean;
  daily_brief_hour: number;
  weekly_report_enabled: boolean;
  weekly_report_day: number;
  weekly_report_hour: number;
  timezone: string;
  default_search_cadence: string;
  job_alert_frequency: string;
  application_follow_up_days: number;
  interview_reminder_hours: number[];
  quiet_hours_start: number;
  quiet_hours_end: number;
  notification_categories: Record<string, boolean>;
};

type SchedulerStatus = {
  running?: boolean;
  next_run_at?: string | null;
  last_finished_at?: string | null;
  last_error?: string | null;
  last_result?: {
    searches_run?: number;
    follow_ups_created?: number;
    interview_reminders_created?: number;
    daily_briefs_created?: number;
    weekly_reports_created?: number;
  } | null;
};

function hourLabel(hour: number) {
  return `${String(hour).padStart(2, "0")}:00`;
}

function categoryLabel(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function AutomationSettings() {
  const [form, setForm] = useState<AutomationPreferences | null>(null);
  const [status, setStatus] = useState<SchedulerStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [running, setRunning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");

    try {
      const [preferences, scheduler] = await Promise.all([
        api("/api/automation/preferences"),
        api("/api/automation/scheduler/status"),
      ]);
      setForm(preferences);
      setStatus(scheduler);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load automation preferences.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  function update<K extends keyof AutomationPreferences>(key: K, value: AutomationPreferences[K]) {
    setForm((current) => current ? { ...current, [key]: value } : current);
    setMessage("");
  }

  async function save() {
    if (!form) return;
    setBusy(true);
    setError("");
    setMessage("");

    try {
      const updated = await api("/api/automation/preferences", {
        method: "PATCH",
        body: JSON.stringify(form),
      });
      setForm(updated);
      setMessage("Automation preferences saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save preferences.");
    } finally {
      setBusy(false);
    }
  }

  async function runNow() {
    setRunning(true);
    setError("");
    setMessage("");

    try {
      const result = await api("/api/automation/scheduler/run-now", { method: "POST" });
      const scheduler = await api("/api/automation/scheduler/status");
      setStatus(scheduler);
      const notifications =
        Number(result.follow_ups_created || 0) +
        Number(result.interview_reminders_created || 0) +
        Number(result.daily_briefs_created || 0) +
        Number(result.weekly_reports_created || 0);
      setMessage(
        `Automation completed: ${result.searches_run || 0} search${result.searches_run === 1 ? "" : "es"} and ${notifications} notification${notifications === 1 ? "" : "s"} created.`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not run automation.");
    } finally {
      setRunning(false);
    }
  }

  const enabledCategories = useMemo(
    () => Object.values(form?.notification_categories || {}).filter(Boolean).length,
    [form],
  );

  return (
    <>
      <PageHeader
        eyebrow="AUTOMATION CONTROL"
        title="Put your career workflow on a reliable schedule"
        description="Control when CareerNavIQ searches, reminds, and prepares reports. Every setting is stored securely with your account."
        actions={
          <div className="row wrap">
            <Link className="button secondary" href="/automation">Standing briefs</Link>
            <button type="button" disabled={running || loading} onClick={() => void runNow()}>
              {running ? "Running automation…" : "Run automation now"}
            </button>
          </div>
        }
      />

      {error ? <Notice title="Automation settings need attention" tone="error"><p>{error}</p></Notice> : null}
      {message ? <Notice title="Automation updated" tone="success"><p>{message}</p></Notice> : null}

      {loading ? (
        <section className="card">
          <p className="eyebrow">LOADING</p>
          <h2>Loading automation preferences…</h2>
          <p className="muted">CareerNavIQ is checking scheduler health and your saved account settings.</p>
        </section>
      ) : null}

      {!loading && form ? (
        <>
          <section className="automation-health-grid" aria-label="Automation scheduler status">
            <article>
              <span>Scheduler</span>
              <strong>{status?.running ? "Running" : "Stopped"}</strong>
              <small>background workflow status</small>
            </article>
            <article>
              <span>Next check</span>
              <strong>{status?.next_run_at ? new Date(status.next_run_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Not set"}</strong>
              <small>scheduled execution</small>
            </article>
            <article>
              <span>Last completed</span>
              <strong>{status?.last_finished_at ? new Date(status.last_finished_at).toLocaleDateString() : "Not yet"}</strong>
              <small>{status?.last_finished_at ? new Date(status.last_finished_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "no completed cycle"}</small>
            </article>
            <article>
              <span>Last cycle</span>
              <strong>{status?.last_result?.searches_run || 0}</strong>
              <small>standing briefs completed</small>
            </article>
          </section>

          {status?.last_error ? (
            <Notice title="The scheduler reported an error" tone="warning"><p>{status.last_error}</p></Notice>
          ) : null}

          <section className="settings-grid">
            <article className="card settings-card">
              <div className="settings-card-heading">
                <span>01</span>
                <div><h2>Briefings and reports</h2><p>Choose when CareerNavIQ prepares your daily priorities and weekly progress recap.</p></div>
              </div>

              <label className="settings-toggle" htmlFor="daily-brief-enabled">
                <span><strong>Daily briefing</strong><small>Generate a daily priority summary.</small></span>
                <input
                  id="daily-brief-enabled"
                  type="checkbox"
                  checked={form.daily_brief_enabled}
                  onChange={(event) => update("daily_brief_enabled", event.target.checked)}
                />
              </label>
              <label htmlFor="daily-brief-hour">Daily briefing time</label>
              <select
                id="daily-brief-hour"
                value={form.daily_brief_hour}
                disabled={!form.daily_brief_enabled}
                onChange={(event) => update("daily_brief_hour", Number(event.target.value))}
              >
                {hours.map((hour) => <option key={hour} value={hour}>{hourLabel(hour)}</option>)}
              </select>

              <label className="settings-toggle" htmlFor="weekly-report-enabled">
                <span><strong>Weekly report</strong><small>Summarize pipeline and search progress.</small></span>
                <input
                  id="weekly-report-enabled"
                  type="checkbox"
                  checked={form.weekly_report_enabled}
                  onChange={(event) => update("weekly_report_enabled", event.target.checked)}
                />
              </label>
              <div className="settings-two-column">
                <div>
                  <label htmlFor="weekly-report-day">Report day</label>
                  <select
                    id="weekly-report-day"
                    value={form.weekly_report_day}
                    disabled={!form.weekly_report_enabled}
                    onChange={(event) => update("weekly_report_day", Number(event.target.value))}
                  >
                    {days.map((day, index) => <option key={day} value={index}>{day}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="weekly-report-hour">Report time</label>
                  <select
                    id="weekly-report-hour"
                    value={form.weekly_report_hour}
                    disabled={!form.weekly_report_enabled}
                    onChange={(event) => update("weekly_report_hour", Number(event.target.value))}
                  >
                    {hours.map((hour) => <option key={hour} value={hour}>{hourLabel(hour)}</option>)}
                  </select>
                </div>
              </div>
            </article>

            <article className="card settings-card">
              <div className="settings-card-heading">
                <span>02</span>
                <div><h2>Search and follow-up timing</h2><p>Set the default cadence for discovery and the timing of important reminders.</p></div>
              </div>

              <label htmlFor="automation-timezone">Time zone</label>
              <input
                id="automation-timezone"
                value={form.timezone}
                onChange={(event) => update("timezone", event.target.value)}
                placeholder="America/New_York"
              />

              <div className="settings-two-column">
                <div>
                  <label htmlFor="default-search-cadence">Default search cadence</label>
                  <select
                    id="default-search-cadence"
                    value={form.default_search_cadence}
                    onChange={(event) => update("default_search_cadence", event.target.value)}
                  >
                    {frequencies.slice(1).map((frequency) => <option key={frequency} value={frequency}>{categoryLabel(frequency)}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="job-alert-frequency">Job-alert frequency</label>
                  <select
                    id="job-alert-frequency"
                    value={form.job_alert_frequency}
                    onChange={(event) => update("job_alert_frequency", event.target.value)}
                  >
                    {frequencies.map((frequency) => <option key={frequency} value={frequency}>{categoryLabel(frequency)}</option>)}
                  </select>
                </div>
              </div>

              <label htmlFor="application-follow-up">Application follow-up: {form.application_follow_up_days} days</label>
              <input
                id="application-follow-up"
                type="range"
                min="1"
                max="30"
                value={form.application_follow_up_days}
                onChange={(event) => update("application_follow_up_days", Number(event.target.value))}
              />

              <label htmlFor="interview-reminders">Interview reminder hours</label>
              <input
                id="interview-reminders"
                value={(form.interview_reminder_hours || []).join(", ")}
                onChange={(event) => update(
                  "interview_reminder_hours",
                  event.target.value.split(",").map(Number).filter((value) => Number.isFinite(value) && value > 0),
                )}
                placeholder="48, 24, 2"
              />
              <small className="settings-help">Enter hours before an interview, separated by commas.</small>
            </article>

            <article className="card settings-card">
              <div className="settings-card-heading">
                <span>03</span>
                <div><h2>Quiet hours</h2><p>Prevent non-urgent automation from interrupting your preferred downtime.</p></div>
              </div>
              <div className="settings-two-column">
                <div>
                  <label htmlFor="quiet-hours-start">Quiet hours start</label>
                  <select
                    id="quiet-hours-start"
                    value={form.quiet_hours_start}
                    onChange={(event) => update("quiet_hours_start", Number(event.target.value))}
                  >
                    {hours.map((hour) => <option key={hour} value={hour}>{hourLabel(hour)}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="quiet-hours-end">Quiet hours end</label>
                  <select
                    id="quiet-hours-end"
                    value={form.quiet_hours_end}
                    onChange={(event) => update("quiet_hours_end", Number(event.target.value))}
                  >
                    {hours.map((hour) => <option key={hour} value={hour}>{hourLabel(hour)}</option>)}
                  </select>
                </div>
              </div>
              <div className="settings-preview">
                <strong>Current quiet window</strong>
                <span>{hourLabel(form.quiet_hours_start)} to {hourLabel(form.quiet_hours_end)}</span>
              </div>
            </article>

            <article className="card settings-card">
              <div className="settings-card-heading">
                <span>04</span>
                <div><h2>Notification categories</h2><p>Choose the kinds of career activity that should appear in your priority inbox.</p></div>
              </div>
              <div className="settings-category-list">
                {Object.entries(form.notification_categories || {}).map(([key, value]) => (
                  <label className="settings-toggle" key={key} htmlFor={`notification-${key}`}>
                    <span><strong>{categoryLabel(key)}</strong><small>Include this category in notifications.</small></span>
                    <input
                      id={`notification-${key}`}
                      type="checkbox"
                      checked={Boolean(value)}
                      onChange={(event) => update("notification_categories", {
                        ...form.notification_categories,
                        [key]: event.target.checked,
                      })}
                    />
                  </label>
                ))}
              </div>
              <div className="settings-preview">
                <strong>{enabledCategories} categor{enabledCategories === 1 ? "y" : "ies"} enabled</strong>
                <span>Changes take effect after saving.</span>
              </div>
            </article>
          </section>

          <footer className="settings-save-bar">
            <div>
              <strong>Automation preferences</strong>
              <span>Review your timing and notification choices before saving.</span>
            </div>
            <button type="button" disabled={busy} onClick={() => void save()}>
              {busy ? "Saving preferences…" : "Save preferences"}
            </button>
          </footer>
        </>
      ) : null}
    </>
  );
}
