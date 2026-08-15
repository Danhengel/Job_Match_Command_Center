"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { Notice, PageHeader, SectionHeader } from "@/components/ui";
import { api, downloadApi, uploadApi } from "@/lib/api";

type Profile = { id: number; name: string };
type Resume = {
  id: number;
  profile_id: number;
  name: string;
  original_filename: string;
  mime_type: string;
  file_size: number;
  is_primary: boolean;
  extracted_text_preview: string;
  analysis_score: number | null;
  strengths: string[];
  gaps: string[];
  metrics_found: string[];
  analysis_summary: string;
  analyzed_at: string | null;
};

export default function ResumesPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [profileId, setProfileId] = useState("");
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [resumeName, setResumeName] = useState("");
  const [makePrimary, setMakePrimary] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [loadingResumes, setLoadingResumes] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [workingId, setWorkingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const selectedResume = useMemo(() => resumes.find((resume) => resume.id === selectedId) ?? null, [resumes, selectedId]);

  async function loadProfiles() {
    setLoadingProfiles(true);
    setError("");
    try {
      const data = await api("/api/profiles");
      const loadedProfiles = Array.isArray(data) ? data : [];
      setProfiles(loadedProfiles);
      if (loadedProfiles.length > 0) setProfileId((current) => current || String(loadedProfiles[0].id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load career profiles.");
    } finally {
      setLoadingProfiles(false);
    }
  }

  async function loadResumes(id: string) {
    if (!id) {
      setResumes([]);
      setSelectedId(null);
      return;
    }
    setLoadingResumes(true);
    setError("");
    try {
      const data = await api(`/api/resumes/profile/${id}`);
      const loadedResumes = Array.isArray(data) ? data : [];
      setResumes(loadedResumes);
      setSelectedId((current) => current && loadedResumes.some((resume) => resume.id === current) ? current : loadedResumes[0]?.id ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load résumés.");
    } finally {
      setLoadingResumes(false);
    }
  }

  useEffect(() => { void loadProfiles(); }, []);
  useEffect(() => { if (profileId) void loadResumes(profileId); }, [profileId]);

  function clearMessages() {
    setError("");
    setMessage("");
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    clearMessages();
    const file = event.target.files?.[0] ?? null;
    setUploadFile(file);
    if (file && !resumeName.trim()) setResumeName(file.name.replace(/\.[^/.]+$/, ""));
  }

  async function handleUpload() {
    clearMessages();
    if (!profileId) return setError("Select a career profile first.");
    if (!uploadFile) return setError("Choose a PDF, DOCX, or text résumé file.");
    if (!resumeName.trim()) return setError("Enter a résumé name.");

    const form = new FormData();
    form.append("profile_id", profileId);
    form.append("name", resumeName.trim());
    form.append("make_primary", String(makePrimary));
    form.append("file", uploadFile);
    setUploading(true);
    try {
      const created = await uploadApi("/api/resumes/upload", form);
      setMessage("Résumé added to the experience library.");
      setResumeName("");
      setMakePrimary(false);
      setUploadFile(null);
      await loadResumes(profileId);
      setSelectedId(created.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Résumé upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function handleAnalyze(resume: Resume) {
    clearMessages();
    setWorkingId(resume.id);
    try {
      const updated = await api(`/api/resumes/${resume.id}/analyze`, { method: "POST" });
      setResumes((current) => current.map((item) => item.id === updated.id ? updated : item));
      setSelectedId(updated.id);
      setMessage("Evidence analysis completed.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed.");
    } finally {
      setWorkingId(null);
    }
  }

  async function handlePrimary(resume: Resume) {
    clearMessages();
    setWorkingId(resume.id);
    try {
      const updated = await api(`/api/resumes/${resume.id}/primary`, { method: "POST" });
      setResumes((current) => current.map((item) => ({ ...item, is_primary: item.id === updated.id })));
      setMessage(`${updated.name} is now the primary résumé for this profile.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to set primary résumé.");
    } finally {
      setWorkingId(null);
    }
  }

  async function handleDownload(resume: Resume) {
    clearMessages();
    setWorkingId(resume.id);
    try {
      await downloadApi(`/api/resumes/${resume.id}/download`, resume.original_filename);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Download failed.");
    } finally {
      setWorkingId(null);
    }
  }

  async function handleDelete(resume: Resume) {
    if (!window.confirm(`Delete "${resume.name}"? This cannot be undone.`)) return;
    clearMessages();
    setWorkingId(resume.id);
    try {
      await api(`/api/resumes/${resume.id}`, { method: "DELETE" });
      setMessage("Résumé deleted.");
      await loadResumes(profileId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed.");
    } finally {
      setWorkingId(null);
    }
  }

  const analysisScore = selectedResume?.analysis_score ?? 0;

  return (
    <>
      <PageHeader
        title="Manage the evidence behind your career direction"
        description="Maintain the résumé versions that support your search, identify evidence gaps, and designate the primary document CareerNavIQ should use for market evaluation."
        actions={
          <label className="resume-profile-control" htmlFor="resume-profile">
            <span>Career profile</span>
            <select id="resume-profile" value={profileId} disabled={loadingProfiles} onChange={(event) => setProfileId(event.target.value)}>
              {profiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.name}</option>)}
            </select>
          </label>
        }
      />

      {error ? <Notice title="Experience library needs attention" tone="error"><p>{error}</p></Notice> : null}
      {message ? <Notice title="Update complete" tone="success"><p>{message}</p></Notice> : null}

      <section className="resume-studio-grid executive-resume-workspace">
        <aside className="resume-upload-panel">
          <SectionHeader eyebrow="ADD EVIDENCE" title="Add a résumé" description="Keep naming clear so each version has an obvious purpose." />
          <label htmlFor="resume-name">Résumé name</label>
          <input id="resume-name" value={resumeName} placeholder="Master résumé" onChange={(event) => setResumeName(event.target.value)} />
          <label htmlFor="resume-file">Résumé file</label>
          <input id="resume-file" type="file" accept=".pdf,.doc,.docx,.txt" onChange={handleFileChange} />
          <label className="resume-checkbox-row"><input type="checkbox" checked={makePrimary} onChange={(event) => setMakePrimary(event.target.checked)} /> Set as primary résumé</label>
          <button type="button" disabled={uploading || !profileId} onClick={handleUpload}>{uploading ? "Adding résumé…" : "Add to library"}</button>
          <p className="muted resume-upload-note">Supported formats: PDF, DOC, DOCX, and TXT.</p>
        </aside>

        <section className="resume-library-panel">
          <SectionHeader eyebrow="RÉSUMÉ PORTFOLIO" title="Available versions" description="Select a version to review its evidence profile and analysis." actions={<button type="button" className="secondary" disabled={!profileId || loadingResumes} onClick={() => void loadResumes(profileId)}>{loadingResumes ? "Refreshing…" : "Refresh"}</button>} />

          {loadingResumes ? <div className="resume-empty-state"><h3>Loading résumés…</h3></div> : resumes.length === 0 ? (
            <div className="resume-empty-state"><h3>No résumés uploaded yet</h3><p className="muted">Add your strongest master résumé first, then create targeted versions as opportunities become serious.</p></div>
          ) : (
            <div className="resume-card-grid">
              {resumes.map((resume) => (
                <article className={`resume-library-card ${selectedId === resume.id ? "selected" : ""}`} key={resume.id} onClick={() => setSelectedId(resume.id)}>
                  <div className="row between">
                    <div><div className="row wrap"><h3>{resume.name}</h3>{resume.is_primary ? <span className="badge">Primary</span> : null}</div><p className="muted">{resume.original_filename}</p></div>
                    <div className="resume-score-badge"><strong>{resume.analysis_score ?? "—"}</strong><small>score</small></div>
                  </div>
                  <p className="resume-preview">{resume.extracted_text_preview || "No readable preview is available."}</p>
                  <div className="resume-card-actions">
                    <button type="button" disabled={workingId === resume.id} onClick={(event) => { event.stopPropagation(); void handleAnalyze(resume); }}>{workingId === resume.id ? "Working…" : resume.analysis_score === null ? "Analyze evidence" : "Refresh analysis"}</button>
                    <button type="button" className="secondary" disabled={workingId === resume.id} onClick={(event) => { event.stopPropagation(); void handleDownload(resume); }}>Download</button>
                    {!resume.is_primary ? <button type="button" className="secondary" disabled={workingId === resume.id} onClick={(event) => { event.stopPropagation(); void handlePrimary(resume); }}>Set primary</button> : null}
                    <button type="button" className="danger" disabled={workingId === resume.id} onClick={(event) => { event.stopPropagation(); void handleDelete(resume); }}>Delete</button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <aside className="resume-analysis-panel">
          <SectionHeader eyebrow="EVIDENCE REVIEW" title="Career evidence" description="Use this analysis to improve specificity, quantified impact, and role-relevant proof." />
          {!selectedResume ? (
            <div className="resume-empty-state"><h3>Select a résumé</h3><p className="muted">Evidence analysis will appear here.</p></div>
          ) : (
            <>
              <div className="resume-analysis-heading">
                <div><h3>{selectedResume.name}</h3><p className="muted">{selectedResume.is_primary ? "Primary résumé" : "Alternate résumé"}</p></div>
                <div className="resume-analysis-score"><strong>{analysisScore || "—"}</strong><small>overall</small></div>
              </div>
              <div className="resume-analysis-section"><h3>Positioning summary</h3><p>{selectedResume.analysis_summary || "Run analysis to generate an evidence summary."}</p></div>
              <div className="resume-analysis-section"><h3>Strengths</h3>{selectedResume.strengths.length ? <ul>{selectedResume.strengths.map((strength, index) => <li key={`${strength}-${index}`}>{strength}</li>)}</ul> : <p className="muted">No strengths recorded yet.</p>}</div>
              <div className="resume-analysis-section"><h3>Evidence gaps</h3>{selectedResume.gaps.length ? <ul>{selectedResume.gaps.map((gap, index) => <li key={`${gap}-${index}`}>{gap}</li>)}</ul> : <p className="muted">No gaps recorded yet.</p>}</div>
              <div className="resume-analysis-section"><h3>Quantified impact detected</h3>{selectedResume.metrics_found.length ? <div className="resume-metric-tags">{selectedResume.metrics_found.map((metric, index) => <span className="badge" key={`${metric}-${index}`}>{metric}</span>)}</div> : <p className="muted">No quantified achievements detected yet.</p>}</div>
              <button type="button" disabled={workingId === selectedResume.id} onClick={() => void handleAnalyze(selectedResume)}>{workingId === selectedResume.id ? "Analyzing…" : "Run evidence analysis"}</button>
            </>
          )}
        </aside>
      </section>
    </>
  );
}
