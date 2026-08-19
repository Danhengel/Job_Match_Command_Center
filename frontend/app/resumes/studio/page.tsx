"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { EmptyState, Notice, PageHeader } from "@/components/ui";

type Profile = { id: number; name: string; target_titles?: string[] };
type Resume = {
  id: number;
  name: string;
  original_filename: string;
  is_primary: boolean;
  analysis_score: number | null;
  strengths: string[];
  gaps: string[];
  metrics_found: string[];
  analysis_summary: string;
};
type Opportunity = {
  job: {
    id: number;
    title: string;
    company: string;
    location: string;
    remote: boolean;
    posted_at?: string;
  };
  match: { score: number };
};

function readiness(score: number | null) {
  if (score === null) return { label: "Not analyzed", className: "needs-review" };
  if (score >= 85) return { label: "Ready", className: "ready" };
  if (score >= 70) return { label: "Strong base", className: "strong" };
  return { label: "Needs review", className: "needs-review" };
}

export default function ResumeStudioPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [profileId, setProfileId] = useState("");
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    api("/api/profiles")
      .then((items) => {
        if (!active) return;
        const rows = Array.isArray(items) ? items : [];
        setProfiles(rows);
        if (rows[0]) setProfileId(String(rows[0].id));
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load career profiles."))
      .finally(() => setLoading(false));
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!profileId) return;
    let active = true;
    setLoading(true);
    setError("");
    Promise.all([
      api(`/api/resumes/profile/${profileId}`),
      api(`/api/jobs/matches/${profileId}`),
    ])
      .then(([resumeItems, matchItems]) => {
        if (!active) return;
        const resumeRows = Array.isArray(resumeItems) ? resumeItems : [];
        const matchRows = Array.isArray(matchItems) ? matchItems : [];
        setResumes(resumeRows);
        setOpportunities(matchRows.slice(0, 8));
        const primary = resumeRows.find((item: Resume) => item.is_primary);
        setSelectedId(primary?.id ?? resumeRows[0]?.id ?? null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to prepare Resume Studio."))
      .finally(() => setLoading(false));
    return () => { active = false; };
  }, [profileId]);

  const selected = useMemo(() => resumes.find((item) => item.id === selectedId) ?? null, [resumes, selectedId]);
  const selectedProfile = profiles.find((item) => String(item.id) === profileId);
  const status = readiness(selected?.analysis_score ?? null);

  return (
    <>
      <PageHeader
        eyebrow="RESUME STUDIO"
        title="Tailor a résumé in a few clicks"
        description="Choose the résumé you want to use, then pick a matched opportunity. CareerNavIQ carries both selections into the tailoring workspace for you."
        actions={<Link className="button secondary" href="/resumes">Manage résumés</Link>}
      />

      {error ? <Notice title="Resume Studio needs attention" tone="error"><p>{error}</p></Notice> : null}

      <div className="studio-flow-layout">
        <section className="executive-panel studio-setup-card">
          <div className="studio-card-heading">
            <div>
              <p className="eyebrow">STEP 1</p>
              <h2>Choose your résumé</h2>
              <p className="muted">CareerNavIQ defaults to your primary résumé. Change it only when another version is a better starting point.</p>
            </div>
          </div>

          <div className="studio-select-grid">
            <label>
              <span>Career profile</span>
              <select value={profileId} onChange={(event) => setProfileId(event.target.value)}>
                {profiles.map((profile) => <option value={profile.id} key={profile.id}>{profile.name}</option>)}
              </select>
            </label>
            <label>
              <span>Source résumé</span>
              <select value={selectedId ?? ""} onChange={(event) => setSelectedId(Number(event.target.value))} disabled={!resumes.length}>
                {!resumes.length ? <option value="">No résumé available</option> : null}
                {resumes.map((resume) => (
                  <option value={resume.id} key={resume.id}>
                    {resume.name}{resume.is_primary ? " · Primary" : ""}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {loading ? <EmptyState title="Preparing your résumé" description="Loading résumé evidence and matched opportunities." /> : !selected ? (
            <EmptyState title="Add a résumé to continue" description="Upload a master résumé first, then return here to tailor it for a job." action={<Link className="button" href="/resumes">Add résumé</Link>} />
          ) : (
            <div className="studio-selected-resume">
              <div>
                <span className={`studio-readiness-chip ${status.className}`}>{status.label}</span>
                <h3>{selected.name}</h3>
                <p>{selected.analysis_summary || "This résumé is ready to use as source evidence. Review generated content before submitting."}</p>
              </div>
              <div className="studio-selected-score">
                <strong>{selected.analysis_score ?? "—"}</strong>
                <span>readiness</span>
              </div>
            </div>
          )}

          {selected ? (
            <details className="studio-evidence-details">
              <summary>Review résumé evidence</summary>
              <div className="studio-evidence-grid simplified">
                <section>
                  <h3>Strengths</h3>
                  {selected.strengths.length ? <ul>{selected.strengths.slice(0, 5).map((item) => <li key={item}>{item}</li>)}</ul> : <p className="muted">No strengths recorded yet.</p>}
                </section>
                <section>
                  <h3>Areas to verify</h3>
                  {selected.gaps.length ? <ul>{selected.gaps.slice(0, 5).map((item) => <li key={item}>{item}</li>)}</ul> : <p className="muted">No priority gaps recorded.</p>}
                </section>
              </div>
              {selected.metrics_found.length ? (
                <div className="studio-metrics-inline">
                  <strong>Impact metrics:</strong>
                  {selected.metrics_found.slice(0, 8).map((item) => <span key={item}>{item}</span>)}
                </div>
              ) : null}
            </details>
          ) : null}
        </section>

        <section className="executive-panel studio-opportunity-card">
          <div className="studio-card-heading studio-opportunity-heading">
            <div>
              <p className="eyebrow">STEP 2</p>
              <h2>Pick the job you want to tailor for</h2>
              <p className="muted">Your highest-ranked saved opportunities are shown first.</p>
            </div>
            <Link className="button secondary" href="/jobs">Search jobs</Link>
          </div>

          {loading ? <EmptyState title="Loading opportunities" description="Finding your strongest saved matches." /> : opportunities.length ? (
            <div className="studio-opportunity-list">
              {opportunities.map((item) => (
                <article className="studio-opportunity-row" key={item.job.id}>
                  <div className="studio-opportunity-score"><strong>{item.match.score}%</strong><span>match</span></div>
                  <div className="studio-opportunity-main">
                    <h3>{item.job.title}</h3>
                    <p>{item.job.company}</p>
                    <div>
                      <span>{item.job.location || "Location not listed"}</span>
                      {item.job.remote ? <span>Remote</span> : null}
                    </div>
                  </div>
                  {selectedId ? (
                    <Link className="button" href={`/jobs/${item.job.id}?profile_id=${profileId}&resume_id=${selectedId}`}>
                      Tailor for this job
                    </Link>
                  ) : <button disabled>Choose résumé first</button>}
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No matched jobs yet"
              description={`Search for opportunities for ${selectedProfile?.name || "this profile"}, then return here to tailor your résumé.`}
              action={<Link className="button" href="/jobs">Find jobs</Link>}
            />
          )}

          <div className="studio-trust-banner">
            <strong>Truth-first tailoring</strong>
            <span>CareerNavIQ uses evidence already present in your selected résumé and flags unsupported keywords for review.</span>
          </div>
        </section>
      </div>
    </>
  );
}
