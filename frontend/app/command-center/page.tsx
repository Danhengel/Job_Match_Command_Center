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
  { key: "wishlist", label: "Watchlist" },
  { key: "applied", label: "Applied" },
  { key: "recruiter", label: "Recruiter" },
  { key: "interview", label: "Interview" },
  { key: "final", label: "Final stage" },
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
          : "Unable to load the executive briefing."
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
        <h1>Executive briefing unavailable</h1>
        <p className="error">{error}</p>
        <button onClick={loadDashboard}>Try again</button>
      </section>
    );
  }

  if (!data) {
    return (
      <section className="card">
        <h2>Preparing your executive briefing…</h2>
      </section>
    );
  }

  const metrics = data.metrics;

  return (
    <div className="executive-command-center">
      <section className="executive-hero">
        <div>
          <p className="eyebrow">EXECUTIVE BRIEFING</p>
          <h1>Your career position at a glance</h1>
          <p className="muted">
            A decision-ready view of your opportunity pipeline, market alignment,
            relationships, interviews, and the actions that deserve attention now.
          </p>
        </div>

        <div className="row wrap">
          <button onClick={loadDashboard} disabled={refreshing}>
            {refreshing ? "Refreshing…" : "Refresh briefing"}
          </button>

          <Link className="button secondary" href="/jobs">
            Review opportunities
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
          <span>Opportunity universe</span>
          <strong>{metrics.total_matches}</strong>
          <small>{metrics.high_matches} high-conviction matches</small>
        </article>

        <article className="executive-metric-card">
          <span>Active pipeline</span>
          <strong>{metrics.active_applications}</strong>
          <small>{metrics.applications} total opportunities tracked</small>
        </article>

        <article className="executive-metric-card">
          <span>Scheduled conversations</span>
          <strong>{metrics.interviews}</strong>
          <small>Recruiter calls and interviews ahead</small>
        </article>

        <article className="executive-metric-card">
          <span>Offers and decisions</span>
          <strong>{metrics.offers}</strong>
          <small>Offer and accepted stages</small>
        </article>

        <article className="executive-metric-card">
          <span>Average alignment</span>
          <strong>{metrics.average_match}%</strong>
          <small>Across scored opportunities</small>
        </article>

        <article className="executive-metric-card">
          <span>Role-specific résumés</span>
          <strong>{metrics.tailored_resumes}</strong>
          <small>Saved position-specific versions</small>
        </article>

        <article className="executive-metric-card">
          <span>Key relationships</span>
          <strong>{metrics.recruiters}</strong>
          <small>Recruiter and hiring relationships</small>
        </article>

        <article className="executive-metric-card">
          <span>Unread intelligence</span>
          <strong>{metrics.unread_notifications}</strong>
          <small>Market signals, updates, and follow-ups</small>
        </article>
      </section>

      <section className="command-layout">
        <article className="card command-priorities">
          <div className="row between">
            <div>
              <p className="eyebrow">PRIORITIES</p>
              <h2>Decisions requiring attention</h2>
            </div>

            <Link className="button secondary" href="/notifications">
              Review updates
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
              <h3>No immediate decisions</h3>
              <p className="muted">
                High-priority follow-ups, interviews, and opportunity decisions will appear here.
              </p>
            </div>
          )}
        </article>

        <article className="card">
          <p className="eyebrow">PERFORMANCE SIGNALS</p>
          <h2>Momentum and conversion</h2>

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
                {insight}
              </p>
            ))
          ) : (
            <p className="muted">
              Progress opportunities through the pipeline to surface stronger performance signals.
            </p>
          )}
        </article>
      </section>

      <section className="card">
        <div className="row between">
          <div>
            <p className="eyebrow">PIPELINE POSITION</p>
            <h2>Opportunity pipeline</h2>
          </div>

          <Link className="button secondary" href="/applications">
            Open pipeline
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
              <p className="eyebrow">TOP OPPORTUNITIES</p>
              <h2>Highest-conviction opportunities</h2>
            </div>

            <Link className="button secondary" href="/jobs">
              Review market
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
              Add market targets to surface the opportunities with the strongest fit.
            </p>
          )}
        </article>

        <article className="card">
          <div className="row between">
            <div>
              <p className="eyebrow">UPCOMING CONVERSATIONS</p>
              <h2>Interview agenda</h2>
            </div>

            <Link className="button secondary" href="/interviews">
              Open interview center
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
                Recruiter calls and interviews will appear here as they enter your calendar.
              </p>
            </div>
          )}
        </article>
      </section>

      <section className="card">
        <p className="eyebrow">ADVISORY DESK</p>
        <h2>Choose the next executive action</h2>

        <div className="executive-action-grid">
          <Link className="executive-action-card" href="/jobs">
            <strong>Review opportunity intelligence</strong>
            <span>Compare the roles and organizations with the strongest strategic fit.</span>
          </Link>

          <Link className="executive-action-card" href="/applications">
            <strong>Manage the opportunity pipeline</strong>
            <span>Advance active pursuits and identify stalled decision points.</span>
          </Link>

          <Link className="executive-action-card" href="/resumes">
            <strong>Refine executive positioning</strong>
            <span>Maintain role-specific résumé versions and evidence.</span>
          </Link>

          <Link className="executive-action-card" href="/crm">
            <strong>Strengthen key relationships</strong>
            <span>Review recruiters, hiring contacts, and follow-up commitments.</span>
          </Link>

          <Link className="executive-action-card" href="/automation">
            <strong>Manage market monitoring</strong>
            <span>Keep high-value opportunity searches and alerts working automatically.</span>
          </Link>

          <Link className="executive-action-card" href="/coach">
            <strong>Open strategic guidance</strong>
            <span>Get recommendations grounded in your saved career and market data.</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
