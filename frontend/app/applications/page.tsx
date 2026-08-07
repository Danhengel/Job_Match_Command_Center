"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { EmptyState, MetricStrip, Notice, PageHeader, SectionHeader } from "@/components/ui";
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
  { id: "wishlist", label: "Selected" },
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

function stageRank(status: string) {
  const index = stages.findIndex((stage) => stage.id === status);
  return index === -1 ? stages.length : index;
}

function alignmentLabel(score: number | null) {
  if (score === null || score === undefined) return "Not scored";
  if (score >= 85) return "Exceptional";
  if (score >= 70) return "Strong";
  if (score >= 55) return "Worth review";
  return "Exploratory";
}

export default function Applications() {
  const [items, setItems] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [movingId, setMovingId] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [error, setError] = useState("");

  async function load() {
    const data = await api("/api/applications");
    setItems(Array.isArray(data.applications) ? data.applications : []);
  }

  useEffect(() => {
    let active = true;
    load()
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : "Unable to load opportunity portfolio.");
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
      setError(err instanceof Error ? err.message : "Unable to update opportunity status.");
    } finally {
      setMovingId(null);
    }
  }

  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return items
      .filter((item) => stageFilter === "all" || item.status === stageFilter)
      .filter((item) => {
        if (!normalized) return true;
        return [item.job.title, item.job.company, item.job.location || "", stageLabel(item.status)]
          .join(" ")
          .toLowerCase()
          .includes(normalized);
      })
      .sort((a, b) => stageRank(a.status) - stageRank(b.status) || (b.match_score || 0) - (a.match_score || 0));
  }, [items, query, stageFilter]);

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
        eyebrow="OPPORTUNITY PORTFOLIO"
        title="Manage active pursuits as a decision portfolio"
        description="Keep role quality, stage, relationships, and next decisions visible without turning your search into a crowded task board."
        actions={<div className="row wrap"><Link className="button secondary" href="/jobs">Market intelligence</Link><Link className="button" href="/interviews">Interview advisory</Link></div>}
      />

      {error ? <Notice title="Opportunity portfolio needs attention" tone="error"><p>{error}</p></Notice> : null}

      {!loading ? (
        <MetricStrip
          ariaLabel="Opportunity portfolio summary"
          items={[
            { label: "Active pursuits", value: summary.active, detail: "still in consideration" },
            { label: "Interview stage", value: summary.interviews, detail: "interview or final round" },
            { label: "Offers", value: summary.offers, detail: "offer or accepted" },
            { label: "Average alignment", value: summary.averageMatch ? `${summary.averageMatch}%` : "—", detail: summary.averageMatch ? "across scored roles" : "no scores available" },
          ]}
        />
      ) : null}

      <section className="executive-panel opportunity-portfolio-panel">
        <SectionHeader
          eyebrow="PORTFOLIO REVIEW"
          title="Current opportunities"
          description="Prioritize quality and decision clarity. Update a stage in place, then open the full record when more context is needed."
          actions={
            <div className="portfolio-controls">
              <label><span>Search</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Role, company, location" /></label>
              <label><span>Stage</span><select value={stageFilter} onChange={(event) => setStageFilter(event.target.value)}><option value="all">All stages</option>{stages.map((stage) => <option key={stage.id} value={stage.id}>{stage.label}</option>)}</select></label>
            </div>
          }
        />

        {loading ? <div className="executive-loading-inline"><strong>Preparing portfolio…</strong><span>Loading active and completed opportunities.</span></div> : null}

        {!loading && filteredItems.length ? (
          <div className="opportunity-portfolio-list">
            <div className="opportunity-portfolio-head" aria-hidden="true">
              <span>Opportunity</span><span>Stage</span><span>Alignment</span><span>Decision</span>
            </div>
            {filteredItems.map((application) => (
              <article className="opportunity-portfolio-row" key={application.id}>
                <div className="opportunity-title-cell">
                  <strong>{application.job.title}</strong>
                  <span>{application.job.company}</span>
                  <small>{application.job.location || "Location not listed"}{application.job.remote ? " · Remote" : ""}</small>
                </div>
                <div className="opportunity-stage-cell">
                  <span className={`portfolio-stage portfolio-stage-${application.status}`}>{stageLabel(application.status)}</span>
                  <select
                    aria-label={`Stage for ${application.job.title}`}
                    value={application.status}
                    disabled={movingId === application.id}
                    onChange={(event) => void move(application.id, event.target.value)}
                  >
                    {stages.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
                  </select>
                </div>
                <div className="opportunity-alignment-cell">
                  <strong>{typeof application.match_score === "number" ? `${application.match_score}%` : "—"}</strong>
                  <span>{alignmentLabel(application.match_score)}</span>
                </div>
                <div className="opportunity-decision-cell">
                  <Link className="button secondary" href={`/applications/${application.id}`}>Open opportunity</Link>
                </div>
              </article>
            ))}
          </div>
        ) : null}

        {!loading && !filteredItems.length && items.length ? (
          <EmptyState title="No opportunities match this view" description="Adjust the search or stage filter to return opportunities to the portfolio view." />
        ) : null}

        {!loading && !items.length && !error ? (
          <EmptyState
            title="Your opportunity portfolio is ready"
            description="Select a strong market opportunity to begin managing application strategy, relationships, interviews, and decisions in one place."
            action={<Link className="button" href="/jobs">Open market intelligence</Link>}
          />
        ) : null}
      </section>
    </>
  );
}
