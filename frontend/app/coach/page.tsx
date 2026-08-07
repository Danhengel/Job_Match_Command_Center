"use client";

import { useEffect, useState } from "react";
import { PageHeader, SectionHeader } from "@/components/ui";
import { api } from "@/lib/api";

const advisoryPrompts = [
  "Should I pursue this opportunity?",
  "How should I prepare for this conversation?",
  "What compensation strategy should I use?",
  "What is the highest-value next move?",
  "How should I strengthen my positioning?",
];

export default function Coach() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [apps, setApps] = useState<any[]>([]);
  const [profileId, setProfileId] = useState("");
  const [applicationId, setApplicationId] = useState("");
  const [question, setQuestion] = useState(advisoryPrompts[0]);
  const [history, setHistory] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    const [profileData, applicationData, historyData] = await Promise.all([
      api("/api/profiles"),
      api("/api/applications"),
      api("/api/intelligence/coach/history"),
    ]);
    setProfiles(profileData);
    setApps(applicationData.applications);
    setHistory(historyData);
  }

  useEffect(() => {
    load().catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Unable to load advisory history."));
  }, []);

  async function ask(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api("/api/intelligence/coach", {
        method: "POST",
        body: JSON.stringify({ question, profile_id: profileId ? Number(profileId) : null, application_id: applicationId ? Number(applicationId) : null }),
      });
      await load();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Advisory request failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="APPLICATION STRATEGY"
        title="Examine the decision before you make the move"
        description="Bring your executive profile, active opportunities, and saved evidence into one focused strategy conversation."
      />

      <div className="coach-brief-grid">
        <form className="card coach-brief-form" onSubmit={ask}>
          <SectionHeader eyebrow="DECISION CONTEXT" title="Frame the question" description="Select the profile and opportunity that should inform the guidance, then make the decision explicit." />

          <label htmlFor="coach-profile">Executive profile</label>
          <select id="coach-profile" value={profileId} onChange={(event) => setProfileId(event.target.value)}>
            <option value="">General career strategy</option>
            {profiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.name}</option>)}
          </select>

          <label htmlFor="coach-application">Opportunity context</label>
          <select id="coach-application" value={applicationId} onChange={(event) => setApplicationId(event.target.value)}>
            <option value="">No opportunity selected</option>
            {apps.map((application: any) => <option key={application.id} value={application.id}>{application.job.company} — {application.job.title}</option>)}
          </select>

          <label htmlFor="coach-question">Decision to examine</label>
          <textarea id="coach-question" rows={8} value={question} onChange={(event) => setQuestion(event.target.value)} />

          {error ? <p className="error" role="alert">{error}</p> : null}
          <button disabled={busy || !question.trim()}>{busy ? "Preparing guidance…" : "Request strategic guidance"}</button>
        </form>

        <section className="card coach-prompt-library">
          <p className="eyebrow">DECISION PROMPTS</p>
          <h2>Questions worth examining</h2>
          <p className="muted">Start with a focused prompt, then add the nuance that makes the decision specific to you.</p>
          <div className="coach-prompt-list">
            {advisoryPrompts.map((prompt, index) => (
              <button className="version-button coach-prompt-button" key={prompt} type="button" onClick={() => setQuestion(prompt)}>
                <span>{String(index + 1).padStart(2, "0")}</span><strong>{prompt}</strong>
              </button>
            ))}
          </div>
        </section>
      </div>

      <section className="card coach-history-panel">
        <div className="coach-history-heading"><div><p className="eyebrow">ADVISORY HISTORY</p><h2>Prior guidance</h2></div><span>{history.length} conversations</span></div>
        {history.map((item) => <article className="coach-message" key={item.id}><strong>{item.question}</strong><p>{item.answer}</p><small>{new Date(item.created_at).toLocaleString()}</small></article>)}
        {!history.length ? <p className="muted">Your strategic guidance history will appear here.</p> : null}
      </section>
    </>
  );
}
