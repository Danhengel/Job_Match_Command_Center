"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { EmptyState, Notice, PageHeader } from "@/components/ui";
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
  wishlist: "Saved",
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
      setError(err instanceof Error ? err.message : "Unable to load analytics.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const maxStatus = useMemo(
    () => Math.max(1, ...Object.values(data?.status_counts || {})),
    [data],
  );
  const maxBand = useMemo(
    () => Math.max(1, ...Object.values(data?.score_bands || {})),
    [data],
  );
  const maxCompany = useMemo(
    () => Math.max(1, ...(data?.top_companies || []).map((item) => item.count)),
    [data],
  );
  const maxTitle = useMemo(
    () => Math.max(1, ...(data?.top_titles || []).map((item) => item.count)),
    [data],
  );

  return (
    <>
      <PageHeader
        eyebrow="SEARCH PERFORMANCE"
        title="See what is moving your career search forward"
        description="Measure opportunity quality, application activity, and conversion using the job, résumé, and pipeline data already saved in CareerNavIQ."
        actions={
          <div className="row wrap">
            <button type="button" className="secondary" disabled={loading} onClick={() => void load()}>
              {loading ? "Refreshing…" : "Refresh analytics"}
            </button>
            <Link className="button" href="/applications">Open pipeline</Link>
          </div>
        }
      />

      {error ? (
        <Notice title="Analytics could not be loaded" tone="error">
          <p>{error}</p>
        </Notice>
      ) : null}

      {loading ? (
        <section className="card analytics-loading-state">
          <p className="eyebrow">LOADING</p>
          <h2>Calculating search performance…</h2>
          <p className="muted">CareerNavIQ is connecting job matches, applications, and interview progress.</p>
        </section>
      ) : null}

      {!loading && data ? (
        <>
          <section className="analytics-kpi-grid" aria-label="Career search performance summary">
            <article><span>Total matches</span><strong>{data.total_matches}</strong><small>opportunities scored</small></article>
            <article><span>Average match</span><strong>{Math.round(data.average_match_score)}%</strong><small>across analyzed roles</small></article>
            <article><span>Applications</span><strong>{data.total_applications}</strong><small>tracked in your pipeline</small></article>
            <article><span>Interview conversion</span><strong>{Math.round(data.interview_conversion)}%</strong><small>applications reaching interviews</small></article>
          </section>

          <section className="analytics-grid analytics-grid-primary">
            <article className="card analytics-panel">
              <div className="analytics-panel-heading">
                <div>
                  <p className="eyebrow">PIPELINE FLOW</p>
                  <h2>Applications by stage</h2>
                </div>
                <Link href="/applications">Manage pipeline →</Link>
              </div>
              <div className="analytics-bar-list">
                {Object.entries(data.status_counts).map(([stage, count]) => (
                  <div className="analytics-bar-row" key={stage}>
                    <div><span>{displayLabel(stage)}</span><strong>{count}</strong></div>
                    <div className="analytics-track"><span style={{ width: `${Math.max(count ? 8 : 0, (count / maxStatus) * 100)}%` }} /></div>
                  </div>
                ))}
                {!Object.keys(data.status_counts).length ? <p className="muted">No application stages are available yet.</p> : null}
              </div>
            </article>

            <article className="card analytics-panel">
              <div className="analytics-panel-heading">
                <div>
                  <p className="eyebrow">OPPORTUNITY QUALITY</p>
                  <h2>Match-score distribution</h2>
                </div>
                <Link href="/jobs">Review jobs →</Link>
              </div>
              <div className="analytics-bar-list">
                {Object.entries(data.score_bands).map(([band, count]) => (
                  <div className="analytics-bar-row" key={band}>
                    <div><span>{displayLabel(band)}</span><strong>{count}</strong></div>
                    <div className="analytics-track analytics-track-teal"><span style={{ width: `${Math.max(count ? 8 : 0, (count / maxBand) * 100)}%` }} /></div>
                  </div>
                ))}
                {!Object.keys(data.score_bands).length ? <p className="muted">No match-score distribution is available yet.</p> : null}
              </div>
            </article>
          </section>

          <section className="analytics-grid">
            <article className="card analytics-panel">
              <div className="analytics-panel-heading">
                <div>
                  <p className="eyebrow">COMPANY FOCUS</p>
                  <h2>Most-applied companies</h2>
                </div>
                <Link href="/companies">Company intelligence →</Link>
              </div>
              <div className="analytics-ranking-list">
                {data.top_companies.map((item, index) => (
                  <div key={item.company}>
                    <span className="analytics-rank">{index + 1}</span>
                    <div><strong>{item.company}</strong><span className="analytics-mini-track"><i style={{ width: `${(item.count / maxCompany) * 100}%` }} /></span></div>
                    <b>{item.count}</b>
                  </div>
                ))}
                {!data.top_companies.length ? <p className="muted">No company application data yet.</p> : null}
              </div>
            </article>

            <article className="card analytics-panel">
              <div className="analytics-panel-heading">
                <div>
                  <p className="eyebrow">ROLE FOCUS</p>
                  <h2>Most-applied titles</h2>
                </div>
                <Link href="/profiles">Career profiles →</Link>
              </div>
              <div className="analytics-ranking-list">
                {data.top_titles.map((item, index) => (
                  <div key={item.title}>
                    <span className="analytics-rank">{index + 1}</span>
                    <div><strong>{item.title}</strong><span className="analytics-mini-track"><i style={{ width: `${(item.count / maxTitle) * 100}%` }} /></span></div>
                    <b>{item.count}</b>
                  </div>
                ))}
                {!data.top_titles.length ? <p className="muted">No role application data yet.</p> : null}
              </div>
            </article>
          </section>
        </>
      ) : null}

      {!loading && !data && !error ? (
        <EmptyState
          title="Analytics will appear as your search grows"
          description="Run job searches, score opportunities, and track applications to begin measuring career-search performance."
          action={<Link className="button" href="/jobs">Search opportunities</Link>}
        />
      ) : null}
    </>
  );
}
