"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { EmptyState, Notice, PageHeader } from "@/components/ui";
import { api } from "@/lib/api";

type Application = {
  id: number;
  status: string;
  match_score: number | null;
  created_at?: string;
  updated_at?: string;
  job: {
    title: string;
    company: string;
    location?: string;
    remote?: boolean;
  };
};

const stages = [
  { id: "wishlist", label: "Saved" },
  { id: "applied", label: "Applied" },
  { id: "recruiter", label: "Recruiter" },
  { id: "interview", label: "Interview" },
  { id: "final", label: "Final round" },
  { id: "offer", label: "Offer" },
  { id: "accepted", label: "Accepted" },
  { id: "rejected", label: "Closed" },
] as const;

function stageLabel(status: string) {
  return stages.find((stage) => stage.id === status)?.label || status;
}

function matchTone(score: number | null) {
  if (score === null || score === undefined) return "Not scored";
  if (score >= 85) return "Excellent fit";
  if (score >= 70) return "Strong fit";
  if (score >= 55) return "Good fit";
  return "Possible fit";
}

export default function Applications() {
  const [items, setItems] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [movingId, setMovingId] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");

  async function load() {
    const data = await api("/api/applications");
    setItems(Array.isArray(data.applications) ? data.applications : []);
  }

  useEffect(() => {
    let active = true;

    load()
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : "Unable to load applications.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  async function move(id: number, status: string) {
    setMovingId(id);
    setError("");

    try {
      await api(`/api/applications/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update application status.");
    } finally {
      setMovingId(null);
    }
  }

  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return items;

    return items.filter((item) =>
      [item.job.title, item.job.company, item.job.location || "", stageLabel(item.status)]
        .join(" ")
        .toLowerCase()
        .includes(normalized),
    );
  }, [items, query]);

  const summary = useMemo(() => {
    const active = items.filter((item) => !["accepted", "rejected"].includes(item.status)).length;
    const interviews = items.filter((item) => ["interview", "final"].includes(item.status)).length;
    const offers = items.filter((item) => ["offer", "accepted"].includes(item.status)).length;
    const scored = items.filter((item) => typeof item.match_score === "number");
    const averageMatch = scored.length
      ? Math.round(scored.reduce((total, item) => total + (item.match_score || 0), 0) / scored.length)
      : 0;

    return { active, interviews, offers, averageMatch };
  }, [items]);

  return (
    <>
      <PageHeader
        eyebrow="APPLICATION PIPELINE"
        title="Turn opportunities into momentum"
        description="Track every role from first interest through offer, keep next steps visible, and move applications forward without losing context."
        actions={
          <div className="row wrap">
            <Link className="button secondary" href="/jobs">Find opportunities</Link>
            <Link className="button" href="/interviews">Interview center</Link>
          </div>
        }
      />

      {error ? (
        <Notice title="Application pipeline needs attention" tone="error">
          <p>{error}</p>
        </Notice>
      ) : null}

      {!loading && items.length ? (
        <section className="pipeline-summary-grid" aria-label="Application pipeline summary">
          <article className="pipeline-summary-card">
            <span>Active applications</span>
            <strong>{summary.active}</strong>
            <small>still in progress</small>
          </article>
          <article className="pipeline-summary-card">
            <span>Interview stage</span>
            <strong>{summary.interviews}</strong>
            <small>interview or final round</small>
          </article>
          <article className="pipeline-summary-card">
            <span>Offers</span>
            <strong>{summary.offers}</strong>
            <small>offer or accepted</small>
          </article>
          <article className="pipeline-summary-card">
            <span>Average match</span>
            <strong>{summary.averageMatch ? `${summary.averageMatch}%` : "—"}</strong>
            <small>{summary.averageMatch ? "across scored roles" : "no scores available"}</small>
          </article>
        </section>
      ) : null}

      <section className="pipeline-toolbar">
        <div>
          <p className="eyebrow">PIPELINE BOARD</p>
          <h2>Application stages</h2>
          <p className="muted">Change a role’s stage directly from its card.</p>
        </div>
        <label className="pipeline-search" htmlFor="application-search">
          <span>Filter applications</span>
          <input
            id="application-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search title, company, or stage"
          />
        </label>
      </section>

      {loading ? (
        <section className="card pipeline-loading-state">
          <p className="eyebrow">LOADING</p>
          <h2>Organizing your application pipeline…</h2>
          <p className="muted">CareerNavIQ is loading every active and completed opportunity.</p>
        </section>
      ) : null}

      {!loading && items.length ? (
        <section className="kanban-board" aria-label="Application pipeline board">
          {stages.map((stage) => {
            const stageItems = filteredItems.filter((item) => item.status === stage.id);

            return (
              <section className="kanban-column" key={stage.id} aria-labelledby={`stage-${stage.id}`}>
                <header className="kanban-column-head">
                  <div>
                    <span className="kanban-stage-dot" aria-hidden="true" />
                    <h3 id={`stage-${stage.id}`}>{stage.label}</h3>
                  </div>
                  <span className="badge">{stageItems.length}</span>
                </header>

                <div className="kanban-card-list">
                  {stageItems.map((application) => (
                    <article className="kanban-card" key={application.id}>
                      <div className="kanban-card-heading">
                        <div>
                          <strong>{application.job.title}</strong>
                          <small>{application.job.company}</small>
                        </div>
                        {typeof application.match_score === "number" ? (
                          <span className="kanban-match-score">{application.match_score}%</span>
                        ) : null}
                      </div>

                      <div className="kanban-card-meta">
                        <span>{matchTone(application.match_score)}</span>
                        {application.job.location ? <span>{application.job.location}</span> : null}
                        {application.job.remote ? <span>Remote</span> : null}
                      </div>

                      <label htmlFor={`application-stage-${application.id}`}>Current stage</label>
                      <select
                        id={`application-stage-${application.id}`}
                        value={application.status}
                        disabled={movingId === application.id}
                        onChange={(event) => void move(application.id, event.target.value)}
                      >
                        {stages.map((option) => (
                          <option key={option.id} value={option.id}>{option.label}</option>
                        ))}
                      </select>

                      <div className="kanban-card-actions">
                        <Link className="button secondary" href={`/applications/${application.id}`}>
                          Open workspace
                        </Link>
                      </div>
                    </article>
                  ))}

                  {!stageItems.length ? (
                    <div className="kanban-empty-stage">
                      <span>No matching applications</span>
                    </div>
                  ) : null}
                </div>
              </section>
            );
          })}
        </section>
      ) : null}

      {!loading && !items.length && !error ? (
        <EmptyState
          title="Your application pipeline is ready"
          description="Save a job or create an application to begin tracking outreach, interviews, follow-ups, and offers in one workspace."
          action={<Link className="button" href="/jobs">Find your first opportunity</Link>}
        />
      ) : null}
    </>
  );
}
