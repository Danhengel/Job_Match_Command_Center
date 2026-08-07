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

function readiness(score: number | null) {
  if (score === null) return { label: "Not analyzed", tone: "warning" as const };
  if (score >= 85) return { label: "Application ready", tone: "success" as const };
  if (score >= 70) return { label: "Strong foundation", tone: "info" as const };
  return { label: "Needs refinement", tone: "warning" as const };
}

export default function ResumeStudioPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [profileId, setProfileId] = useState("");
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
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
    setLoading(true);
    api(`/api/resumes/profile/${profileId}`)
      .then((items) => {
        const rows = Array.isArray(items) ? items : [];
        setResumes(rows);
        const primary = rows.find((item: Resume) => item.is_primary);
        setSelectedId(primary?.id ?? rows[0]?.id ?? null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load résumés."))
      .finally(() => setLoading(false));
  }, [profileId]);

  const selected = useMemo(() => resumes.find((item) => item.id === selectedId) ?? null, [resumes, selectedId]);
  const status = readiness(selected?.analysis_score ?? null);
  const selectedProfile = profiles.find((item) => String(item.id) === profileId);

  return (
    <>
      <PageHeader
        eyebrow="PREPARE YOUR APPLICATION"
        title="Resume Studio"
        description="Choose your strongest source résumé, understand its evidence, and move directly into job-specific tailoring without inventing experience."
        actions={<Link className="button secondary" href="/resumes">Manage résumé library</Link>}
      />

      {error ? <Notice title="Resume Studio is unavailable" tone="error"><p>{error}</p></Notice> : null}

      <section className="studio-steps" aria-label="Resume tailoring workflow">
        {["Choose source résumé", "Review evidence", "Select a job", "Tailor and verify", "Export application files"].map((step, index) => (
          <div className="studio-step" key={step}><span>{index + 1}</span><strong>{step}</strong></div>
        ))}
      </section>

      <div className="resume-studio-workspace">
        <aside className="studio-panel studio-source-panel">
          <p className="eyebrow">SOURCE MATERIAL</p>
          <h2>Choose your foundation</h2>
          <label>Career profile</label>
          <select value={profileId} onChange={(event) => setProfileId(event.target.value)}>
            {profiles.map((profile) => <option value={profile.id} key={profile.id}>{profile.name}</option>)}
          </select>

          <div className="studio-resume-list">
            {resumes.map((resume) => (
              <button type="button" className={`studio-resume-option ${selectedId === resume.id ? "selected" : ""}`} onClick={() => setSelectedId(resume.id)} key={resume.id}>
                <span><strong>{resume.name}</strong><small>{resume.original_filename}</small></span>
                <b>{resume.analysis_score ?? "—"}</b>
              </button>
            ))}
          </div>

          <Link className="button secondary" href="/resumes">Upload or analyze a résumé</Link>
        </aside>

        <section className="studio-panel studio-intelligence-panel">
          {loading ? <EmptyState title="Loading résumé intelligence" description="CareerNavIQ is retrieving your résumé evidence and analysis." /> : !selected ? (
            <EmptyState title="No résumé is ready" description="Upload a master résumé before starting job-specific tailoring." action={<Link className="button" href="/resumes">Open résumé library</Link>} />
          ) : (
            <>
              <div className="studio-score-header">
                <div><p className="eyebrow">READINESS</p><h2>{selected.name}</h2><p className="muted">{selected.analysis_summary || "Run analysis to create an evidence-based readiness summary."}</p></div>
                <div className="studio-score"><strong>{selected.analysis_score ?? "—"}</strong><small>readiness</small></div>
              </div>

              <Notice title={status.label} tone={status.tone}>
                <p>{selected.analysis_score === null ? "Analyze this résumé before tailoring so CareerNavIQ can identify strengths, gaps, and measurable evidence." : "Use this score as a preparation guide, not as a hiring prediction. Verify every generated statement before submitting it."}</p>
              </Notice>

              <div className="studio-evidence-grid">
                <section><h3>Evidence to preserve</h3>{selected.strengths.length ? <ul>{selected.strengths.map((item) => <li key={item}>{item}</li>)}</ul> : <p className="muted">No strengths recorded yet.</p>}</section>
                <section><h3>Items to strengthen</h3>{selected.gaps.length ? <ul>{selected.gaps.map((item) => <li key={item}>{item}</li>)}</ul> : <p className="muted">No priority gaps recorded.</p>}</section>
              </div>

              <section className="studio-metrics"><h3>Quantified evidence detected</h3><div className="row wrap">{selected.metrics_found.length ? selected.metrics_found.map((item) => <span className="badge metric-badge" key={item}>{item}</span>) : <span className="muted">No metrics detected yet.</span>}</div></section>
            </>
          )}
        </section>

        <aside className="studio-panel studio-action-panel">
          <p className="eyebrow">NEXT ACTION</p>
          <h2>Tailor for a real opportunity</h2>
          <p className="muted">CareerNavIQ tailoring starts from a saved job and only selects or reorganizes evidence found in the chosen résumé.</p>
          <div className="studio-target-summary">
            <span>Current profile</span><strong>{selectedProfile?.name || "Select a profile"}</strong>
            <span>Target titles</span><strong>{selectedProfile?.target_titles?.slice(0, 3).join(" • ") || "Add target titles in your profile"}</strong>
          </div>
          <Link className="button" href="/jobs">Find a job to tailor</Link>
          <Link className="button secondary" href="/applications">Review application pipeline</Link>
          <p className="studio-trust-note"><strong>Truth-first generation:</strong> missing keywords are flagged for verification rather than inserted as unsupported claims.</p>
        </aside>
      </div>
    </>
  );
}
