"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";

type Priority = {
  kind: string;
  title: string;
  detail: string;
  link: string;
};

type HighMatchJob = {
  job_id: number;
  profile_id: number;
  title: string;
  company: string;
  location: string;
  score: number;
};

type Interview = {
  id: number;
  application_id: number;
  title: string;
  starts_at: string;
  location: string;
  meeting_url?: string;
};

type CommandCenterData = {
  metrics: {
    profiles: number;
    total_matches: number;
    high_matches: number;
    applications: number;
    active_applications: number;
    interviews: number;
    offers: number;
    recruiters: number;
    tailored_resumes: number;
    unread_notifications: number;
    average_match: number;
    stage_counts: Record<string, number>;
    top_companies: Array<{
      company: string;
      count: number;
    }>;
  };
  priorities: Priority[];
  upcoming_interviews: Interview[];
  high_match_jobs: HighMatchJob[];
};

type StrategyData = {
  application_count: number;
  interview_conversion: number;
  offer_conversion: number;
  insights: string[];
};

const funnelStages = [
  { key: "wishlist", label: "Wishlist" },
  { key: "applied", label: "Applied" },
  { key: "recruiter", label: "Recruiter" },
  { key: "interview", label: "Interview" },
  { key: "final", label: "Final" },
  { key: "offer", label: "Offer" },
  { key: "accepted", label: "Accepted" },
];

function formatPriorityKind(kind: string) {
  return kind.replaceAll("_", " ");
}

export default function CommandCenterPage() {
  const [data, setData] = useState<CommandCenterData | null>(null);
  const [strategy, setStrategy] = useState<StrategyData | null>(null);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  async function loadDashboard() {
    setRefreshing(true);
    setError("");

    try {
      const [commandData, strategyData] = await Promise.all([
        api("/api/enterprise/command-center"),
        api("/api/enterprise/strategy"),
      ]);

      setData(commandData);
      setStrategy(strategyData);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load the Navigation Hub."
      );
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const maximumStageCount = useMemo(() => {
    if (!data) {
      return 1;
    }

    const counts = funnelStages.map(
      (stage) => data.metrics.stage_counts?.[stage.key] || 0
    );

    return Math.max(1, ...counts);
  }, [data]);

  if (error && !data) {
    return (
      <section className="card">
        <h1>Navigation Hub unavailable</h1>
        <p className="error">{error}</p>
        <button onClick={loadDashboard}>Try again</button>
      </section>
    );
  }

  if (!data) {
    return (
      <section className="card">
        <h2>Loading your route overview…</h2>
      </section>
    );
  }

  const metrics = data.metrics;

  return (
    <>
      <section className="executive-hero">
        <div>
          <p className="eyebrow">ROUTE OVERVIEW</p>
          <h1>See your full career route</h1>
          <p className="muted">
            Follow opportunities, applications, interviews, recruiter
            relationships, and the highest-priority waypoints ahead.
          </p>
        </div>

        <div className="row wrap">
          <button onClick={loadDashboard} disabled={refreshing}>
            {refreshing ? "Refreshing…" : "Refresh route"}
          </button>

          <Link className="button secondary" href="/jobs">
            Explore opportunity map
          </Link>
        </div>
      </section>

      {error && (
        <section className="card">
          <p className="error">{error}</p>
        </section>
      )}

      <section className="executive-metrics-grid">
        <article className="executive-metric-card">
          <span>Selected opportunities</span>
          <strong>{metrics.total_matches}</strong>
          <small>{metrics.high_matches} high-priority signals</small>
        </article>

        <article className="executive-metric-card">
          <span>Active applications</span>
          <strong>{metrics.active_applications}</strong>
          <small>{metrics.applications} total applications</small>
        </article>

        <article className="executive-metric-card">
          <span>Upcoming interviews</span>
          <strong>{metrics.interviews}</strong>
          <small>Scheduled and incomplete</small>
        </article>

        <article className="executive-metric-card">
          <span>Offers</span>
          <strong>{metrics.offers}</strong>
          <small>Offer and accepted stages</small>
        </article>

        <article className="executive-metric-card">
          <span>Average alignment</span>
          <strong>{metrics.average_match}%</strong>
          <small>Across scored opportunities</small>
        </article>

        <article className="executive-metric-card">
          <span>Tailored résumés</span>
          <strong>{metrics.tailored_resumes}</strong>
          <small>Saved role-specific versions</small>
        </article>

        <article className="executive-metric-card">
          <span>Recruiter contacts</span>
          <strong>{metrics.recruiters}</strong>
          <small>Saved relationships</small>
        </article>

        <article className="executive-metric-card">
          <span>Unread alerts</span>
          <strong>{metrics.unread_notifications}</strong>
          <small>Opportunities, updates, and follow-ups</small>
        </article>
      </section>

      <section className="command-layout">
        <article className="card command-priorities">
          <div className="row between">
            <div>
              <p className="eyebrow">NEXT WAYPOINTS</p>
              <h2>Today’s route</h2>
            </div>

            <Link className="button secondary" href="/notifications">
              View alerts
            </Link>
          </div>

          {data.priorities.length ? (
            data.priorities.map((priority, index) => (
              <Link
                className="executive-priority-row"
                href={priority.link}
                key={`${priority.kind}-${index}`}
              >
                <span className="badge">
                  {formatPriorityKind(priority.kind)}
                </span>

                <div>
                  <strong>{priority.title}</strong>
                  <small>{priority.detail}</small>
                </div>

                <span className="priority-arrow">→</span>
              </Link>
            ))
          ) : (
            <div className="empty-state">
              <h3>No urgent actions</h3>
              <p className="muted">
                Your interviews, follow-ups, and high-alignment opportunities will appear here.
              </p>
            </div>
          )}
        </article>

        <article className="card">
          <p className="eyebrow">NAVIGATION SIGNALS</p>
          <h2>Progress and direction</h2>

          <div className="strategy-stat">
            <span>Interview conversion</span>
            <strong>{strategy?.interview_conversion || 0}%</strong>
          </div>

          <div className="progress-track">
            <div
              className="progress-value"
              style={{
                width: `${Math.min(
                  100,
                  strategy?.interview_conversion || 0
                )}%`,
              }}
            />
          </div>

          <div className="strategy-stat">
            <span>Offer conversion</span>
            <strong>{strategy?.offer_conversion || 0}%</strong>
          </div>

          <div className="progress-track">
            <div
              className="progress-value"
              style={{
                width: `${Math.min(100, strategy?.offer_conversion || 0)}%`,
              }}
            />
          </div>

          <h3>Recommended focus</h3>

          {strategy?.insights?.length ? (
            strategy.insights.map((insight, index) => (
              <p className="strategy-insight" key={index}>
                • {insight}
              </p>
            ))
          ) : (
            <p className="muted">
              Add and progress applications to reveal useful route signals.
            </p>
          )}
        </article>
      </section>

      <section className="card">
        <div className="row between">
          <div>
            <p className="eyebrow">ROUTE MOVEMENT</p>
            <h2>Applications by stage</h2>
          </div>

          <Link className="button secondary" href="/applications">
            Open tracker
          </Link>
        </div>

        <div className="funnel-grid">
          {funnelStages.map((stage) => {
            const count = metrics.stage_counts?.[stage.key] || 0;
            const width = Math.max(
              count ? 8 : 0,
              Math.round((count / maximumStageCount) * 100)
            );

            return (
              <article className="funnel-stage-card" key={stage.key}>
                <div className="row between">
                  <span>{stage.label}</span>
                  <strong>{count}</strong>
                </div>

                <div className="funnel-track">
                  <div
                    className="funnel-value"
                    style={{ width: `${width}%` }}
                  />
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="command-layout">
        <article className="card">
          <div className="row between">
            <div>
              <p className="eyebrow">STRONGEST ROUTE OPTIONS</p>
              <h2>Highest-alignment opportunities</h2>
            </div>

            <Link className="button secondary" href="/jobs">
              View all
            </Link>
          </div>

          {data.high_match_jobs.length ? (
            data.high_match_jobs.map((job) => (
              <Link
                className="executive-job-row"
                href={`/jobs/${job.job_id}?profile_id=${job.profile_id}`}
                key={`${job.profile_id}-${job.job_id}`}
              >
                <div className="executive-job-score">
                  {job.score}
                  <small>alignment</small>
                </div>

                <div>
                  <strong>{job.title}</strong>
                  <small>
                    {job.company} · {job.location || "Location not listed"}
                  </small>
                </div>

                <span className="priority-arrow">→</span>
              </Link>
            ))
          ) : (
            <p className="muted">
              Search the opportunity map to reveal possible routes.
            </p>
          )}
        </article>

        <article className="card">
          <div className="row between">
            <div>
              <p className="eyebrow">INTERVIEW WAYPOINTS</p>
              <h2>Upcoming interviews</h2>
            </div>

            <Link className="button secondary" href="/interviews">
              View interview path
            </Link>
          </div>

          {data.upcoming_interviews.length ? (
            data.upcoming_interviews.map((event) => (
              <article className="executive-interview-row" key={event.id}>
                <div>
                  <strong>{event.title}</strong>
                  <small>
                    {new Date(event.starts_at).toLocaleString()}
                  </small>
                  {event.location && <small>{event.location}</small>}
                </div>

                <div className="row wrap">
                  {event.meeting_url && (
                    <a
                      className="button secondary"
                      href={event.meeting_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Join
                    </a>
                  )}

                  <Link
                    className="button secondary"
                    href={`/applications/${event.application_id}`}
                  >
                    Prepare
                  </Link>
                </div>
              </article>
            ))
          ) : (
            <div className="empty-state">
              <h3>No interviews scheduled</h3>
              <p className="muted">
                Add recruiter calls and interviews from the Interview Calendar.
              </p>
            </div>
          )}
        </article>
      </section>

      <section className="card">
        <p className="eyebrow">ROUTE TOOLS</p>
        <h2>Choose your next move</h2>

        <div className="executive-action-grid">
          <Link className="executive-action-card" href="/jobs">
            <strong>Explore the opportunity map</strong>
            <span>Find and compare your strongest routes.</span>
          </Link>

          <Link className="executive-action-card" href="/applications">
            <strong>Open application tracker</strong>
            <span>Move applications from waypoint to waypoint.</span>
          </Link>

          <Link className="executive-action-card" href="/resumes">
            <strong>Build a résumé route</strong>
            <span>Create and manage role-specific versions.</span>
          </Link>

          <Link className="executive-action-card" href="/crm">
            <strong>Navigate your network</strong>
            <span>Review recruiter relationships and follow-ups.</span>
          </Link>

          <Link className="executive-action-card" href="/automation">
            <strong>Schedule route searches</strong>
            <span>Monitor fresh opportunity signals automatically.</span>
          </Link>

          <Link className="executive-action-card" href="/coach">
            <strong>Ask the navigation guide</strong>
            <span>Get guidance grounded in your saved data.</span>
          </Link>
        </div>
      </section>
    </>
  );
}
