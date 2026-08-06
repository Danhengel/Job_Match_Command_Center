"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { EmptyState, Notice, PageHeader } from "@/components/ui";
import { api } from "@/lib/api";


type Profile = {
  id: number;
  name: string;
  target_titles: string[];
};

type Result = {
  job: {
    id: number;
    title: string;
    company: string;
    location: string;
    url: string;
    source: string;
    posted_at: string;
    salary: string;
    employment_type: string;
    remote: boolean;
  };
  match: {
    score: number;
    title_score: number;
    keyword_score: number;
    location_score: number;
    resume_score: number;
    matched_keywords: string[];
    missing_keywords: string[];
    concerns: string[];
    explanation: string;
  };
};

type History = {
  id: number;
  searched_sources: string[];
  query_titles: string[];
  raw_count: number;
  unique_count: number;
  matched_count: number;
  minimum_score: number;
  source_counts: Record<string, number>;
  created_at: string;
};

type BelowThreshold = {
  score: number;
  title: string;
  company: string;
  source: string;
};

type SearchSummary = {
  raw: number;
  unique: number;
  matched: number;
  cache: boolean;
  searchedSources: string[];
  sourceCounts: Record<string, number>;
  coverageNotes: string[];
};

type SortMode = "match" | "newest" | "company";


function uniqueNotices(errors: string[]) {
  const normalized = new Map<
    string,
    { message: string; count: number }
  >();

  errors.forEach((message) => {
    const key = message
      .replace(/https?:\/\/\S+/g, "URL")
      .replace(/\d+/g, "#")
      .trim();
    const existing = normalized.get(key);
    normalized.set(
      key,
      existing
        ? { ...existing, count: existing.count + 1 }
        : { message, count: 1 },
    );
  });

  return Array.from(normalized.values());
}


function matchLabel(score: number) {
  if (score >= 85) return "Exceptional alignment";
  if (score >= 70) return "Strong alignment";
  if (score >= 55) return "Meaningful alignment";
  return "Exploratory alignment";
}


function postedLabel(value: string) {
  if (!value) return "Posting date unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const days = Math.max(
    0,
    Math.floor((Date.now() - date.getTime()) / 86400000),
  );
  if (days === 0) return "Posted today";
  if (days === 1) return "Posted yesterday";
  if (days < 30) return `Posted ${days} days ago`;
  return `Posted ${date.toLocaleDateString()}`;
}


export default function JobsPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [profileId, setProfileId] = useState("");
  const [titles, setTitles] = useState("");
  const [location, setLocation] = useState(
    "Tampa, Florida or Remote",
  );
  const [minimum, setMinimum] = useState(45);
  const [results, setResults] = useState<Result[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [summary, setSummary] = useState<SearchSummary | null>(
    null,
  );
  const [catalog, setCatalog] = useState<{
    greenhouse: number;
    lever: number;
    ashby: number;
  } | null>(null);
  const [history, setHistory] = useState<History[]>([]);
  const [topBelow, setTopBelow] = useState<BelowThreshold[]>([]);
  const [useCatalog, setUseCatalog] = useState(true);
  const [useRemotive, setUseRemotive] = useState(true);
  const [useJSearch, setUseJSearch] = useState(true);
  const [greenhouse, setGreenhouse] = useState("");
  const [lever, setLever] = useState("");
  const [ashby, setAshby] = useState("");
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [resultQuery, setResultQuery] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("match");

  const loadHistory = () =>
    api("/api/jobs/history")
      .then(setHistory)
      .catch(() => undefined);

  async function loadSavedMatches(id: string) {
    if (!id) {
      setResults([]);
      return;
    }

    setLoadingSaved(true);
    setErrors([]);
    setTopBelow([]);
    setSummary(null);

    try {
      const data = await api(`/api/jobs/matches/${id}`);
      setResults(Array.isArray(data) ? data : []);
    } catch (error) {
      setResults([]);
      setErrors([
        error instanceof Error
          ? error.message
          : "Could not load saved job matches",
      ]);
    } finally {
      setLoadingSaved(false);
    }
  }

  useEffect(() => {
    let active = true;

    async function loadPage() {
      try {
        const [profileData, catalogData, historyData] =
          await Promise.all([
            api("/api/profiles"),
            api("/api/jobs/catalog"),
            api("/api/jobs/history").catch(() => []),
          ]);

        if (!active) return;

        setProfiles(profileData);
        setCatalog(catalogData);
        setHistory(historyData);

        const savedLocation = window.localStorage.getItem(
          "careeros-search-location",
        );
        if (savedLocation) setLocation(savedLocation);

        if (profileData[0]) {
          const firstProfileId = String(profileData[0].id);
          setProfileId(firstProfileId);
          setTitles(
            (profileData[0].target_titles || []).join("\n"),
          );

          setLoadingSaved(true);
          try {
            const savedMatches = await api(
              `/api/jobs/matches/${firstProfileId}`,
            );
            if (active) {
              setResults(
                Array.isArray(savedMatches) ? savedMatches : [],
              );
            }
          } catch (error) {
            if (active) {
              setErrors([
                error instanceof Error
                  ? error.message
                  : "Could not load saved job matches",
              ]);
            }
          } finally {
            if (active) setLoadingSaved(false);
          }
        }
      } catch (error) {
        if (!active) return;
        setErrors([
          error instanceof Error
            ? error.message
            : "Could not load the jobs page",
        ]);
      }
    }

    void loadPage();

    return () => {
      active = false;
    };
  }, []);

  const groupedNotices = useMemo(
    () => uniqueNotices(errors),
    [errors],
  );

  const publisherEntries = useMemo(
    () =>
      Object.entries(summary?.sourceCounts || {}).sort(
        (left, right) =>
          right[1] - left[1]
          || left[0].localeCompare(right[0]),
      ),
    [summary],
  );

  const visibleResults = useMemo(() => {
    const query = resultQuery.trim().toLowerCase();
    const filtered = results.filter((result) => {
      if (remoteOnly && !result.job.remote) return false;
      if (!query) return true;
      return [
        result.job.title,
        result.job.company,
        result.job.location,
        result.job.source,
        ...(result.match.matched_keywords || []),
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });

    return [...filtered].sort((a, b) => {
      if (sortMode === "company") {
        return a.job.company.localeCompare(b.job.company);
      }
      if (sortMode === "newest") {
        return (
          new Date(b.job.posted_at || 0).getTime()
          - new Date(a.job.posted_at || 0).getTime()
        );
      }
      return b.match.score - a.match.score;
    });
  }, [results, remoteOnly, resultQuery, sortMode]);

  async function selectProfile(id: string) {
    setProfileId(id);
    setResults([]);
    const profile = profiles.find(
      (item) => String(item.id) === id,
    );
    if (profile) {
      setTitles((profile.target_titles || []).join("\n"));
    }
    await loadSavedMatches(id);
  }

  async function search(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setErrors([]);
    setTopBelow([]);
    setSummary(null);
    window.localStorage.setItem(
      "careeros-search-location",
      location,
    );

    try {
      const data = await api("/api/jobs/search", {
        method: "POST",
        body: JSON.stringify({
          profile_id: Number(profileId),
          titles: titles
            .split("\n")
            .map((value) => value.trim())
            .filter(Boolean),
          use_remotive: useRemotive,
          use_catalog: useCatalog,
          use_jsearch: useJSearch,
          jsearch_location: location,
          minimum_score: minimum,
          greenhouse_boards: greenhouse
            .split("\n")
            .map((value) => value.trim())
            .filter(Boolean),
          lever_boards: lever
            .split("\n")
            .map((value) => value.trim())
            .filter(Boolean),
          ashby_boards: ashby
            .split("\n")
            .map((value) => value.trim())
            .filter(Boolean),
        }),
      });

      setResults(data.results || []);
      setErrors(data.errors || []);
      setTopBelow(data.top_below_threshold || []);
      setSummary({
        raw: data.searched || 0,
        unique: data.unique_jobs || 0,
        matched: data.results?.length || 0,
        cache: Boolean(data.cache?.connected),
        searchedSources: data.searched_sources || [],
        sourceCounts: data.source_counts || {},
        coverageNotes: data.coverage_notes || [],
      });
      await loadHistory();
    } catch (error) {
      setErrors([
        error instanceof Error
          ? error.message
          : "Search failed",
      ]);
      setSummary(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="PRIVATE MARKET INTELLIGENCE"
        title="Read the market through your mandate"
        description="Review the broad market, remove noise and duplication, and evaluate each opportunity against your position, evidence, and ambition."
        actions={
          <Link className="button secondary" href="/profiles">
            Review executive position
          </Link>
        }
      />

      <section className="universal-search-bar">
        <div>
          <span>Opportunity mandate</span>
          <strong>
            {titles.split("\n").filter(Boolean).length || 0}
            {" "}target titles
          </strong>
        </div>
        <div>
          <span>Market geography</span>
          <strong>{location || "Any location"}</strong>
        </div>
        <div>
          <span>Selection threshold</span>
          <strong>{minimum}% alignment</strong>
        </div>
      </section>

      <div className="jobs-shell-grid">
        <form className="card jobs-filter-card" onSubmit={search}>
          <p className="eyebrow">THE MANDATE</p>
          <h2>Set the intelligence brief</h2>

          <label>Executive position</label>
          <select
            value={profileId}
            onChange={(event) => {
              void selectProfile(event.target.value);
            }}
            required
          >
            <option value="">Select position</option>
            {profiles.map((profile) => (
              <option key={profile.id} value={profile.id}>
                {profile.name}
              </option>
            ))}
          </select>

          <label>Target positions, one per line</label>
          <textarea
            rows={7}
            value={titles}
            onChange={(event) => setTitles(event.target.value)}
            placeholder={
              "Director, Loan Operations\n"
              + "VP, Construction Lending"
            }
          />

          <label>Market geography or remote preference</label>
          <input
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            placeholder="Tampa, Florida or Remote"
          />

          <label>Minimum alignment: {minimum}%</label>
          <input
            type="range"
            min="0"
            max="100"
            value={minimum}
            onChange={(event) =>
              setMinimum(Number(event.target.value))
            }
          />

          <div className="source-options" aria-label="Intelligence sources">
            <label>
              <input
                type="checkbox"
                checked={useCatalog}
                onChange={(event) =>
                  setUseCatalog(event.target.checked)
                }
              />
              {" "}Direct organization sources{" "}
              {catalog
                ? `(${catalog.greenhouse
                    + catalog.lever
                    + catalog.ashby} boards)`
                : ""}
            </label>
            <label>
              <input
                type="checkbox"
                checked={useRemotive}
                onChange={(event) =>
                  setUseRemotive(event.target.checked)
                }
              />
              {" "}Remote opportunity intelligence
            </label>
            <label>
              <input
                type="checkbox"
                checked={useJSearch}
                onChange={(event) =>
                  setUseJSearch(event.target.checked)
                }
              />
              {" "}Broad-market publisher intelligence
            </label>
          </div>

          <details>
            <summary>Add selected organization sources</summary>
            <label>Greenhouse board tokens or URLs</label>
            <textarea
              rows={3}
              value={greenhouse}
              onChange={(event) => setGreenhouse(event.target.value)}
            />
            <label>Lever site names or URLs</label>
            <textarea
              rows={3}
              value={lever}
              onChange={(event) => setLever(event.target.value)}
            />
            <label>Ashby board names or URLs</label>
            <textarea
              rows={3}
              value={ashby}
              onChange={(event) => setAshby(event.target.value)}
            />
          </details>

          <button disabled={busy || !profileId || !titles.trim()}>
            {busy
              ? "Reviewing and auditing the market…"
              : "Commission market review"}
          </button>
        </form>

        <div className="jobs-insight-stack">
          {loadingSaved ? (
            <Notice title="Preparing saved intelligence" tone="info">
              <p>
                CareerNavIQ is restoring selected opportunities already
                evaluated for this position.
              </p>
            </Notice>
          ) : null}

          {busy ? (
            <Notice title="Reviewing the current market" tone="info">
              <p>
                CareerNavIQ is reading enabled sources, removing noise,
                and recalculating opportunity alignment.
              </p>
            </Notice>
          ) : null}

          {!summary && results.length && !loadingSaved && !busy ? (
            <Notice
              title={`${results.length} selected opportunities restored`}
              tone="info"
            >
              <p>
                These opportunity dossiers were retained from earlier market reviews.
                Commission a new review to refresh the intelligence.
              </p>
            </Notice>
          ) : null}

          {summary ? (
            <section className="card">
              <p className="eyebrow">MARKET REVIEW</p>
              <h2>{summary.matched} selected opportunities</h2>
              <div className="source-health">
                <div>
                  <strong>{summary.raw}</strong>
                  <span>Signals reviewed</span>
                </div>
                <div>
                  <strong>{summary.unique}</strong>
                  <span>Distinct opportunities</span>
                </div>
                <div>
                  <strong>{summary.matched}</strong>
                  <span>Selected for review</span>
                </div>
              </div>
              <p className="muted">
                Intelligence cache: {summary.cache ? "connected" : "offline"}
              </p>
              {publisherEntries.length ? (
                <details className="provider-details">
                  <summary>View publisher breakdown</summary>
                  {publisherEntries.map(([publisher, count]) => (
                    <div className="history-row" key={publisher}>
                      <strong>{publisher}</strong>
                      <small>
                        {count} posting{count === 1 ? "" : "s"}
                      </small>
                    </div>
                  ))}
                </details>
              ) : null}
              {summary.coverageNotes.length ? (
                <details className="provider-details">
                  <summary>View no-result notices</summary>
                  {summary.coverageNotes.map((note, index) => (
                    <p key={index}>{note}</p>
                  ))}
                </details>
              ) : null}
            </section>
          ) : null}

          {groupedNotices.length ? (
            <Notice
              title={`${errors.length} issue${
                errors.length === 1 ? "" : "s"
              } found`}
              tone="warning"
            >
              {groupedNotices.map((notice, index) => (
                <p key={index}>
                  {notice.message}
                  {notice.count > 1
                    ? ` (${notice.count} similar notices)`
                    : ""}
                </p>
              ))}
            </Notice>
          ) : null}

          <section className="card">
            <div className="row between">
              <div>
                <p className="eyebrow">INTELLIGENCE LEDGER</p>
                <h2>Recent market reviews</h2>
              </div>
              <span className="muted">Last five</span>
            </div>
            {history.slice(0, 5).map((item) => (
              <div className="history-row" key={item.id}>
                <strong>
                  {item.unique_count} reviewed • {item.matched_count} selected
                </strong>
                <small>
                  {item.searched_sources.join(" + ") || "Custom boards"}
                  {" "}• threshold {item.minimum_score}
                </small>
              </div>
            ))}
            {!history.length ? (
              <p className="muted">
                Your completed market reviews will appear here.
              </p>
            ) : null}
          </section>
        </div>
      </div>

      <section className="results-toolbar">
        <div>
          <p className="eyebrow">SELECTED INTELLIGENCE</p>
          <h2>Opportunity dossiers</h2>
          <span className="muted">
            Showing {visibleResults.length} of {results.length}
          </span>
        </div>
        <div className="result-controls">
          <input
            value={resultQuery}
            onChange={(event) => setResultQuery(event.target.value)}
            placeholder="Refine by position, organization, evidence, source…"
            aria-label="Refine opportunity dossiers"
          />
          <label className="inline-check">
            <input
              type="checkbox"
              checked={remoteOnly}
              onChange={(event) => setRemoteOnly(event.target.checked)}
            />
            {" "}Remote only
          </label>
          <select
            value={sortMode}
            onChange={(event) =>
              setSortMode(event.target.value as SortMode)
            }
            aria-label="Sort results"
          >
            <option value="match">Highest alignment</option>
            <option value="newest">Newest intelligence</option>
            <option value="company">Organization name</option>
          </select>
        </div>
      </section>

      {visibleResults.map((result) => (
        <article
          className="job-card-modern"
          key={`${result.job.source}-${result.job.id}`}
        >
          <div className="row between job-card-heading">
            <div>
              <div className="row wrap">
                <span className="badge">{result.job.source}</span>
                {result.job.remote ? (
                  <span className="badge">Remote</span>
                ) : null}
                {result.job.employment_type ? (
                  <span className="badge">
                    {result.job.employment_type}
                  </span>
                ) : null}
                {result.job.salary ? (
                  <span className="badge metric-badge">
                    {result.job.salary}
                  </span>
                ) : null}
              </div>
              <h2>{result.job.title}</h2>
              <p className="muted">
                {result.job.company} •{" "}
                {result.job.location || "Location not listed"} •{" "}
                {postedLabel(result.job.posted_at)}
              </p>
            </div>
            <div className="job-score-modern">
              {result.match.score}
              <small>alignment</small>
            </div>
          </div>

          <p>
            <strong>{matchLabel(result.match.score)}.</strong>{" "}
            {result.match.explanation}
          </p>

          <div className="match-evidence-grid">
            <div>
              <span>Title alignment</span>
              <strong>{result.match.title_score}</strong>
            </div>
            <div>
              <span>Skills alignment</span>
              <strong>{result.match.keyword_score}</strong>
            </div>
            <div>
              <span>Location fit</span>
              <strong>{result.match.location_score}</strong>
            </div>
            <div>
              <span>Résumé evidence</span>
              <strong>{result.match.resume_score}</strong>
            </div>
          </div>

          {result.match.matched_keywords.length ? (
            <p>
              <strong>Matched evidence:</strong>{" "}
              {result.match.matched_keywords.slice(0, 10).join(" • ")}
            </p>
          ) : null}

          {result.match.missing_keywords.length ? (
            <p className="muted">
              <strong>Potential gaps:</strong>{" "}
              {result.match.missing_keywords.slice(0, 6).join(" • ")}
            </p>
          ) : null}

          {result.match.concerns.length ? (
            <p className="warn-text">
              <strong>Consider before advancing:</strong>{" "}
              {result.match.concerns.join(" • ")}
            </p>
          ) : null}

          <div className="row wrap job-actions">
            <Link
              className="button"
              href={`/jobs/${result.job.id}?profile_id=${profileId}`}
            >
              Open opportunity dossier
            </Link>
            <Link
              className="button secondary"
              href={`/applications?job_id=${result.job.id}`}
            >
              Add to portfolio
            </Link>
            <a
              className="button secondary"
              href={result.job.url}
              target="_blank"
              rel="noreferrer"
            >
              View source
            </a>
          </div>
        </article>
      ))}

      {!visibleResults.length && results.length ? (
        <EmptyState
          title="No dossiers match the current refinement"
          description="Clear the refinement or turn off Remote only to see the full selected set."
        />
      ) : null}

      {!results.length && topBelow.length ? (
        <section className="card">
          <h2>Signals just below your threshold</h2>
          <p className="muted">
            These opportunities were identified but did not clear the current
            minimum alignment threshold.
          </p>
          {topBelow.map((item, index) => (
            <div className="history-row" key={index}>
              <strong>{item.score} • {item.title}</strong>
              <small>{item.company} • {item.source}</small>
            </div>
          ))}
        </section>
      ) : null}

      {!results.length
      && !topBelow.length
      && !busy
      && !loadingSaved ? (
        <EmptyState
          title="No selected intelligence yet"
          description="Confirm the position and opportunity mandate above, then commission a market review."
        />
      ) : null}
    </>
  );
}
