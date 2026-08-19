"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { ExecutivePanel, Notice, PageHeader, SectionHeader } from "@/components/ui";
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

function tailoredResumeFilename(company: string, title: string, extension: "txt" | "docx" | "pdf") {
  return [safeFilenamePart(company), safeFilenamePart(title), "Tailored_Resume"].join("_") + `.${extension}`;
}

export default function JobWorkspace() {
  const params = useParams<{id:string}>();
  const search = useSearchParams();
  const profileId = search.get("profile_id") || "";
  const requestedResumeId = search.get("resume_id") || "";
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
    setResumeId((current) => {
      const requested = result.resumes.find((item: Resume) => String(item.id) === requestedResumeId);
      const existing = result.resumes.find((item: Resume) => String(item.id) === current);
      const primary = result.resumes.find((item: Resume) => item.is_primary);
      return String(requested?.id ?? existing?.id ?? primary?.id ?? result.resumes[0]?.id ?? "");
    });
    if (result.versions[0]) setActive(result.versions[0]);
  }

  useEffect(() => {
    if (profileId) load().catch((e) => setError(e instanceof Error ? e.message : "Unable to load opportunity."));
  }, [jobId, profileId, requestedResumeId]);

  async function generate() {
    if (!data) return;
    const job = data.job;
    setBusy(true);
    setError("");
    try {
      const item = await api("/api/tailoring/generate", {
        method:"POST",
        body:JSON.stringify({
          profile_id:Number(profileId),
          job_id:Number(jobId),
          resume_id:Number(resumeId),
          version_name:versionName || undefined,
        }),
      });
      setActive(item);
      await load();
      try {
        await downloadApi(
          `/api/tailoring/${item.id}/download.docx`,
          tailoredResumeFilename(job.company, job.title, "docx"),
        );
      } catch {
        setError("Your tailored résumé was created, but the automatic Word download was blocked. Use Download Word below.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Tailoring failed");
    } finally {
      setBusy(false);
    }
  }

  async function cover() {
    if (!active) return;
    setBusy(true);
    setError("");
    try {
      const item = await api(`/api/tailoring/${active.id}/cover-letter`, {
        method:"POST",
        body:JSON.stringify({ tone:"professional" }),
      });
      setActive(item);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Cover letter failed");
    } finally {
      setBusy(false);
    }
  }

  async function saveApplication(status = "wishlist") {
    setBusy(true);
    setError("");
    try {
      const item = await api("/api/applications", {
        method:"POST",
        body:JSON.stringify({
          profile_id:Number(profileId),
          job_id:Number(jobId),
          tailoring_id:active?.id || undefined,
          status,
        }),
      });
      setApplicationId(item.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Application save failed");
    } finally {
      setBusy(false);
    }
  }

  async function copy(text:string) {
    await navigator.clipboard.writeText(text);
  }

  if (!profileId) {
    return <ExecutivePanel><p className="eyebrow">OPPORTUNITY</p><h2>Choose a career profile first</h2><p className="muted">Return to job search and open this opportunity from a selected profile.</p><Link className="button" href="/jobs">Back to job search</Link></ExecutivePanel>;
  }
  if (!data) {
    return <ExecutivePanel><p className="eyebrow">OPPORTUNITY</p><h2>Loading opportunity…</h2>{error ? <p className="error">{error}</p> : null}</ExecutivePanel>;
  }

  const selectedResume = data.resumes.find((item) => String(item.id) === resumeId);

  return <>
    <PageHeader
      eyebrow="OPPORTUNITY"
      title={data.job.title}
      description={`${data.job.company} · ${data.job.location || "Location not listed"}`}
      actions={<div className="row wrap">
        <a className="button secondary" href={data.job.url} target="_blank" rel="noreferrer">Original posting</a>
        <button className="secondary" onClick={() => saveApplication("wishlist")} disabled={busy}>Save job</button>
        {applicationId ? <Link className="button secondary" href={`/applications/${applicationId}`}>Open application</Link> : null}
      </div>}
    />

    {error ? <Notice title="Needs attention" tone="error"><p>{error}</p></Notice> : null}

    <section className="tailor-simple-steps" aria-label="Tailoring steps">
      <div className="tailor-simple-step complete"><span>1</span><strong>Job selected</strong></div>
      <div className="tailor-simple-step active"><span>2</span><strong>Choose résumé</strong></div>
      <div className="tailor-simple-step"><span>3</span><strong>Tailor & download</strong></div>
    </section>

    <section className="tailor-quick-grid">
      <ExecutivePanel className="tailor-primary-panel">
        <p className="eyebrow">TAILOR RESUME</p>
        <h2>Create the version for this job</h2>
        <p className="muted">Choose your source résumé. CareerNavIQ will use only supported evidence from that résumé and automatically download the Word version when it is ready.</p>

        <label>Source résumé</label>
        <select value={resumeId} onChange={(e) => setResumeId(e.target.value)}>
          {data.resumes.map((resume) => (
            <option key={resume.id} value={resume.id}>
              {resume.name}{resume.is_primary ? " · Primary" : ""}{resume.analysis_score !== null ? ` · ${resume.analysis_score} readiness` : ""}
            </option>
          ))}
        </select>

        {selectedResume ? (
          <div className="tailor-selected-resume">
            <span>Using</span>
            <strong>{selectedResume.name}</strong>
            <small>{selectedResume.is_primary ? "Primary résumé" : "Selected résumé"}</small>
          </div>
        ) : null}

        <details className="tailor-optional-details">
          <summary>Optional: name this version</summary>
          <label>Version name</label>
          <input value={versionName} onChange={(e) => setVersionName(e.target.value)} placeholder={`${data.job.company} - ${data.job.title}`} />
        </details>

        <button className="tailor-main-action" disabled={busy || !resumeId} onClick={generate}>
          {busy ? "Creating your tailored résumé…" : "Tailor résumé & download Word"}
        </button>
        <p className="tailor-trust-copy">You will be able to review the generated version before submitting it anywhere.</p>
      </ExecutivePanel>

      <ExecutivePanel className="tailor-fit-panel">
        <div className="tailor-fit-score">
          <strong>{data.match ? `${data.match.score}%` : "—"}</strong>
          <span>overall match</span>
        </div>
        <h2>Quick fit check</h2>
        <p>{data.match?.explanation || "No saved alignment analysis is available for this opportunity."}</p>
        {data.match?.matched_keywords?.length ? (
          <div className="tailor-keyword-strip">
            {data.match.matched_keywords.slice(0, 6).map((keyword) => <span key={keyword}>{keyword}</span>)}
          </div>
        ) : null}
        {data.job.salary ? <p className="tailor-salary"><strong>Compensation:</strong> {data.job.salary}</p> : null}
        <details className="tailor-analysis-details">
          <summary>See full fit analysis</summary>
          {data.match ? <>
            <div className="score-bars">
              <span>Title <b>{data.match.title_score}</b></span>
              <span>Keywords <b>{data.match.keyword_score}</b></span>
              <span>Location <b>{data.match.location_score}</b></span>
              <span>Résumé <b>{data.match.resume_score}</b></span>
            </div>
            {data.match.concerns.length ? <p className="warn-text"><strong>Review:</strong> {data.match.concerns.join(" · ")}</p> : null}
          </> : null}
        </details>
      </ExecutivePanel>
    </section>

    <details className="executive-panel tailor-job-description">
      <summary>View job description</summary>
      <div className="job-description">{data.job.description || "No description was returned by the provider."}</div>
    </details>

    {data.versions.length ? (
      <details className="executive-panel tailor-saved-versions">
        <summary>Previously tailored versions ({data.versions.length})</summary>
        <div className="studio-resume-list">
          {data.versions.map((version) => (
            <button className="version-button studio-resume-option" key={version.id} onClick={() => setActive(version)}>
              <span><strong>{version.version_name}</strong><small>{new Date(version.created_at).toLocaleDateString()}</small></span>
              <b>{version.ats_score}</b>
            </button>
          ))}
        </div>
      </details>
    ) : null}

    {active ? (
      <ExecutivePanel className="tailoring-output tailor-output-simplified">
        <div className="tailor-output-heading">
          <div>
            <p className="eyebrow">YOUR TAILORED VERSION</p>
            <h2>{active.version_name}</h2>
            <p className="muted">ATS preparation score {active.ats_score}. Review the content below before submitting.</p>
          </div>
          <div className="tailor-output-actions">
            <button onClick={() => downloadApi(`/api/tailoring/${active.id}/download.docx`, tailoredResumeFilename(data.job.company, data.job.title, "docx"))}>Download Word</button>
            <button className="secondary" onClick={() => downloadApi(`/api/tailoring/${active.id}/download.pdf`, tailoredResumeFilename(data.job.company, data.job.title, "pdf"))}>PDF</button>
          </div>
        </div>

        <h3>Professional summary</h3>
        <p>{active.professional_summary}</p>

        <h3>Selected evidence</h3>
        {active.selected_evidence.map((item, index) => <p key={index}>• {item}</p>)}

        {active.missing_keywords.length ? <>
          <h3>Keywords to verify</h3>
          <div className="row wrap">{active.missing_keywords.map((item) => <span className="badge warning-badge" key={item}>{item}</span>)}</div>
        </> : null}

        <div className="tailor-secondary-actions">
          <button className="secondary" onClick={() => copy(active.tailored_text)}>Copy résumé text</button>
          <button className="secondary" onClick={cover}>{active.cover_letter ? "Regenerate cover letter" : "Create cover letter"}</button>
          <button className="secondary" onClick={() => downloadApi(`/api/tailoring/${active.id}/download.txt`, tailoredResumeFilename(data.job.company, data.job.title, "txt"))}>TXT</button>
          <button className="secondary" onClick={() => saveApplication("applied")} disabled={busy}>Mark applied</button>
        </div>

        {active.cover_letter ? <>
          <h3>Cover letter</h3>
          <div className="letter-preview">{active.cover_letter}</div>
          <button className="secondary" onClick={() => copy(active.cover_letter)}>Copy cover letter</button>
        </> : null}
      </ExecutivePanel>
    ) : null}
  </>;
}
