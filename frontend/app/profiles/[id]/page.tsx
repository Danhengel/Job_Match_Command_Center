"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { EmptyState, ExecutivePanel, MetricStrip, Notice, PageHeader, SectionHeader } from "@/components/ui";
import { api, uploadApi } from "@/lib/api";

type P = {
  id: number;
  name: string;
  home_location: string;
  remote_preferred: boolean;
  hybrid_preferred: boolean;
  radius_miles: number;
  salary_min: number | null;
  salary_target: number | null;
  target_titles: string[];
  priority_keywords: string[];
  exclusion_keywords: string[];
  resume_count: number;
  primary_resume_id: number | null;
  completeness: number;
  best_resume_score: number;
};

type R = {
  id: number;
  name: string;
  original_filename: string;
  file_size: number;
  is_primary: boolean;
  extracted_text_preview: string;
  analysis_score: number | null;
  strengths: string[];
  gaps: string[];
  metrics_found: string[];
  analysis_summary: string;
};

type Optimization = {
  role_family: string;
  role_family_key: string;
  confidence: "high" | "medium" | "low";
  confidence_score: number;
  recommended_target_titles: string[];
  recommended_priority_keywords: string[];
  recommended_exclusion_keywords: string[];
  recommended_remote_preferred: boolean;
  recommended_hybrid_preferred: boolean;
  resume_evidence: string[];
  reasoning: string;
  search_ready: boolean;
};

type OptimizationPreview = {
  optimization: Optimization;
  source_resume: { id: number; name: string; original_filename: string; analysis_score: number | null };
  preserved_preferences: {
    profile_name: string;
    home_location: string;
    radius_miles: number;
    salary_min: number | null;
    salary_target: number | null;
  };
};

function workMode(remote: boolean, hybrid: boolean) {
  const modes = [remote ? "Remote" : "", hybrid ? "Hybrid" : ""].filter(Boolean);
  return modes.length ? modes.join(" + ") : "On-site / flexible";
}

export default function ProfileDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [p, setP] = useState<P | null>(null);
  const [resumes, setResumes] = useState<R[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [resumeName, setResumeName] = useState("Primary Resume");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);
  const [analyzing, setAnalyzing] = useState<number | null>(null);
  const [deletingProfile, setDeletingProfile] = useState(false);
  const [optimization, setOptimization] = useState<OptimizationPreview | null>(null);
  const [optimizing, setOptimizing] = useState(false);
  const [applyingOptimization, setApplyingOptimization] = useState(false);

  const load = async () => {
    const [profile, rs] = await Promise.all([api(`/api/profiles/${id}`), api(`/api/resumes/profile/${id}`)]);
    setP(profile);
    setResumes(rs);
  };

  useEffect(() => {
    void load().catch((e) => setError(e.message));
  }, [id]);

  async function upload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const fd = new FormData();
      fd.append("profile_id", id);
      fd.append("name", resumeName);
      fd.append("make_primary", "true");
      fd.append("file", file);
      await uploadApi("/api/resumes/upload", fd);
      setFile(null);
      setOptimization(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  async function analyze(rid: number) {
    setAnalyzing(rid);
    setError("");
    try {
      await api(`/api/resumes/${rid}/analyze`, { method: "POST" });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analysis failed");
    } finally {
      setAnalyzing(null);
    }
  }

  async function primary(rid: number) {
    setError("");
    await api(`/api/resumes/${rid}/primary`, { method: "POST" });
    setOptimization(null);
    await load();
  }

  async function remove(rid: number) {
    if (!confirm("Delete this résumé version?")) return;
    setError("");
    await api(`/api/resumes/${rid}`, { method: "DELETE" });
    setOptimization(null);
    await load();
  }

  async function previewOptimization() {
    setOptimizing(true);
    setError("");
    setSuccess("");
    try {
      const data = await api(`/api/profiles/${id}/optimization-preview`);
      setOptimization(data);
    } catch (err) {
      setOptimization(null);
      setError(err instanceof Error ? err.message : "Could not optimize this profile from the primary résumé.");
    } finally {
      setOptimizing(false);
    }
  }

  async function applyOptimization() {
    if (!optimization) return;
    setApplyingOptimization(true);
    setError("");
    setSuccess("");
    try {
      const data = await api(`/api/profiles/${id}/optimize-from-resume`, { method: "POST" });
      setP(data.profile);
      setOptimization(null);
      await load();
      setSuccess(
        `Profile optimized for ${data.optimization.role_family}. The primary résumé was reanalyzed and the profile is ready for a fresh market review.`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not apply profile recommendations.");
    } finally {
      setApplyingOptimization(false);
    }
  }

  async function deleteProfile() {
    if (!p) return;
    const confirmed = window.confirm(
      `Delete “${p.name}”?\n\nThis permanently removes this executive profile and its connected résumé versions, saved matches, search history, and applications. This action cannot be undone.`
    );
    if (!confirmed) return;

    setDeletingProfile(true);
    setError("");
    try {
      await api(`/api/profiles/${id}`, { method: "DELETE" });
      router.push("/profiles");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete this executive profile.");
      setDeletingProfile(false);
    }
  }

  if (!p) return <ExecutivePanel><p className="eyebrow">EXECUTIVE PROFILE</p><h2>Loading profile…</h2></ExecutivePanel>;

  const primaryResume = resumes.find((resume) => resume.is_primary) || null;

  return <>
    <PageHeader
      eyebrow="EXECUTIVE PROFILE"
      title={p.name}
      description={`${p.home_location || "Location not set"} · ${p.salary_target ? `Target $${p.salary_target.toLocaleString()}` : "Salary target not set"}`}
      actions={<Link className="button secondary" href={`/profiles/${id}/edit`}>Edit profile</Link>}
    />

    {error ? <Notice title="Profile needs attention" tone="error"><p>{error}</p></Notice> : null}
    {success ? <Notice title="Profile optimization complete" tone="success"><p>{success}</p></Notice> : null}

    <MetricStrip
      ariaLabel="Profile readiness"
      items={[
        { label: "Profile readiness", value: `${p.completeness}%`, detail: "strategy completeness" },
        { label: "Résumé versions", value: resumes.length, detail: "evidence sources" },
        { label: "Best résumé", value: p.best_resume_score || "—", detail: p.best_resume_score ? "analysis score" : "not analyzed" },
      ]}
    />

    <ExecutivePanel className="profile-optimizer-panel">
      <SectionHeader
        eyebrow="RÉSUMÉ INTELLIGENCE"
        title="Optimize this profile from the primary résumé"
        description="CareerNavIQ can identify the strongest career direction in the résumé, recommend adjacent titles and grounded keywords, remove irrelevant search paths, and reanalyze the résumé after you approve the changes."
        actions={
          <button type="button" onClick={() => void previewOptimization()} disabled={optimizing || !primaryResume}>
            {optimizing ? "Reading résumé…" : optimization ? "Refresh recommendations" : "Review recommendations"}
          </button>
        }
      />

      {!primaryResume ? (
        <Notice title="A primary résumé is required" tone="warning">
          <p>Upload a résumé below or mark an existing résumé as primary before running profile optimization.</p>
        </Notice>
      ) : !optimization ? (
        <div className="profile-optimizer-intro">
          <div><span>PRIMARY RÉSUMÉ</span><strong>{primaryResume.name}</strong><small>{primaryResume.original_filename}</small></div>
          <div><span>CURRENT MANDATE</span><strong>{p.target_titles.length || 0} target roles</strong><small>{p.priority_keywords.length || 0} priority evidence terms</small></div>
          <div><span>WORK MODE</span><strong>{workMode(p.remote_preferred, p.hybrid_preferred)}</strong><small>Location and compensation will be preserved</small></div>
        </div>
      ) : (
        <div className="profile-optimizer-review">
          <div className="profile-optimizer-summary">
            <div>
              <span className={`profile-optimizer-confidence ${optimization.optimization.confidence}`}>{optimization.optimization.confidence} confidence</span>
              <h3>{optimization.optimization.role_family}</h3>
              <p>{optimization.optimization.reasoning}</p>
            </div>
            <div className="profile-optimizer-source">
              <span>Source résumé</span>
              <strong>{optimization.source_resume.name}</strong>
              <small>{optimization.source_resume.original_filename}</small>
            </div>
          </div>

          <div className="profile-optimizer-grid">
            <div>
              <p className="eyebrow">TARGET POSITIONS</p>
              <h4>{optimization.optimization.recommended_target_titles.length} recommended roles</h4>
              <div className="profile-optimizer-tags">
                {optimization.optimization.recommended_target_titles.map((title) => <span key={title}>{title}</span>)}
              </div>
            </div>
            <div>
              <p className="eyebrow">RÉSUMÉ-GROUNDED EVIDENCE</p>
              <h4>{optimization.optimization.recommended_priority_keywords.length} priority terms</h4>
              <div className="profile-optimizer-tags evidence">
                {optimization.optimization.recommended_priority_keywords.map((keyword) => <span key={keyword}>{keyword}</span>)}
              </div>
            </div>
            <div>
              <p className="eyebrow">SEARCH EXCLUSIONS</p>
              <h4>{optimization.optimization.recommended_exclusion_keywords.length} noise filters</h4>
              <div className="profile-optimizer-tags exclusions">
                {optimization.optimization.recommended_exclusion_keywords.map((keyword) => <span key={keyword}>{keyword}</span>)}
              </div>
            </div>
          </div>

          {optimization.optimization.resume_evidence.length ? (
            <div className="profile-optimizer-evidence-line">
              <strong>Why CareerNavIQ chose this direction</strong>
              <span>{optimization.optimization.resume_evidence.join(" · ")}</span>
            </div>
          ) : null}

          <div className="profile-optimizer-preserved">
            <div><span>Location preserved</span><strong>{optimization.preserved_preferences.home_location || "Not set"}</strong></div>
            <div><span>Radius preserved</span><strong>{optimization.preserved_preferences.radius_miles || 0} miles</strong></div>
            <div><span>Compensation preserved</span><strong>{optimization.preserved_preferences.salary_target ? `$${optimization.preserved_preferences.salary_target.toLocaleString()}` : "Not set"}</strong></div>
            <div><span>Recommended work mode</span><strong>{workMode(optimization.optimization.recommended_remote_preferred, optimization.optimization.recommended_hybrid_preferred)}</strong></div>
          </div>

          {optimization.optimization.confidence === "low" ? (
            <Notice title="Review manually before changing this profile" tone="warning">
              <p>The résumé does not show one dominant career direction strongly enough for CareerNavIQ to apply recommendations automatically.</p>
            </Notice>
          ) : (
            <div className="profile-optimizer-actions">
              <button className="secondary" type="button" onClick={() => setOptimization(null)} disabled={applyingOptimization}>Cancel</button>
              <button type="button" onClick={() => void applyOptimization()} disabled={applyingOptimization}>
                {applyingOptimization ? "Applying recommendations…" : "Apply recommendations and reanalyze"}
              </button>
            </div>
          )}
        </div>
      )}
    </ExecutivePanel>

    <section className="two-col">
      <ExecutivePanel>
        <SectionHeader eyebrow="TARGET MANDATE" title="Priority roles" description="The titles CareerNavIQ uses to evaluate market alignment." />
        <div className="row wrap">
          {p.target_titles.length ? p.target_titles.map((x) => <span className="badge" key={x}>{x}</span>) : <span className="muted">No target roles defined.</span>}
        </div>
      </ExecutivePanel>
      <ExecutivePanel>
        <SectionHeader eyebrow="POSITIONING EVIDENCE" title="Priority evidence" description="Themes that should remain visible across opportunity evaluation and tailoring." />
        <p>{p.priority_keywords.join(" · ") || "No priority evidence defined."}</p>
      </ExecutivePanel>
    </section>

    <ExecutivePanel>
      <SectionHeader eyebrow="EXPERIENCE LIBRARY" title="Add a résumé version" description="Upload a private PDF, DOCX, or TXT source résumé. Maximum file size is 10 MB." />
      <form onSubmit={upload}>
        <div className="two-col">
          <div><label>Version name</label><input value={resumeName} onChange={(e) => setResumeName(e.target.value)} /></div>
          <div><label>Résumé file</label><input type="file" accept=".pdf,.docx,.txt" onChange={(e) => setFile(e.target.files?.[0] || null)} required /></div>
        </div>
        <div className="row wrap"><button disabled={busy}>{busy ? "Uploading…" : "Upload and extract"}</button></div>
      </form>
    </ExecutivePanel>

    <section>
      <SectionHeader eyebrow="EXPERIENCE LIBRARY" title="Résumé versions" description="Review analysis, evidence, and the primary source used across CareerNavIQ." />
      <div className="profile-grid">
        {resumes.map((r) => <article className="card resume-card" key={r.id}>
          <div className="row between wrap">
            <div>
              <div className="row wrap"><h3>{r.name}</h3>{r.is_primary ? <span className="badge">Primary</span> : null}</div>
              <p className="muted">{r.original_filename} · {(r.file_size / 1024).toFixed(1)} KB</p>
            </div>
            {r.analysis_score !== null ? <span className="score-pill">{r.analysis_score}/100</span> : null}
          </div>

          {r.analysis_score !== null ? <div className="analysis-grid">
            <div><h4>Strengths</h4>{r.strengths.map((x) => <div className="analysis-item good" key={x}>✓ {x}</div>)}</div>
            <div><h4>Evidence gaps</h4>{r.gaps.map((x) => <div className="analysis-item warn" key={x}>• {x}</div>)}</div>
          </div> : null}

          {r.analysis_summary ? <p className="muted">{r.analysis_summary}</p> : null}
          {r.metrics_found.length ? <div><h4>Metrics detected</h4><div className="row wrap">{r.metrics_found.map((x) => <span className="badge metric-badge" key={x}>{x}</span>)}</div></div> : null}
          <details><summary>Extracted text preview</summary><p className="muted preview">{r.extracted_text_preview}</p></details>

          <footer className="row wrap">
            <button onClick={() => analyze(r.id)} disabled={analyzing === r.id}>{analyzing === r.id ? "Analyzing…" : r.analysis_score === null ? "Analyze résumé" : "Reanalyze"}</button>
            {!r.is_primary ? <button className="secondary" onClick={() => primary(r.id)}>Make primary</button> : null}
            <button className="danger" onClick={() => remove(r.id)}>Delete</button>
          </footer>
        </article>)}
      </div>
      {!resumes.length ? <EmptyState title="No résumé versions yet" description="Upload your first résumé above to establish the evidence base for this executive profile." /> : null}
    </section>

    <ExecutivePanel className="profile-danger-zone">
      <SectionHeader
        eyebrow="PROFILE MANAGEMENT"
        title="Delete this executive profile"
        description="Use this only when the career direction is no longer needed. Deleting the profile also removes its connected résumé versions, market matches, search history, and applications."
      />
      <div className="row between wrap">
        <p className="muted">This action is permanent and cannot be undone.</p>
        <button className="danger" type="button" onClick={() => void deleteProfile()} disabled={deletingProfile}>
          {deletingProfile ? "Deleting profile…" : "Delete profile"}
        </button>
      </div>
    </ExecutivePanel>
  </>;
}
