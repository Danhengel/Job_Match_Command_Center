"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { ExecutivePanel, MetricStrip, Notice, PageHeader, SectionHeader } from "@/components/ui";
import { api, downloadApi } from "@/lib/api";

type Resume = { id:number; name:string; is_primary:boolean; analysis_score:number|null };
type Version = { id:number; version_name:string; ats_score:number; professional_summary:string; tailored_text:string; selected_evidence:string[]; matched_keywords:string[]; missing_keywords:string[]; recommendations:string[]; cover_letter:string; created_at:string };
type Workspace = {
  profile:{ id:number; name:string; priority_keywords:string[] };
  job:{ id:number; title:string; company:string; location:string; description:string; url:string; salary:string; source:string; remote:boolean };
  match:null|{ score:number; title_score:number; keyword_score:number; location_score:number; resume_score:number; matched_keywords:string[]; missing_keywords:string[]; concerns:string[]; explanation:string };
  resumes:Resume[];
  versions:Version[];
};

function safeFilenamePart(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9.-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80) || "Resume";
}

function tailoredResumeFilename(
  company: string,
  title: string,
  extension: "txt" | "docx" | "pdf",
) {
  return [
    safeFilenamePart(company),
    safeFilenamePart(title),
    "Tailored_Resume",
  ].join("_") + `.${extension}`;
}

export default function JobWorkspace() {
  const params = useParams<{id:string}>();
  const search = useSearchParams();
  const profileId = search.get("profile_id") || "";
  const [data, setData] = useState<Workspace | null>(null);
  const [resumeId, setResumeId] = useState("");
  const [versionName, setVersionName] = useState("");
  const [active, setActive] = useState<Version | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [applicationId, setApplicationId] = useState<number | null>(null);
  const jobId = params.id;

  async function load() {
    const result = await api(`/api/tailoring/job/${jobId}?profile_id=${profileId}`);
    setData(result);
    if (result.resumes[0] && !resumeId) setResumeId(String(result.resumes[0].id));
    if (result.versions[0]) setActive(result.versions[0]);
  }

  useEffect(() => { if (profileId) load().catch((e) => setError(e.message)); }, [jobId, profileId]);

  async function generate() {
    if (!data) return;
    const job = data.job;
    setBusy(true); setError("");
    try {
      const item = await api("/api/tailoring/generate", { method:"POST", body:JSON.stringify({ profile_id:Number(profileId), job_id:Number(jobId), resume_id:Number(resumeId), version_name:versionName || undefined }) });
      setActive(item);
      await load();
      try {
        await downloadApi(
          `/api/tailoring/${item.id}/download.docx`,
          tailoredResumeFilename(job.company, job.title, "docx"),
        );
      } catch {
        setError(
          "The tailored résumé was saved, but the automatic Word download was blocked. Use the DOCX button below to download it.",
        );
      }
    } catch (e) { setError(e instanceof Error ? e.message : "Tailoring failed"); }
    finally { setBusy(false); }
  }

  async function cover() {
    if (!active) return;
    setBusy(true); setError("");
    try {
      const item = await api(`/api/tailoring/${active.id}/cover-letter`, { method:"POST", body:JSON.stringify({ tone:"professional" }) });
      setActive(item); await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Cover letter failed"); }
    finally { setBusy(false); }
  }

  async function saveApplication(status = "wishlist") {
    setBusy(true); setError("");
    try {
      const item = await api("/api/applications", { method:"POST", body:JSON.stringify({ profile_id:Number(profileId), job_id:Number(jobId), tailoring_id:active?.id || undefined, status }) });
      setApplicationId(item.id);
    } catch (e) { setError(e instanceof Error ? e.message : "Application save failed"); }
    finally { setBusy(false); }
  }

  async function copy(text:string) { await navigator.clipboard.writeText(text); }

  if (!profileId) return <ExecutivePanel><p className="eyebrow">MARKET INTELLIGENCE</p><h2>Career profile required</h2><p className="muted">Open this opportunity from Market Intelligence with a career profile selected.</p><Link className="button" href="/jobs">Return to Market Intelligence</Link></ExecutivePanel>;
  if (!data) return <ExecutivePanel><p className="eyebrow">OPPORTUNITY REVIEW</p><h2>Loading opportunity workspace…</h2>{error ? <p className="error">{error}</p> : null}</ExecutivePanel>;

  return <>
    <PageHeader
      eyebrow="OPPORTUNITY REVIEW"
      title={data.job.title}
      description={`${data.job.company} · ${data.job.location || "Location not listed"} · ${data.job.source}`}
      actions={<div className="row wrap">
        <a className="button secondary" href={data.job.url} target="_blank" rel="noreferrer">Original posting</a>
        <button onClick={() => saveApplication("wishlist")} disabled={busy}>Add to portfolio</button>
        <button onClick={() => saveApplication("applied")} disabled={busy}>Mark applied</button>
        {applicationId ? <Link className="button secondary" href={`/applications/${applicationId}`}>Open application</Link> : null}
      </div>}
    />

    {error ? <Notice title="Opportunity workspace needs attention" tone="error"><p>{error}</p></Notice> : null}

    <MetricStrip
      ariaLabel="Opportunity alignment"
      items={[
        { label:"Overall alignment", value:data.match ? `${data.match.score}%` : "—", detail:data.match ? "evidence-based fit" : "not scored" },
        { label:"Title alignment", value:data.match ? `${data.match.title_score}%` : "—", detail:"role-title relevance" },
        { label:"Résumé alignment", value:data.match ? `${data.match.resume_score}%` : "—", detail:"source evidence" },
        { label:"Compensation", value:data.job.salary || "—", detail:data.job.salary ? "listed by source" : "not listed" },
      ]}
    />

    <section className="two-col tailor-layout">
      <div className="executive-column-stack">
        <ExecutivePanel>
          <SectionHeader eyebrow="FIT ANALYSIS" title="Alignment analysis" description="Use this as a decision aid, not as a hiring prediction." />
          {data.match ? <>
            <p>{data.match.explanation}</p>
            <div className="score-bars"><span>Title <b>{data.match.title_score}</b></span><span>Keywords <b>{data.match.keyword_score}</b></span><span>Location <b>{data.match.location_score}</b></span><span>Résumé <b>{data.match.resume_score}</b></span></div>
            <p><strong>Aligned evidence:</strong> {data.match.matched_keywords.join(" · ") || "None"}</p>
            <p className="warn-text"><strong>Review:</strong> {data.match.concerns.join(" · ") || "No flags"}</p>
          </> : <p className="muted">No saved alignment score is available.</p>}
        </ExecutivePanel>

        <ExecutivePanel>
          <SectionHeader eyebrow="SOURCE MATERIAL" title="Job description" description="The source description CareerNavIQ uses for comparison and positioning." />
          <div className="job-description">{data.job.description || "No description was returned by the provider."}</div>
        </ExecutivePanel>
      </div>

      <div className="executive-column-stack">
        <ExecutivePanel>
          <SectionHeader eyebrow="POSITIONING" title="Create an evidence-based résumé version" description="CareerNavIQ selects and reorganizes evidence from your uploaded résumé; verify every statement before use." />
          <label>Source résumé</label>
          <select value={resumeId} onChange={(e) => setResumeId(e.target.value)}>{data.resumes.map((r) => <option key={r.id} value={r.id}>{r.name}{r.is_primary ? " · Primary" : ""}</option>)}</select>
          <label>Version name</label>
          <input value={versionName} onChange={(e) => setVersionName(e.target.value)} placeholder={`${data.job.company} - ${data.job.title}`} />
          <button disabled={busy || !resumeId} onClick={generate}>{busy ? "Working…" : "Tailor résumé"}</button>
        </ExecutivePanel>

        <ExecutivePanel>
          <SectionHeader eyebrow="SAVED POSITIONING" title="Résumé versions" description="Previously generated versions for this opportunity." />
          <div className="studio-resume-list">
            {data.versions.map((v) => <button className="version-button studio-resume-option" key={v.id} onClick={() => setActive(v)}><span><strong>{v.version_name}</strong><small>{new Date(v.created_at).toLocaleDateString()}</small></span><b>{v.ats_score}</b></button>)}
          </div>
          {!data.versions.length ? <p className="muted">No tailored versions yet.</p> : null}
        </ExecutivePanel>
      </div>
    </section>

    {active ? <ExecutivePanel className="tailoring-output">
      <SectionHeader eyebrow="POSITIONING VERSION" title={active.version_name} description={`ATS preparation score ${active.ats_score}. Verify every statement before submitting.`} />
      <h3>Professional summary</h3><p>{active.professional_summary}</p>
      <h3>Selected evidence</h3>{active.selected_evidence.map((x, i) => <p key={i}>• {x}</p>)}
      <h3>Aligned evidence terms</h3><div className="row wrap">{active.matched_keywords.map((x) => <span className="badge" key={x}>{x}</span>)}</div>
      <h3>Keywords requiring verification</h3><div className="row wrap">{active.missing_keywords.map((x) => <span className="badge warning-badge" key={x}>{x}</span>)}</div>
      <h3>Recommendations</h3>{active.recommendations.map((x, i) => <p key={i}>• {x}</p>)}
      <div className="row wrap">
        <button onClick={() => copy(active.tailored_text)}>Copy résumé draft</button>
        <button className="secondary" onClick={cover}>{active.cover_letter ? "Regenerate cover letter" : "Generate cover letter"}</button>
        <button className="secondary" onClick={() => downloadApi(`/api/tailoring/${active.id}/download.txt`, tailoredResumeFilename(data.job.company, data.job.title, "txt"))}>TXT</button>
        <button className="secondary" onClick={() => downloadApi(`/api/tailoring/${active.id}/download.docx`, tailoredResumeFilename(data.job.company, data.job.title, "docx"))}>DOCX</button>
        <button className="secondary" onClick={() => downloadApi(`/api/tailoring/${active.id}/download.pdf`, tailoredResumeFilename(data.job.company, data.job.title, "pdf"))}>PDF</button>
      </div>
      {active.cover_letter ? <><h3>Cover letter</h3><div className="letter-preview">{active.cover_letter}</div><button onClick={() => copy(active.cover_letter)}>Copy cover letter</button></> : null}
    </ExecutivePanel> : null}
  </>;
}
