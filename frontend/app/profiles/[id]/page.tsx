"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EmptyState, ExecutivePanel, MetricStrip, Notice, PageHeader, SectionHeader } from "@/components/ui";
import { api, uploadApi } from "@/lib/api";

type P = { id:number; name:string; home_location:string; salary_target:number|null; target_titles:string[]; priority_keywords:string[]; resume_count:number; completeness:number; best_resume_score:number };
type R = { id:number; name:string; original_filename:string; file_size:number; is_primary:boolean; extracted_text_preview:string; analysis_score:number|null; strengths:string[]; gaps:string[]; metrics_found:string[]; analysis_summary:string };

export default function ProfileDetail({ params }: { params: Promise<{ id:string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [p, setP] = useState<P | null>(null);
  const [resumes, setResumes] = useState<R[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [resumeName, setResumeName] = useState("Primary Resume");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [analyzing, setAnalyzing] = useState<number | null>(null);
  const [deletingProfile, setDeletingProfile] = useState(false);

  const load = async () => {
    const [profile, rs] = await Promise.all([api(`/api/profiles/${id}`), api(`/api/resumes/profile/${id}`)]);
    setP(profile);
    setResumes(rs);
  };

  useEffect(() => { void load().catch((e) => setError(e.message)); }, [id]);

  async function upload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("profile_id", id);
      fd.append("name", resumeName);
      fd.append("make_primary", "true");
      fd.append("file", file);
      await uploadApi("/api/resumes/upload", fd);
      setFile(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  async function analyze(rid: number) {
    setAnalyzing(rid);
    try { await api(`/api/resumes/${rid}/analyze`, { method: "POST" }); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : "Analysis failed"); }
    finally { setAnalyzing(null); }
  }

  async function primary(rid: number) { await api(`/api/resumes/${rid}/primary`, { method: "POST" }); await load(); }
  async function remove(rid: number) { if (!confirm("Delete this résumé version?")) return; await api(`/api/resumes/${rid}`, { method: "DELETE" }); await load(); }

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

  return <>
    <PageHeader
      eyebrow="EXECUTIVE PROFILE"
      title={p.name}
      description={`${p.home_location || "Location not set"} · ${p.salary_target ? `Target $${p.salary_target.toLocaleString()}` : "Salary target not set"}`}
      actions={<Link className="button secondary" href={`/profiles/${id}/edit`}>Edit profile</Link>}
    />

    {error ? <Notice title="Profile needs attention" tone="error"><p>{error}</p></Notice> : null}

    <MetricStrip
      ariaLabel="Profile readiness"
      items={[
        { label: "Profile readiness", value: `${p.completeness}%`, detail: "strategy completeness" },
        { label: "Résumé versions", value: resumes.length, detail: "evidence sources" },
        { label: "Best résumé", value: p.best_resume_score || "—", detail: p.best_resume_score ? "analysis score" : "not analyzed" },
      ]}
    />

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
