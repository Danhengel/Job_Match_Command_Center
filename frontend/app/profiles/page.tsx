"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { EmptyState, MetricStrip, Notice, PageHeader } from "@/components/ui";
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
  const preferences = [profile.remote_preferred ? "Remote" : "", profile.hybrid_preferred ? "Hybrid" : ""].filter(Boolean);
  return preferences.length ? preferences.join(" + ") : "On-site or flexible";
}

export default function Profiles() {
  const [items, setItems] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    api("/api/profiles")
      .then((data) => { if (active) setItems(Array.isArray(data) ? data : []); })
      .catch((err) => { if (active) setError(err instanceof Error ? err.message : "Unable to load career profiles."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const summary = useMemo(() => {
    const profileCount = items.length;
    const resumeCount = items.reduce((total, profile) => total + profile.resume_count, 0);
    const averageCompleteness = profileCount ? Math.round(items.reduce((total, profile) => total + profile.completeness, 0) / profileCount) : 0;
    const strongestScore = Math.max(0, ...items.map((profile) => profile.best_resume_score || 0));
    return { profileCount, resumeCount, averageCompleteness, strongestScore };
  }, [items]);

  async function deleteProfile(profile: Profile) {
    const confirmed = window.confirm(
      `Delete “${profile.name}”? This permanently removes this career profile and its associated résumé files.`,
    );
    if (!confirmed) return;

    setDeletingId(profile.id);
    setError("");
    try {
      await api(`/api/profiles/${profile.id}`, { method: "DELETE" });
      setItems((current) => current.filter((item) => item.id !== profile.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete this career profile.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="profiles-page">
      <PageHeader
        title="Profiles"
        description="Create a clear mandate for each serious career direction, including target roles, geography, compensation, and the résumé evidence that supports it."
        actions={<Link className="button" href="/profiles/new">Create career profile</Link>}
      />

      {error ? <Notice title="Career profiles could not be loaded" tone="error"><p>{error}</p></Notice> : null}

      {!loading && items.length ? (
        <MetricStrip
          ariaLabel="Career profile summary"
          items={[
            { label: "Active profiles", value: summary.profileCount, detail: "distinct mandates" },
            { label: "Average readiness", value: `${summary.averageCompleteness}%`, detail: "profile completeness" },
            { label: "Résumé versions", value: summary.resumeCount, detail: "connected evidence" },
            { label: "Strongest résumé", value: summary.strongestScore || "—", detail: summary.strongestScore ? "analysis score" : "not analyzed yet" },
          ]}
        />
      ) : null}

      {loading ? <section className="executive-loading"><p className="eyebrow">CAREER POSITIONING</p><h2>Preparing your profiles…</h2><p className="muted">Loading mandates and résumé readiness.</p></section> : null}

      {!loading && items.length ? (
        <section className="profile-grid" aria-label="Career profiles">
          {items.map((profile) => (
            <article className="card profile-card" key={profile.id}>
              <div className="profile-card-head">
                <div className="row wrap">
                  <span className="badge">{profile.completeness}% ready</span>
                  {profile.primary_resume_id ? <span className="score-pill">Primary résumé linked</span> : null}
                </div>
                {profile.best_resume_score > 0 ? <div className="profile-score-ring" aria-label={`Best résumé score ${profile.best_resume_score}`}><strong>{profile.best_resume_score}</strong><small>score</small></div> : null}
              </div>

              <h2>{profile.name}</h2>
              <div className="profile-meta">
                <span>{profile.home_location || "Location not set"}</span>
                <span>{workStyle(profile)}</span>
                <span>{profile.resume_count} résumé version{profile.resume_count === 1 ? "" : "s"}</span>
              </div>

              <div className="progress" aria-label={`${profile.completeness}% complete`}><span style={{ width: `${Math.min(100, Math.max(0, profile.completeness))}%` }} /></div>

              <div className="profile-title-tags">
                {profile.target_titles.length ? profile.target_titles.slice(0, 4).map((title) => <span key={title}>{title}</span>) : <p className="muted">Add target titles to strengthen market selection.</p>}
              </div>

              <footer className="profile-card-footer">
                <span className="muted">Use this profile as the mandate for market reviews, positioning, and active pursuits.</span>
                <div style={{ display: "grid", gap: 8, minWidth: 170 }}>
                  <Link className="button" href={`/profiles/${profile.id}`}>Open career profile</Link>
                  <button
                    type="button"
                    className="button secondary"
                    disabled={deletingId === profile.id}
                    onClick={() => void deleteProfile(profile)}
                  >
                    {deletingId === profile.id ? "Deleting…" : "Delete profile"}
                  </button>
                </div>
              </footer>
            </article>
          ))}
        </section>
      ) : null}

      {!loading && !items.length && !error ? (
        <EmptyState
          title="Create your first career profile"
          description="Define target roles, geography, compensation, priority evidence, and your primary résumé before evaluating the market."
          action={<Link className="button" href="/profiles/new">Create career profile</Link>}
        />
      ) : null}
    </div>
  );
}
