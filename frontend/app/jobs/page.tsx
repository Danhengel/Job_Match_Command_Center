"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { EmptyState, Notice, PageHeader, SectionHeader } from "@/components/ui";
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
    matched_keywords: string[];
    missing_keywords: string[];
    concerns: string[];
    explanation: string;
  };
};

type SearchSummary = {
  searched: number;
  unique: number;
  matched: number;
};

type SourceSelection = {
  jsearch: boolean;
  employerSites: boolean;
  remotive: boolean;
  remoteOk: boolean;
  jobicy: boolean;
  expandedWeb: boolean;
};

type SortMode = "match" | "newest" | "company";
type ViewFilter = "all" | "strong" | "exceptional" | "remote";
type FeedbackValue = "relevant" | "not_relevant" | "reviewed";
type FeedbackReason =
  | "wrong_seniority"
  | "wrong_specialty"
  | "wrong_location"
  | "compensation"
  | "technical_role"
  | "closed_posting"
  | "other";
type FeedbackEntry = {
  value: FeedbackValue;
  reason?: FeedbackReason;
  title?: string;
  company?: string;
  location?: string;
};
type FeedbackState = Record<string, FeedbackEntry | FeedbackValue>;

const defaultSources: SourceSelection = {
  jsearch: true,
  employerSites: true,
  remotive: true,
  remoteOk: true,
  jobicy: true,
  expandedWeb: true,
};

function postedLabel(value: string) {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const days = Math.max(0, Math.floor((Date.now() - date.getTime()) / 86400000));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;
  return date.toLocaleDateString();
}

function alignmentLabel(score: number) {
  if (score >= 85) return "Excellent match";
  if (score >= 70) return "Strong match";
  if (score >= 55) return "Good potential";
  return "Explore";
}

function cleanError(message: string) {
  if (/RetryError|Traceback|HTTPError|<Future|0x[\da-f]+/i.test(message)) {
    return "One source was temporarily unavailable. The rest of the search completed normally.";
  }
  return message.replace(/https?:\/\/\S+/g, "the source");
}

function feedbackValue(entry?: FeedbackEntry | FeedbackValue) {
  return typeof entry === "string" ? entry : entry?.value;
}

function titleLevel(value: string) {
  const title = value.toLowerCase();
  if (/vice president|\bvp\b|head of/.test(title)) return "executive";
  if (/senior director|\bsr\.? director/.test(title)) return "senior_director";
  if (/director/.test(title)) return "director";
  if (/manager/.test(title)) return "manager";
  if (/analyst|specialist|coordinator|associate/.test(title)) return "individual";
  return "other";
}

function learnedSuppression(result: Result, feedback: FeedbackState) {
  return Object.values(feedback).some((rawEntry) => {
    if (typeof rawEntry === "string" || rawEntry.value !== "not_relevant") return false;
    if (rawEntry.reason === "wrong_seniority") {
      return titleLevel(rawEntry.title || "") === titleLevel(result.job.title);
    }
    if (rawEntry.reason === "wrong_location") {
      return Boolean(rawEntry.location) && rawEntry.location === result.job.location;
    }
    if (rawEntry.reason === "technical_role") {
      return /analytics|data science|machine learning|software|engineer/i.test(result.job.title);
    }
    return false;
  });
}

export default function JobsPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [profileId, setProfileId] = useState("");
  const [titles, setTitles] = useState("");
  const [location, setLocation] = useState("Tampa, Florida or Remote");
  const [results, setResults] = useState<Result[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [summary, setSummary] = useState<SearchSummary | null>(null);
  const [resultQuery, setResultQuery] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("match");
  const [viewFilter, setViewFilter] = useState<ViewFilter>("all");
  const [greenhouse, setGreenhouse] = useState("");
  const [lever, setLever] = useState("");
  const [ashby, setAshby] = useState("");
  const [sources, setSources] = useState<SourceSelection>(defaultSources);
  const [feedback, setFeedback] = useState<FeedbackState>({});

  async function loadSavedMatches(id: string) {
    if (!id) {
      setResults([]);
      return;
    }
    setLoadingSaved(true);
    setErrors([]);
    setSummary(null);
    try {
      const data = await api(`/api/jobs/matches/${id}`);
      setResults(Array.isArray(data) ? data : []);
    } catch (error) {
      setResults([]);
      setErrors([error instanceof Error ? error.message : "Could not load saved opportunities."]);
    } finally {
      setLoadingSaved(false);
    }
  }

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const savedFeedback = window.localStorage.getItem("careernaviq-job-feedback");
        if (savedFeedback) {
          try {
            setFeedback(JSON.parse(savedFeedback) as FeedbackState);
          } catch {
            window.localStorage.removeItem("careernaviq-job-feedback");
          }
        }
        const profileData = await api("/api/profiles");
        if (!active) return;
        const normalizedProfiles = Array.isArray(profileData) ? profileData : [];
        setProfiles(normalizedProfiles);
        const savedLocation = window.localStorage.getItem("careeros-search-location");
        if (savedLocation) setLocation(savedLocation);
        if (normalizedProfiles[0]) {
          const id = String(normalizedProfiles[0].id);
          setProfileId(id);
          setTitles((normalizedProfiles[0].target_titles || []).join("\n"));
          await loadSavedMatches(id);
        }
      } catch (error) {
        if (active) setErrors([error instanceof Error ? error.message : "Could not prepare job search."]);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const visibleResults = useMemo(() => {
    const query = resultQuery.trim().toLowerCase();
    const filtered = results.filter((result) => {
      const decision = feedbackValue(feedback[String(result.job.id)]);
      if (decision === "not_relevant" || decision === "reviewed") return false;
      if (learnedSuppression(result, feedback)) return false;
      if (viewFilter === "remote" && !result.job.remote) return false;
      if (viewFilter === "strong" && result.match.score < 70) return false;
      if (viewFilter === "exceptional" && result.match.score < 85) return false;
      if (!query) return true;
      return [
        result.job.title,
        result.job.company,
        result.job.location,
        ...(result.match.matched_keywords || []),
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
    return [...filtered].sort((a, b) => {
      if (sortMode === "company") return a.job.company.localeCompare(b.job.company);
      if (sortMode === "newest") {
        return new Date(b.job.posted_at || 0).getTime() - new Date(a.job.posted_at || 0).getTime();
      }
      const aBoost = feedbackValue(feedback[String(a.job.id)]) === "relevant" ? 8 : 0;
      const bBoost = feedbackValue(feedback[String(b.job.id)]) === "relevant" ? 8 : 0;
      return (b.match.score + bBoost) - (a.match.score + aBoost);
    });
  }, [results, resultQuery, sortMode, viewFilter, feedback]);

  function setJobFeedback(
    result: Result,
    value: FeedbackValue,
    reason?: FeedbackReason,
  ) {
    setFeedback((current) => {
      const next = {
        ...current,
        [String(result.job.id)]: {
          value,
          reason,
          title: result.job.title,
          company: result.job.company,
          location: result.job.location,
        },
      };
      window.localStorage.setItem(
        "careernaviq-job-feedback",
        JSON.stringify(next),
      );
      return next;
    });
  }

  async function selectProfile(id: string) {
    setProfileId(id);
    const profile = profiles.find((item) => String(item.id) === id);
    if (profile) setTitles((profile.target_titles || []).join("\n"));
    setViewFilter("all");
    await loadSavedMatches(id);
  }

  function setSource<K extends keyof SourceSelection>(key: K, checked: boolean) {
    setSources((current) => ({ ...current, [key]: checked }));
  }

  function setAllSources(checked: boolean) {
    setSources({
      jsearch: checked,
      employerSites: checked,
      remotive: checked,
      remoteOk: checked,
      jobicy: checked,
      expandedWeb: checked,
    });
  }

  async function search(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setErrors([]);
    setSummary(null);
    window.localStorage.setItem("careeros-search-location", location);

    const anySourceSelected = Object.values(sources).some(Boolean);
    if (!anySourceSelected) {
      setErrors(["Select at least one search source."]);
      setBusy(false);
      return;
    }

    try {
      const endpoint = "/api/jobs/search";
      const data = await api(endpoint, {
        method: "POST",
        body: JSON.stringify({
          profile_id: Number(profileId),
          titles: titles.split("\n").map((value) => value.trim()).filter(Boolean),
          use_jsearch: sources.jsearch,
          use_remotive: sources.remotive || sources.remoteOk || sources.jobicy,
          use_remoteok: sources.remoteOk,
          use_jobicy: sources.jobicy,
          use_himalayas: false,
          use_catalog: sources.employerSites,
          use_saved_career_pages: sources.employerSites,
          jsearch_location: location,
          minimum_score: 25,
          greenhouse_boards: sources.employerSites ? greenhouse.split("\n").map((value) => value.trim()).filter(Boolean) : [],
          lever_boards: sources.employerSites ? lever.split("\n").map((value) => value.trim()).filter(Boolean) : [],
          ashby_boards: sources.employerSites ? ashby.split("\n").map((value) => value.trim()).filter(Boolean) : [],
        }),
      });
      setResults(data.results || []);
      setErrors((data.errors || []).map(cleanError));
      setSummary({
        searched: data.searched || 0,
        unique: data.unique_jobs || 0,
        matched: data.results?.length || 0,
      });
      setViewFilter("all");
    } catch (error) {
      setErrors([cleanError(error instanceof Error ? error.message : "Job search failed.")]);
    } finally {
      setBusy(false);
    }
  }

  const targetCount = titles.split("\n").filter(Boolean).length;
  const strongCount = results.filter((item) => item.match.score >= 70).length;
  const excellentCount = results.filter((item) => item.match.score >= 85).length;
  const remoteCount = results.filter((item) => item.job.remote).length;
  const selectedSourceCount = Object.values(sources).filter(Boolean).length;
  const allSourcesSelected = selectedSourceCount === Object.keys(defaultSources).length;

  return (
    <>
      <PageHeader
        eyebrow="JOB SEARCH"
        title="Find your next role"
        description="Choose the sources you want CareerNavIQ to search, see the strongest matches first, and move directly from a job into a tailored résumé."
        actions={<Link className="button secondary" href="/resumes/studio">Resume Studio</Link>}
      />

      <form className="executive-panel jobs-search-shell" onSubmit={search}>
        <div className="jobs-search-primary">
          <label>
            <span>Career profile</span>
            <select value={profileId} onChange={(event) => void selectProfile(event.target.value)} required>
              <option value="">Select profile</option>
              {profiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.name}</option>)}
            </select>
          </label>
          <label className="jobs-location-field">
            <span>Location</span>
            <input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Tampa, Florida or Remote" />
          </label>
          <button className="jobs-search-button" disabled={busy || !profileId || !titles.trim()}>
            {busy ? "Searching selected sources…" : "Search jobs"}
          </button>
        </div>

        <div className="jobs-search-context">
          <span><strong>{targetCount || 0}</strong> target roles</span>
          <span><strong>{selectedSourceCount}</strong> source groups selected</span>
        </div>

        <fieldset className="jobs-source-selector">
          <legend>Search sources</legend>
          <div className="jobs-source-selector-header">
            <p>Select exactly where CareerNavIQ should look for this search.</p>
            <label className="jobs-source-all">
              <input type="checkbox" checked={allSourcesSelected} onChange={(event) => setAllSources(event.target.checked)} />
              <span>All sources</span>
            </label>
          </div>
          <div className="jobs-source-grid">
            <label className="jobs-source-option">
              <input type="checkbox" checked={sources.jsearch} onChange={(event) => setSource("jsearch", event.target.checked)} />
              <span><strong>JSearch aggregation</strong><small>Broad Google Jobs, Indeed, LinkedIn and other publisher coverage through JSearch.</small></span>
            </label>
            <label className="jobs-source-option">
              <input type="checkbox" checked={sources.employerSites} onChange={(event) => setSource("employerSites", event.target.checked)} />
              <span><strong>Employer career sites</strong><small>Greenhouse, Lever, Ashby and saved employer career pages.</small></span>
            </label>
            <label className="jobs-source-option">
              <input type="checkbox" checked={sources.remotive} onChange={(event) => setSource("remotive", event.target.checked)} />
              <span><strong>Remotive</strong><small>Remote-first job listings.</small></span>
            </label>
            <label className="jobs-source-option">
              <input type="checkbox" checked={sources.remoteOk} onChange={(event) => setSource("remoteOk", event.target.checked)} />
              <span><strong>Remote OK</strong><small>Remote technology and professional roles.</small></span>
            </label>
            <label className="jobs-source-option">
              <input type="checkbox" checked={sources.jobicy} onChange={(event) => setSource("jobicy", event.target.checked)} />
              <span><strong>Jobicy</strong><small>Remote US job listings.</small></span>
            </label>
            <label className="jobs-source-option">
              <input type="checkbox" checked={sources.expandedWeb} onChange={(event) => setSource("expandedWeb", event.target.checked)} />
              <span><strong>Expanded web coverage</strong><small>Additional configured web, public-sector, and aggregator connectors.</small></span>
            </label>
          </div>
        </fieldset>

        <details className="jobs-search-options">
          <summary>Search options</summary>
          <div className="jobs-options-grid">
            <label>
              <span>Target roles</span>
              <textarea rows={5} value={titles} onChange={(event) => setTitles(event.target.value)} placeholder={"Director, Loan Operations\nVP, Construction Lending"} />
              <small>One title per line. These are filled from the selected career profile.</small>
            </label>
            <details className="advanced-market-sources">
              <summary>Optional employer-board overrides</summary>
              <p className="muted">Use these only for a specific employer board you want to force into the search.</p>
              <label>Greenhouse boards</label>
              <textarea rows={2} value={greenhouse} onChange={(event) => setGreenhouse(event.target.value)} disabled={!sources.employerSites} />
              <label>Lever sites</label>
              <textarea rows={2} value={lever} onChange={(event) => setLever(event.target.value)} disabled={!sources.employerSites} />
              <label>Ashby boards</label>
              <textarea rows={2} value={ashby} onChange={(event) => setAshby(event.target.value)} disabled={!sources.employerSites} />
            </details>
          </div>
        </details>
      </form>

      {loadingSaved ? <Notice title="Loading saved opportunities"><p>Restoring the most recent matches for this career profile.</p></Notice> : null}
      {busy ? <Notice title="Searching the market"><p>CareerNavIQ is searching only the source groups you selected, removing duplicates, and ranking the strongest opportunities.</p></Notice> : null}
      {errors.length ? <Notice title="Search source notice" tone="warning"><p>{errors[0]}</p></Notice> : null}

      <section className="executive-panel jobs-results-shell">
        <div className="jobs-results-heading">
          <SectionHeader
            title="Opportunities"
            description={summary ? `${summary.matched} matches from ${summary.unique} unique jobs.` : results.length ? `${results.length} saved opportunities for this profile.` : "Run a search to find current opportunities."}
          />
          <div className="jobs-results-count"><strong>{visibleResults.length}</strong><span>shown</span></div>
        </div>

        {results.length ? (
          <div className="jobs-results-toolbar">
            <div className="jobs-filter-pills" aria-label="Quick filters">
              <button type="button" className={viewFilter === "all" ? "active" : ""} aria-pressed={viewFilter === "all"} onClick={() => setViewFilter("all")}>All <span>{results.length}</span></button>
              <button type="button" className={viewFilter === "strong" ? "active" : ""} aria-pressed={viewFilter === "strong"} onClick={() => setViewFilter("strong")}>70%+ <span>{strongCount}</span></button>
              <button type="button" className={viewFilter === "exceptional" ? "active" : ""} aria-pressed={viewFilter === "exceptional"} onClick={() => setViewFilter("exceptional")}>85%+ <span>{excellentCount}</span></button>
              <button type="button" className={viewFilter === "remote" ? "active" : ""} aria-pressed={viewFilter === "remote"} onClick={() => setViewFilter("remote")}>Remote <span>{remoteCount}</span></button>
            </div>
            <label className="jobs-results-search">
              <span className="sr-only">Filter results</span>
              <input type="search" value={resultQuery} onChange={(event) => setResultQuery(event.target.value)} placeholder="Filter by title or company" />
            </label>
            <select className="jobs-sort" value={sortMode} onChange={(event) => setSortMode(event.target.value as SortMode)} aria-label="Sort opportunities">
              <option value="match">Best match</option>
              <option value="newest">Newest</option>
              <option value="company">Company</option>
            </select>
          </div>
        ) : null}

        {visibleResults.length ? (
          <div className="jobs-card-list">
            {visibleResults.map((result) => (
              <article className="jobs-opportunity-card" key={`${result.job.id}-${result.job.source}`}>
                <div className="jobs-score-badge">
                  <strong>{result.match.score}%</strong>
                  <span>{alignmentLabel(result.match.score)}</span>
                </div>
                <div className="jobs-card-body">
                  <div className="jobs-card-title-row">
                    <div>
                      <h3>{result.job.title}</h3>
                      <p>{result.job.company}</p>
                    </div>
                    {result.job.remote ? <span className="jobs-remote-badge">Remote</span> : null}
                  </div>
                  <div className="jobs-card-meta">
                    <span>{result.job.location || "Location not listed"}</span>
                    {result.job.salary ? <span>{result.job.salary}</span> : null}
                    <span>{postedLabel(result.job.posted_at)}</span>
                    <span>{result.job.source || "Source unavailable"}</span>
                  </div>
                  {result.match.matched_keywords?.length ? (
                    <div className="jobs-keyword-row">
                      {result.match.matched_keywords.slice(0, 4).map((keyword) => <span key={keyword}>{keyword}</span>)}
                    </div>
                  ) : null}
                  {result.match.explanation ? (
                    <details className="jobs-match-details">
                      <summary>Why this matches</summary>
                      <p>{result.match.explanation}</p>
                    </details>
                  ) : null}
                </div>
                <div className="jobs-card-actions">
                  <div className="jobs-feedback-actions" aria-label="Opportunity feedback">
                    <button type="button" className="jobs-feedback-button" onClick={() => setJobFeedback(result, "relevant")}>Relevant</button>
                    <select
                      className="jobs-feedback-button"
                      aria-label="Mark this opportunity not relevant and choose a reason"
                      defaultValue=""
                      onChange={(event) => {
                        const reason = event.target.value as FeedbackReason;
                        if (reason) setJobFeedback(result, "not_relevant", reason);
                      }}
                    >
                      <option value="" disabled>Not relevant because…</option>
                      <option value="wrong_seniority">Wrong seniority</option>
                      <option value="wrong_specialty">Wrong specialty</option>
                      <option value="wrong_location">Wrong location</option>
                      <option value="compensation">Compensation</option>
                      <option value="technical_role">Too technical</option>
                      <option value="closed_posting">Posting closed</option>
                      <option value="other">Other</option>
                    </select>
                    <button type="button" className="jobs-feedback-button" onClick={() => setJobFeedback(result, "reviewed")}>Reviewed</button>
                  </div>
                  <Link className="button" href={`/jobs/${result.job.id}?profile_id=${profileId}`}>View & tailor</Link>
                  {result.job.url ? <a className="jobs-source-link" href={result.job.url} target="_blank" rel="noreferrer">Open posting ↗</a> : null}
                </div>
              </article>
            ))}
          </div>
        ) : !busy && !loadingSaved ? (
          <EmptyState title="No opportunities in this view" description="Try another quick filter, adjust the location, or run a fresh search." />
        ) : null}
      </section>
    </>
  );
}
