"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { EmptyState, MetricStrip, Notice, PageHeader } from "@/components/ui";
import { api } from "@/lib/api";

type RankedCompany = { company: string; count: number };
type RankedTitle = { title: string; count: number };
type AnalyticsData = {
  total_matches: number;
  average_match_score: number;
  total_applications: number;
  interview_conversion: number;
  status_counts: Record<string, number>;
  score_bands: Record<string, number>;
  top_companies: RankedCompany[];
  top_titles: RankedTitle[];
};

const statusLabels: Record<string, string> = {
  wishlist: "Selected",
  applied: "Applied",
  recruiter: "Recruiter",
  interview: "Interview",
  final: "Final round",
  offer: "Offer",
  accepted: "Accepted",
  rejected: "Closed",
};

function displayLabel(value: string) {
  return statusLabels[value] || value.replaceAll("_", " ");
}

export default function Analytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      setData(await api("/api/intelligence/analytics"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load performance intelligence.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  const maxStatus = useMemo(() => Math.max(1, ...Object.values(data?.status_counts || {})), [data]);
  const maxBand = useMemo(() => Math.max(1, ...Object.values(data?.score_bands || {})), [data]);
  const maxCompany = useMemo(() => Math.max(1, ...(data?.top_companies || []).map((item) => item.count)), [data]);
  const maxTitle = useMemo(() => Math.max(1, ...(data?.top_titles || []).map((item) => item.count)), [data]);

  return (
    <>
      <PageHeader
        eyebrow="PERFORMANCE INTELLIGENCE"
        title="Understand what is actually producing progress"
        description="Read opportunity quality, portfolio movement, and interview conversion using the market, résumé, and pursuit evidence already held in CareerNavIQ."
        actions={<div className="row wrap"><button type="button" className="secondary" disabled={loading} onClick={() => void load()}>{loading ? "Refreshing…" : "Refresh intelligence"}</button><Link className="button" href="/applications">Opportunity portfolio</Link></div>}
      />

      {error ? <Notice title="Performance intelligence could not be loaded" tone="error"><p>{error}</p></Notice> : null}

      {loading ? <section className="executive-loading"><p className="eyebrow">PERFORMANCE INTELLIGENCE</p><h2>Preparing performance signals…</h2><p className="muted">Connecting alignment, active pursuits, and interview outcomes.</p></section> : null}

      {!loading && data ? (
        <>
          <MetricStrip
            ariaLabel="Career performance summary"
            items={[
              { label: "Opportunities reviewed", value: data.total_matches, detail: "selection records scored" },
              { label: "Average alignment", value: `${Math.round(data.average_match_score)}%`, detail: "across evaluated opportunities" },
              { label: "Active records", value: data.total_applications, detail: "in the opportunity portfolio" },
              { label: "Interview conversion", value: `${Math.round(data.interview_conversion)}%`, detail: "pursuits reaching interviews" },
            ]}
          />

          <section className="analytics-grid analytics-grid-primary">
            <article className="card analytics-panel">
              <div className="analytics-panel-heading"><div><p className="eyebrow">PORTFOLIO MOVEMENT</p><h2>Opportunities by stage</h2></div><Link href="/applications">Open portfolio →</Link></div>
              <div className="analytics-bar-list">
                {Object.entries(data.status_counts).map(([stage, count]) => <div className="analytics-bar-row" key={stage}><div><span>{displayLabel(stage)}</span><strong>{count}</strong></div><div className="analytics-track"><span style={{ width: `${Math.max(count ? 8 : 0, (count / maxStatus) * 100)}%` }} /></div></div>)}
                {!Object.keys(data.status_counts).length ? <p className="muted">No opportunity stages are available yet.</p> : null}
              </div>
            </article>

            <article className="card analytics-panel">
              <div className="analytics-panel-heading"><div><p className="eyebrow">MARKET QUALITY</p><h2>Alignment distribution</h2></div><Link href="/jobs">Market intelligence →</Link></div>
              <div className="analytics-bar-list">
                {Object.entries(data.score_bands).map(([band, count]) => <div className="analytics-bar-row" key={band}><div><span>{displayLabel(band)}</span><strong>{count}</strong></div><div className="analytics-track analytics-track-teal"><span style={{ width: `${Math.max(count ? 8 : 0, (count / maxBand) * 100)}%` }} /></div></div>)}
                {!Object.keys(data.score_bands).length ? <p className="muted">No alignment distribution is available yet.</p> : null}
              </div>
            </article>
          </section>

          <section className="analytics-grid">
            <article className="card analytics-panel">
              <div className="analytics-panel-heading"><div><p className="eyebrow">COMPANY CONCENTRATION</p><h2>Most-pursued organizations</h2></div><Link href="/companies">Target companies →</Link></div>
              <div className="analytics-ranking-list">
                {data.top_companies.map((item, index) => <div key={item.company}><span className="analytics-rank">{index + 1}</span><div><strong>{item.company}</strong><span className="analytics-mini-track"><i style={{ width: `${(item.count / maxCompany) * 100}%` }} /></span></div><b>{item.count}</b></div>)}
                {!data.top_companies.length ? <p className="muted">No company pursuit data yet.</p> : null}
              </div>
            </article>

            <article className="card analytics-panel">
              <div className="analytics-panel-heading"><div><p className="eyebrow">ROLE CONCENTRATION</p><h2>Most-pursued titles</h2></div><Link href="/profiles">Career profiles →</Link></div>
              <div className="analytics-ranking-list">
                {data.top_titles.map((item, index) => <div key={item.title}><span className="analytics-rank">{index + 1}</span><div><strong>{item.title}</strong><span className="analytics-mini-track"><i style={{ width: `${(item.count / maxTitle) * 100}%` }} /></span></div><b>{item.count}</b></div>)}
                {!data.top_titles.length ? <p className="muted">No role pursuit data yet.</p> : null}
              </div>
            </article>
          </section>
        </>
      ) : null}

      {!loading && !data && !error ? <EmptyState title="Performance intelligence will build as your search grows" description="Evaluate the market and manage active pursuits to begin measuring opportunity quality and conversion." action={<Link className="button" href="/jobs">Open market intelligence</Link>} /> : null}
    </>
  );
}
