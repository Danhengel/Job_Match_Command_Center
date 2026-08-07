"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { EmptyState, MetricStrip, Notice, PageHeader, SectionHeader } from "@/components/ui";
import { api } from "@/lib/api";

type CompanyTitle = { title: string; count?: number };
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
      .catch((err) => { if (active) setError(err instanceof Error ? err.message : "Unable to load target companies."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function watch(company: string, watched: boolean) {
    setBusyCompany(company);
    setError("");
    try {
      if (watched) {
        await api(`/api/intelligence/companies/watch/${encodeURIComponent(company)}`, { method: "DELETE" });
      } else {
        await api("/api/intelligence/companies/watch", { method: "POST", body: JSON.stringify({ company, notes: "" }) });
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update company watchlist.");
    } finally {
      setBusyCompany("");
    }
  }

  const visibleCompanies = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return items;
    return items.filter((company) => [company.company, ...company.top_titles.map((item) => item.title)].join(" ").toLowerCase().includes(normalized));
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
        eyebrow="TARGET COMPANIES"
        title="Evaluate the organizations behind your strongest opportunities"
        description="Compare hiring activity, remote availability, salary transparency, and your existing pursuit history before deciding where to invest attention."
        actions={<Link className="button secondary" href="/company-watches">Company watchlist</Link>}
      />

      {error ? <Notice title="Target company intelligence needs attention" tone="error"><p>{error}</p></Notice> : null}

      {!loading && items.length ? (
        <MetricStrip
          ariaLabel="Target company summary"
          items={[
            { label: "Companies", value: summary.companies, detail: "in current opportunity data" },
            { label: "Open roles", value: summary.openJobs, detail: "across evaluated companies" },
            { label: "Watchlist", value: summary.watched, detail: "companies monitored" },
            { label: "Active pursuits", value: summary.applications, detail: "connected opportunities" },
          ]}
        />
      ) : null}

      <section className="executive-panel company-intelligence-panel">
        <SectionHeader
          eyebrow="COMPANY INTELLIGENCE"
          title={`${visibleCompanies.length} compan${visibleCompanies.length === 1 ? "y" : "ies"} in view`}
          description="Open a company to review current roles, recurring titles, and your existing activity."
          actions={<label htmlFor="company-search"><span className="sr-only">Filter companies</span><input id="company-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search company or title" /></label>}
        />

        {loading ? <div className="executive-loading-inline"><strong>Preparing company intelligence…</strong><span>Connecting evaluated roles and active pursuits.</span></div> : null}

        {!loading && visibleCompanies.length ? (
          <section className="company-grid" aria-label="Target companies">
            {visibleCompanies.map((company) => (
              <article className="card company-card-modern" key={company.company}>
                <header className="company-card-head">
                  <div className="company-avatar" aria-hidden="true">{company.company.trim().slice(0, 1).toUpperCase() || "C"}</div>
                  <div><div className="row wrap"><span className="badge">{company.open_job_count} open role{company.open_job_count === 1 ? "" : "s"}</span>{company.watched ? <span className="score-pill">Watchlist</span> : null}</div><h2>{company.company}</h2></div>
                </header>
                <div className="company-metric-row">
                  <div><strong>{company.remote_job_count}</strong><span>Remote</span></div>
                  <div><strong>{company.salary_listed_count}</strong><span>Salary listed</span></div>
                  <div><strong>{company.application_count}</strong><span>Pursuits</span></div>
                </div>
                <div className="company-title-list">
                  <span>Frequent titles</span>
                  <div>{company.top_titles.length ? company.top_titles.slice(0, 4).map((item) => <span key={item.title}>{item.title}</span>) : <p className="muted">No titles saved yet.</p>}</div>
                </div>
                <footer className="company-card-actions">
                  <button type="button" className={company.watched ? "secondary" : ""} disabled={busyCompany === company.company} onClick={() => void watch(company.company, company.watched)}>{busyCompany === company.company ? "Updating…" : company.watched ? "Remove from watchlist" : "Add to watchlist"}</button>
                  <Link className="button secondary" href={`/companies/${encodeURIComponent(company.company)}`}>Open company</Link>
                </footer>
              </article>
            ))}
          </section>
        ) : null}

        {!loading && !visibleCompanies.length && !error ? (
          <EmptyState
            title={query ? "No companies match this filter" : "No target companies yet"}
            description={query ? "Try a broader company name or role title." : "Run market intelligence or save active opportunities to populate company intelligence."}
            action={query ? <button type="button" className="secondary" onClick={() => setQuery("")}>Clear filter</button> : <Link className="button" href="/jobs">Open market intelligence</Link>}
          />
        ) : null}
      </section>
    </>
  );
}
