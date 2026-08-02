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

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [digest, setDigest] = useState<DigestData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      api("/api/dashboard"),
      api("/api/automation/digest"),
    ])
      .then(([dashboardData, digestData]) => {
        setData(dashboardData);
        setDigest(digestData);
      })
      .catch((err) => {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load dashboard."
        );
      });
  }, []);

  if (error) {
    return (
      <section className="card">
        <h2>Dashboard unavailable</h2>
        <p className="error">{error}</p>
      </section>
    );
  }

  if (!data) {
    return (
      <section className="card">
        <h2>Loading dashboard…</h2>
      </section>
    );
  }

  const stageEntries = Object.entries(data.stage_counts || {});

  return (
    <>
      <section className="hero">
        <p className="eyebrow">EXECUTIVE CAREER COMMAND CENTER</p>
        <h1>Welcome, {data.user_name}</h1>
        <p className="muted">
          Search, tailor, apply, prepare, and follow up from one workspace.
        </p>
      </section>

      <section className="metrics-grid">
        <div className="metric-card">
          <span>Career profiles</span>
          <strong>{data.profile_count}</strong>
        </div>
        <div className="metric-card">
          <span>Résumé versions</span>
          <strong>{data.resume_count}</strong>
        </div>
        <div className="metric-card">
          <span>Profiles ready</span>
          <strong>{data.ready_profiles}</strong>
        </div>
        <div className="metric-card">
          <span>Applications</span>
          <strong>{data.active_applications}</strong>
        </div>
        <div className="metric-card">
          <span>Interviews</span>
          <strong>{data.interviews}</strong>
        </div>
        <div className="metric-card">
          <span>Offers</span>
          <strong>{data.offers}</strong>
        </div>
        <div className="metric-card">
          <span>Tailored résumés</span>
          <strong>{data.tailored_resume_count}</strong>
        </div>
        <div className="metric-card">
          <span>Follow-ups due</span>
          <strong>{data.followups_due}</strong>
        </div>
      </section>

      {digest && (
        <section className="card">
          <div className="row between">
            <div>
              <p className="eyebrow">DAILY DIGEST</p>
              <h2>{digest.unread_count} items need attention</h2>
              <p className="muted">
                {digest.high_matches} high matches ·{" "}
                {digest.follow_ups_due} follow-ups ·{" "}
                {digest.saved_search_updates} search updates
              </p>
            </div>
            <Link className="button" href="/notifications">
              Open notifications
            </Link>
          </div>
        </section>
      )}

      <section className="two-col">
        <section className="card">
          <h2>Application funnel</h2>
          {stageEntries.length ? (
            stageEntries.map(([stage, count]) => (
              <div className="funnel-row" key={stage}>
                <span>{stage}</span>
                <strong>{count}</strong>
              </div>
            ))
          ) : (
            <p className="muted">
              Save a job to begin tracking your application pipeline.
            </p>
          )}
          <Link className="button secondary" href="/applications">
            Manage pipeline
          </Link>
        </section>

        <section className="card">
          <h2>Quick actions</h2>
          <div className="action-grid">
            <Link className="button" href="/jobs">
              Find opportunities
            </Link>
            <Link className="button secondary" href="/applications">
              Manage applications
            </Link>
            <Link className="button secondary" href="/resumes">
              Résumé library
            </Link>
            <Link className="button secondary" href="/profiles">
              Career profiles
            </Link>
            <Link className="button secondary" href="/automation">
              Saved searches
            </Link>
            <Link className="button secondary" href="/coach">
              Career coach
            </Link>
          </div>
        </section>
      </section>
    </>
  );
}
