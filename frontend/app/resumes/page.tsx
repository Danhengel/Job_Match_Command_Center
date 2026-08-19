"use client";

import { ChangeEvent, useEffect, useState } from "react";
import { Notice, PageHeader } from "@/components/ui";
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

function formatFileSize(bytes: number) {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileType(resume: Resume) {
  const extension = resume.original_filename.split(".").pop()?.toUpperCase();
  return extension || (resume.mime_type.includes("pdf") ? "PDF" : "DOC");
}

export default function ResumesPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [profileId, setProfileId] = useState("");
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [resumeName, setResumeName] = useState("");
  const [makePrimary, setMakePrimary] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [loadingResumes, setLoadingResumes] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [workingId, setWorkingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

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
      return;
    }
    setLoadingResumes(true);
    setError("");
    try {
      const data = await api(`/api/resumes/profile/${id}`);
      setResumes(Array.isArray(data) ? data : []);
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
      await uploadApi("/api/resumes/upload", form);
      setMessage("Résumé uploaded successfully.");
      setResumeName("");
      setMakePrimary(false);
      setUploadFile(null);
      setShowUpload(false);
      await loadResumes(profileId);
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
      setMessage("Résumé analysis completed.");
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
    if (!window.confirm(`Delete “${resume.name}”? This cannot be undone.`)) return;
    clearMessages();
    setWorkingId(resume.id);
    try {
      await api(`/api/resumes/${resume.id}`, { method: "DELETE" });
      setMessage("Résumé deleted.");
      setExpandedId(null);
      await loadResumes(profileId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed.");
    } finally {
      setWorkingId(null);
    }
  }

  return (
    <div className="resume-library-page resume-list-page">
      <PageHeader
        eyebrow="RÉSUMÉ LIBRARY"
        title="Manage your résumés"
        description="Organize your résumé versions, review their readiness, and choose the strongest evidence for each opportunity."
        actions={
          <button type="button" className="button resume-upload-toggle" onClick={() => setShowUpload((current) => !current)}>
            {showUpload ? "Close upload" : "+ Upload New Résumé"}
          </button>
        }
      />

      {error ? <Notice title="Résumé library needs attention" tone="error"><p>{error}</p></Notice> : null}
      {message ? <Notice title="Update complete" tone="success"><p>{message}</p></Notice> : null}

      {showUpload ? (
        <section className="resume-inline-upload" aria-label="Upload a résumé">
          <div className="resume-inline-upload-heading">
            <div>
              <h2>Upload a résumé</h2>
              <p>Choose the career profile this résumé belongs to, then upload PDF, DOC, DOCX, or TXT.</p>
            </div>
          </div>
          <div className="resume-upload-grid">
            <label>
              <span>Career profile</span>
              <select value={profileId} disabled={loadingProfiles} onChange={(event) => setProfileId(event.target.value)}>
                {profiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.name}</option>)}
              </select>
            </label>
            <label>
              <span>Résumé name</span>
              <input value={resumeName} placeholder="Executive leadership résumé" onChange={(event) => setResumeName(event.target.value)} />
            </label>
            <label>
              <span>Résumé file</span>
              <input type="file" accept=".pdf,.doc,.docx,.txt" onChange={handleFileChange} />
            </label>
          </div>
          <div className="resume-upload-footer">
            <label className="resume-checkbox-row"><input type="checkbox" checked={makePrimary} onChange={(event) => setMakePrimary(event.target.checked)} /> Set as primary résumé</label>
            <button type="button" className="button" disabled={uploading || !profileId} onClick={handleUpload}>{uploading ? "Uploading…" : "Upload résumé"}</button>
          </div>
        </section>
      ) : null}

      <section className="resume-list-shell">
        <header className="resume-list-header">
          <h2>Your Résumés ({resumes.length})</h2>
          <label className="resume-list-profile-control">
            <span>Career profile</span>
            <select value={profileId} disabled={loadingProfiles} onChange={(event) => setProfileId(event.target.value)}>
              {profiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.name}</option>)}
            </select>
          </label>
        </header>

        {loadingResumes ? (
          <div className="resume-list-empty">Loading résumés…</div>
        ) : resumes.length === 0 ? (
          <div className="resume-list-empty">
            <h3>No résumés yet</h3>
            <p>Upload your primary résumé to begin building this profile’s résumé library.</p>
          </div>
        ) : (
          <div className="resume-list-rows">
            {resumes.map((resume) => {
              const expanded = expandedId === resume.id;
              return (
                <article className="resume-list-row" key={resume.id}>
                  <div className="resume-file-icon" aria-hidden="true">
                    <span>{fileType(resume)}</span>
                  </div>

                  <div className="resume-row-copy">
                    <div className="resume-row-title-line">
                      <h3>{resume.name}</h3>
                      {resume.is_primary ? <span className="resume-primary-chip">Primary</span> : null}
                    </div>
                    <p>{resume.original_filename}{resume.file_size ? ` · ${formatFileSize(resume.file_size)}` : ""}</p>
                    {resume.analysis_summary ? <small>{resume.analysis_summary}</small> : null}
                  </div>

                  <div className="resume-row-score">
                    <strong>{resume.analysis_score ?? "—"}{resume.analysis_score !== null ? "%" : ""}</strong>
                    <span>Overall Match</span>
                  </div>

                  <div className="resume-row-actions">
                    <button type="button" className="button" disabled={workingId === resume.id} onClick={() => void handleDownload(resume)}>
                      {workingId === resume.id ? "Working…" : "Download résumé"}
                    </button>
                    <button type="button" className="button secondary resume-delete-button" disabled={workingId === resume.id} onClick={() => void handleDelete(resume)}>
                      Delete résumé
                    </button>
                  </div>

                  <div className="resume-more-wrap">
                    <button type="button" className="resume-more-button" aria-label={`More actions for ${resume.name}`} aria-expanded={expanded} onClick={() => setExpandedId(expanded ? null : resume.id)}>•••</button>
                    {expanded ? (
                      <div className="resume-more-menu">
                        <button type="button" disabled={workingId === resume.id} onClick={() => void handleAnalyze(resume)}>{resume.analysis_score === null ? "Analyze résumé" : "Refresh analysis"}</button>
                        {!resume.is_primary ? <button type="button" disabled={workingId === resume.id} onClick={() => void handlePrimary(resume)}>Set as primary</button> : null}
                      </div>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <div className="resume-list-note">
          <span aria-hidden="true">ⓘ</span>
          <p>Overall Match shows how well each résumé aligns with the target direction in the selected career profile.</p>
        </div>
      </section>
    </div>
  );
}
