"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { EmptyState, Notice, PageHeader } from "@/components/ui";
import { api } from "@/lib/api";

type CompanyJob = {
  id: number;
  title: string;
  location: string;
  source: string;
  salary: string;
  url: string;
  remote?: boolean;
  posted_at?: string;
};

type CompanyDetailData = {
  company: string;
  open_job_count: number;
  application_count: number;
  remote_job_count: number;
  salary_listed_count: number;
  jobs: CompanyJob[];
};

export default function CompanyDetail() {
  const params = useParams<{ company: string }>();
  const decodedCompany = useMemo(
    () => decodeURIComponent(params.company || ""),
    [params.company],
  );
  const [data, setData] = useState<CompanyDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");

    api(`/api/intelligence/companies/${encodeURIComponent(decodedCompany)}`)
      .then((result) => {
        if (active) setData(result);
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : "Unable to load company workspace.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [decodedCompany]);

  return (
    <>
      <PageHeader
        eyebrow="COMPANY WORKSPACE"
        title={data?.company || decodedCompany || "Company intelligence"}
        description={data
          ? `${data.open_job_count} aligned opportunit${data.open_job_count === 1 ? "y" : "ies"}, ${data.application_count} active pursuit${data.application_count === 1 ? "" : "s"}, and ${data.remote_job_count} remote opportunit${data.remote_job_count === 1 ? "y" : "ies"} connected to this organization.`
          : "Review opportunity and application activity for this employer."}
        actions={
          <div className="row wrap">
            <Link className="button secondary" href="/companies">All companies</Link>
            <Link className="button" href="/company-watches">Manage career watches</Link>
          </div>
        }
      />

      {error ? (
        <Notice title="Company workspace could not be loaded" tone="error"><p>{error}</p></Notice>
      ) : null}

      {loading ? (
        <section className="card">
          <p className="eyebrow">LOADING</p>
          <h2>Connecting company opportunities…</h2>
          <p className="muted">CareerNavIQ is loading aligned opportunities and portfolio activity.</p>
        </section>
      ) : null}

      {!loading && data ? (
        <>
          <section className="company-detail-kpis" aria-label={`${data.company} summary`}>
            <article><span>Aligned opportunities</span><strong>{data.open_job_count}</strong><small>current market signals</small></article>
            <article><span>Applications</span><strong>{data.application_count}</strong><small>tracked in your pipeline</small></article>
            <article><span>Remote roles</span><strong>{data.remote_job_count}</strong><small>location-flexible openings</small></article>
            <article><span>Salary listed</span><strong>{data.salary_listed_count}</strong><small>transparent compensation</small></article>
          </section>

          <section className="card company-role-library">
            <div className="row between wrap">
              <div>
                <p className="eyebrow">ROLE LIBRARY</p>
                <h2>Opportunities at {data.company}</h2>
                <p className="muted">Open a role to review the source posting and continue your application strategy.</p>
              </div>
              <span className="badge">{data.jobs.length} role{data.jobs.length === 1 ? "" : "s"}</span>
            </div>

            {data.jobs.length ? (
              <div className="company-role-grid">
                {data.jobs.map((job) => (
                  <article className="company-role-card" key={job.id}>
                    <header>
                      <div>
                        <span className="badge">{job.source || "Job source"}</span>
                        {job.remote ? <span className="score-pill">Remote</span> : null}
                      </div>
                      <h3>{job.title}</h3>
                      <p>{job.location || "Location not listed"}</p>
                    </header>

                    <div className="company-role-meta">
                      {job.salary ? <span>{job.salary}</span> : <span>Salary not listed</span>}
                      {job.posted_at ? <span>Posted {new Date(job.posted_at).toLocaleDateString()}</span> : null}
                    </div>

                    <footer>
                      <a className="button secondary" href={job.url} target="_blank" rel="noreferrer">
                        Open posting
                      </a>
                    </footer>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No roles are connected to this company yet"
                description="Commission a new market review or broaden your target position to discover additional opportunities."
                action={<Link className="button" href="/jobs">Search current jobs</Link>}
              />
            )}
          </section>
        </>
      ) : null}
    </>
  );
}
