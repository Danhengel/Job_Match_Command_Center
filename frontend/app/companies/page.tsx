"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { EmptyState, Notice, PageHeader } from "@/components/ui";
import { api } from "@/lib/api";

type CompanyTitle = {
  title: string;
  count?: number;
};

type Company = {
  company: string;
  open_job_count: number;
  remote_job_count: number;
  salary_listed_count: number;
  application_count: number;
  top_titles: CompanyTitle[];
  watched: boolean;
};

export default function Companies() {
  const [items, setItems] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyCompany, setBusyCompany] = useState("");
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");

  async function load() {
    const data = await api("/api/intelligence/companies");
    setItems(Array.isArray(data) ? data : []);
  }

  useEffect(() => {
    let active = true;

    load()
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : "Unable to load company intelligence.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  async function watch(company: string, watched: boolean) {
    setBusyCompany(company);
    setError("");

    try {
      if (watched) {
        await api(`/api/intelligence/companies/watch/${encodeURIComponent(company)}`, { method: "DELETE" });
      } else {
        await api("/api/intelligence/companies/watch", {
          method: "POST",
          body: JSON.stringify({ company, notes: "" }),
        });
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update company watch.");
    } finally {
      setBusyCompany("");
    }
  }

  const visibleCompanies = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return items;

    return items.filter((company) =>
      [company.company, ...company.top_titles.map((item) => item.title)]
        .join(" ")
        .toLowerCase()
        .includes(normalized),
    );
  }, [items, query]);

  const summary = useMemo(() => ({
    companies: items.length,
    openJobs: items.reduce((total, company) => total + company.open_job_count, 0),
    watched: items.filter((company) => company.watched).length,
    applications: items.reduce((total, company) => total + company.application_count, 0),
  }), [items]);

  return (
    <>
      <PageHeader
        eyebrow="COMPANY INTELLIGENCE"
        title="Know the companies behind your opportunities"
        description="Compare hiring activity, remote availability, salary transparency, and your existing application history before deciding where to focus."
        actions={<Link className="button secondary" href="/company-watches">Manage career watches</Link>}
      />

      {error ? (
        <Notice title="Company intelligence needs attention" tone="error">
          <p>{error}</p>
        </Notice>
      ) : null}

      {!loading && items.length ? (
        <section className="company-summary-grid" aria-label="Company intelligence summary">
          <article><span>Companies</span><strong>{summary.companies}</strong><small>in your opportunity data</small></article>
          <article><span>Open jobs</span><strong>{summary.openJobs}</strong><small>across tracked companies</small></article>
          <article><span>Career watches</span><strong>{summary.watched}</strong><small>companies monitored</small></article>
          <article><span>Applications</span><strong>{summary.applications}</strong><small>connected to companies</small></article>
        </section>
      ) : null}

      <section className="company-toolbar">
        <div>
          <p className="eyebrow">COMPANY DIRECTORY</p>
          <h2>{visibleCompanies.length} compan{visibleCompanies.length === 1 ? "y" : "ies"}</h2>
          <p className="muted">Open a company workspace to review its jobs, titles, and application activity.</p>
        </div>
        <label htmlFor="company-search">
          <span>Filter companies</span>
          <input
            id="company-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search company or title"
          />
        </label>
      </section>

      {loading ? (
        <section className="card">
          <p className="eyebrow">LOADING</p>
          <h2>Building your company intelligence view…</h2>
          <p className="muted">CareerNavIQ is connecting aligned opportunities and portfolio activity.</p>
        </section>
      ) : null}

      {!loading && visibleCompanies.length ? (
        <section className="company-grid" aria-label="Companies">
          {visibleCompanies.map((company) => (
            <article className="card company-card-modern" key={company.company}>
              <header className="company-card-head">
                <div className="company-avatar" aria-hidden="true">
                  {company.company.trim().slice(0, 1).toUpperCase() || "C"}
                </div>
                <div>
                  <div className="row wrap">
                    <span className="badge">{company.open_job_count} open job{company.open_job_count === 1 ? "" : "s"}</span>
                    {company.watched ? <span className="score-pill">Watching</span> : null}
                  </div>
                  <h2>{company.company}</h2>
                </div>
              </header>

              <div className="company-metric-row">
                <div><strong>{company.remote_job_count}</strong><span>Remote</span></div>
                <div><strong>{company.salary_listed_count}</strong><span>Salary listed</span></div>
                <div><strong>{company.application_count}</strong><span>Applications</span></div>
              </div>

              <div className="company-title-list">
                <span>Frequent titles</span>
                <div>
                  {company.top_titles.length
                    ? company.top_titles.slice(0, 4).map((item) => <span key={item.title}>{item.title}</span>)
                    : <p className="muted">No titles saved yet.</p>}
                </div>
              </div>

              <footer className="company-card-actions">
                <button
                  type="button"
                  className={company.watched ? "secondary" : ""}
                  disabled={busyCompany === company.company}
                  onClick={() => void watch(company.company, company.watched)}
                >
                  {busyCompany === company.company
                    ? "Updating…"
                    : company.watched ? "Stop watching" : "Watch company"}
                </button>
                <Link className="button secondary" href={`/companies/${encodeURIComponent(company.company)}`}>
                  Open company
                </Link>
              </footer>
            </article>
          ))}
        </section>
      ) : null}

      {!loading && !visibleCompanies.length && !error ? (
        <EmptyState
          title={query ? "No organizations meet this filter" : "No organization intelligence yet"}
          description={query
            ? "Try a broader company name or role title."
            : "Review the market or save active pursuits to populate organization and opportunity intelligence."}
          action={query
            ? <button type="button" className="secondary" onClick={() => setQuery("")}>Clear filter</button>
            : <Link className="button" href="/jobs">Search current jobs</Link>}
        />
      ) : null}
    </>
  );
}
