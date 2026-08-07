"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { EmptyState, Notice, PageHeader } from "@/components/ui";
import { api } from "@/lib/api";

type Profile = {
  id: number;
  name: string;
  home_location: string;
  remote_preferred: boolean;
  hybrid_preferred: boolean;
  target_titles: string[];
  resume_count: number;
  primary_resume_id: number | null;
  completeness: number;
  best_resume_score: number;
};

function workStyle(profile: Profile) {
  const preferences = [
    profile.remote_preferred ? "Remote" : "",
    profile.hybrid_preferred ? "Hybrid" : "",
  ].filter(Boolean);

  return preferences.length ? preferences.join(" + ") : "On-site or flexible";
}

export default function Profiles() {
  const [items, setItems] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    api("/api/profiles")
      .then((data) => {
        if (active) setItems(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : "Unable to load career profiles.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const summary = useMemo(() => {
    const profileCount = items.length;
    const resumeCount = items.reduce((total, profile) => total + profile.resume_count, 0);
    const averageCompleteness = profileCount
      ? Math.round(items.reduce((total, profile) => total + profile.completeness, 0) / profileCount)
      : 0;
    const strongestScore = Math.max(0, ...items.map((profile) => profile.best_resume_score || 0));

    return { profileCount, resumeCount, averageCompleteness, strongestScore };
  }, [items]);

  return (
    <>
      <PageHeader
        eyebrow="CAREER STRATEGY"
        title="Career profiles"
        description="Create a focused search strategy for every career direction, with its own titles, location preferences, and résumé evidence."
        actions={<Link className="button" href="/profiles/new">Create profile</Link>}
      />

      {error ? (
        <Notice title="Career profiles could not be loaded" tone="error">
          <p>{error}</p>
        </Notice>
      ) : null}

      {!loading && items.length ? (
        <section className="profile-summary-grid" aria-label="Career profile summary">
          <article className="profile-summary-card">
            <span>Career paths</span>
            <strong>{summary.profileCount}</strong>
            <small>focused profiles</small>
          </article>
          <article className="profile-summary-card">
            <span>Average readiness</span>
            <strong>{summary.averageCompleteness}%</strong>
            <small>profile completeness</small>
          </article>
          <article className="profile-summary-card">
            <span>Résumé versions</span>
            <strong>{summary.resumeCount}</strong>
            <small>connected to profiles</small>
          </article>
          <article className="profile-summary-card">
            <span>Strongest résumé</span>
            <strong>{summary.strongestScore || "—"}</strong>
            <small>{summary.strongestScore ? "analysis score" : "not analyzed yet"}</small>
          </article>
        </section>
      ) : null}

      {loading ? (
        <section className="card profile-loading-state">
          <p className="eyebrow">LOADING</p>
          <h2>Building your career strategy workspace…</h2>
          <p className="muted">CareerNavIQ is loading your profiles and résumé readiness.</p>
        </section>
      ) : null}

      {!loading && items.length ? (
        <section className="profile-grid" aria-label="Career profiles">
          {items.map((profile) => (
            <article className="card profile-card" key={profile.id}>
              <div className="profile-card-head">
                <div className="row wrap">
                  <span className="badge">{profile.completeness}% ready</span>
                  {profile.primary_resume_id ? <span className="score-pill">Primary résumé linked</span> : null}
                </div>
                {profile.best_resume_score > 0 ? (
                  <div className="profile-score-ring" aria-label={`Best résumé score ${profile.best_resume_score}`}>
                    <strong>{profile.best_resume_score}</strong>
                    <small>score</small>
                  </div>
                ) : null}
              </div>

              <h2>{profile.name}</h2>
              <div className="profile-meta">
                <span>{profile.home_location || "Location not set"}</span>
                <span>{workStyle(profile)}</span>
                <span>{profile.resume_count} résumé version{profile.resume_count === 1 ? "" : "s"}</span>
              </div>

              <div className="progress" aria-label={`${profile.completeness}% complete`}>
                <span style={{ width: `${Math.min(100, Math.max(0, profile.completeness))}%` }} />
              </div>

              <div className="profile-title-tags">
                {profile.target_titles.length ? (
                  profile.target_titles.slice(0, 4).map((title) => <span key={title}>{title}</span>)
                ) : (
                  <p className="muted">Add target titles to strengthen opportunity selection.</p>
                )}
              </div>

              <footer className="profile-card-footer">
                <span className="muted">Use this profile for searches, résumés, and applications.</span>
                <Link className="button secondary" href={`/profiles/${profile.id}`}>Open profile</Link>
              </footer>
            </article>
          ))}
        </section>
      ) : null}

      {!loading && !items.length && !error ? (
        <EmptyState
          title="Create your first career profile"
          description="Add target titles, location preferences, priority keywords, and your primary résumé to begin receiving stronger-fit recommendations."
          action={<Link className="button" href="/profiles/new">Create career profile</Link>}
        />
      ) : null}
    </>
  );
}
