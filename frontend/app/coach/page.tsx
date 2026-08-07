"use client";

import { useEffect, useState } from "react";

import { PageHeader } from "@/components/ui";
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
    load().catch((loadError) => setError(loadError.message));
  }, []);

  async function ask(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");

    try {
      await api("/api/intelligence/coach", {
        method: "POST",
        body: JSON.stringify({
          question,
          profile_id: profileId ? Number(profileId) : null,
          application_id: applicationId ? Number(applicationId) : null,
        }),
      });
      await load();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Advisory request failed",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="PRIVATE ADVISORY"
        title="Sharpen the next career decision"
        description="Bring your position, active pursuits, and accumulated evidence into one focused advisory conversation."
      />

      <div className="coach-brief-grid">
        <form className="card coach-brief-form" onSubmit={ask}>
          <p className="eyebrow">THE BRIEF</p>
          <h2>Set the decision context</h2>

          <label htmlFor="coach-profile">Executive position</label>
          <select
            id="coach-profile"
            value={profileId}
            onChange={(event) => setProfileId(event.target.value)}
          >
            <option value="">General advisory</option>
            {profiles.map((profile) => (
              <option key={profile.id} value={profile.id}>{profile.name}</option>
            ))}
          </select>

          <label htmlFor="coach-application">Opportunity context</label>
          <select
            id="coach-application"
            value={applicationId}
            onChange={(event) => setApplicationId(event.target.value)}
          >
            <option value="">No opportunity selected</option>
            {apps.map((application: any) => (
              <option key={application.id} value={application.id}>
                {application.job.company} — {application.job.title}
              </option>
            ))}
          </select>

          <label htmlFor="coach-question">Decision to examine</label>
          <textarea
            id="coach-question"
            rows={8}
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
          />

          {error ? <p className="error" role="alert">{error}</p> : null}
          <button disabled={busy || !question.trim()}>
            {busy ? "Preparing counsel…" : "Request private counsel"}
          </button>
        </form>

        <section className="card coach-prompt-library">
          <p className="eyebrow">STARTING POINTS</p>
          <h2>Questions worth asking</h2>
          <p className="muted">
            Choose a prompt, then add the nuance that makes the decision yours.
          </p>
          <div className="coach-prompt-list">
            {advisoryPrompts.map((prompt, index) => (
              <button
                className="version-button coach-prompt-button"
                key={prompt}
                type="button"
                onClick={() => setQuestion(prompt)}
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{prompt}</strong>
              </button>
            ))}
          </div>
        </section>
      </div>

      <section className="card coach-history-panel">
        <div className="coach-history-heading">
          <div>
            <p className="eyebrow">ADVISORY RECORD</p>
            <h2>Prior counsel</h2>
          </div>
          <span>{history.length} conversations</span>
        </div>

        {history.map((item) => (
          <article className="coach-message" key={item.id}>
            <strong>{item.question}</strong>
            <p>{item.answer}</p>
            <small>{new Date(item.created_at).toLocaleString()}</small>
          </article>
        ))}
        {!history.length ? (
          <p className="muted">Your advisory record will appear here.</p>
        ) : null}
      </section>
    </>
  );
}
