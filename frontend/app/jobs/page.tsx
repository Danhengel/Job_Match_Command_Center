"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { EmptyState, Notice, PageHeader } from "@/components/ui";

type Profile = { id: number; name: string; target_titles: string[] };
type Result = {
  job: { id: number; title: string; company: string; location: string; url: string; source: string; posted_at: string; salary: string; employment_type: string; remote: boolean };
  match: { score: number; title_score: number; keyword_score: number; location_score: number; resume_score: number; matched_keywords: string[]; missing_keywords: string[]; concerns: string[]; explanation: string };
};
type History = { id: number; searched_sources: string[]; query_titles: string[]; raw_count: number; unique_count: number; matched_count: number; minimum_score: number; created_at: string };
type BelowThreshold = { score: number; title: string; company: string; source: string };
type SortMode = "match" | "newest" | "company";

function uniqueNotices(errors: string[]) {
  const normalized = new Map<string, { message: string; count: number }>();
  errors.forEach((message) => {
    const key = message.replace(/https?:\/\/\S+/g, "URL").replace(/\d+/g, "#").trim();
    const existing = normalized.get(key);
    normalized.set(key, existing ? { ...existing, count: existing.count + 1 } : { message, count: 1 });
  });
  return Array.from(normalized.values());
}

function matchLabel(score: number) {
  if (score >= 85) return "Excellent match";
  if (score >= 70) return "Strong match";
  if (score >= 55) return "Good match";
  return "Possible match";
}

function postedLabel(value: string) {
  if (!value) return "Posting date unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const days = Math.max(0, Math.floor((Date.now() - date.getTime()) / 86400000));
  if (days === 0) return "Posted today";
  if (days === 1) return "Posted yesterday";
  if (days < 30) return `Posted ${days} days ago`;
  return `Posted ${date.toLocaleDateString()}`;
}

export default function JobsPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [profileId, setProfileId] = useState("");
  const [titles, setTitles] = useState("");
  const [location, setLocation] = useState("Tampa, Florida or Remote");
  const [minimum, setMinimum] = useState(45);
  const [results, setResults] = useState<Result[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [summary, setSummary] = useState<{ unique: number; matched: number; cache: boolean } | null>(null);
  const [catalog, setCatalog] = useState<{ greenhouse: number; lever: number; ashby: number } | null>(null);
  const [history, setHistory] = useState<History[]>([]);
  const [topBelow, setTopBelow] = useState<BelowThreshold[]>([]);
  const [useCatalog, setUseCatalog] = useState(true);
  const [useRemotive, setUseRemotive] = useState(true);
  const [useJSearch, setUseJSearch] = useState(false);
  const [greenhouse, setGreenhouse] = useState("");
  const [lever, setLever] = useState("");
  const [ashby, setAshby] = useState("");
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [resultQuery, setResultQuery] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("match");

  const loadHistory = () => api("/api/jobs/history").then(setHistory).catch(() => undefined);

  useEffect(() => {
    let active = true;
    Promise.all([api("/api/profiles"), api("/api/jobs/catalog")]).then(([profileData, catalogData]) => {
      if (!active) return;
      setProfiles(profileData);
      setCatalog(catalogData);
      if (profileData[0]) {
        setProfileId(String(profileData[0].id));
        setTitles((profileData[0].target_titles || []).join("\n"));
      }
      const saved = window.localStorage.getItem("careeros-search-location");
      if (saved) setLocation(saved);
    });
    void loadHistory();
    return () => { active = false; };
  }, []);

  const groupedNotices = useMemo(() => uniqueNotices(errors), [errors]);
  const visibleResults = useMemo(() => {
    const query = resultQuery.trim().toLowerCase();
    const filtered = results.filter((result) => {
      if (remoteOnly && !result.job.remote) return false;
      if (!query) return true;
      return [result.job.title, result.job.company, result.job.location, result.job.source, ...(result.match.matched_keywords || [])]
        .join(" ").toLowerCase().includes(query);
    });
    return [...filtered].sort((a, b) => {
      if (sortMode === "company") return a.job.company.localeCompare(b.job.company);
      if (sortMode === "newest") return new Date(b.job.posted_at || 0).getTime() - new Date(a.job.posted_at || 0).getTime();
      return b.match.score - a.match.score;
    });
  }, [results, remoteOnly, resultQuery, sortMode]);

  function selectProfile(id: string) {
    setProfileId(id);
    const profile = profiles.find((item) => String(item.id) === id);
    if (profile) setTitles((profile.target_titles || []).join("\n"));
  }

  async function search(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setErrors([]);
    setTopBelow([]);
    window.localStorage.setItem("careeros-search-location", location);
    try {
      const data = await api("/api/jobs/search", {
        method: "POST",
        body: JSON.stringify({
          profile_id: Number(profileId),
          titles: titles.split("\n").map((value) => value.trim()).filter(Boolean),
          use_remotive: useRemotive,
          use_catalog: useCatalog,
          use_jsearch: useJSearch,
          jsearch_location: location,
          minimum_score: minimum,
          greenhouse_boards: greenhouse.split("\n").map((value) => value.trim()).filter(Boolean),
          lever_boards: lever.split("\n").map((value) => value.trim()).filter(Boolean),
          ashby_boards: ashby.split("\n").map((value) => value.trim()).filter(Boolean),
        }),
      });
      setResults(data.results || []);
      setErrors(data.errors || []);
      setTopBelow(data.top_below_threshold || []);
      setSummary({ unique: data.unique_jobs || 0, matched: data.results?.length || 0, cache: Boolean(data.cache?.connected) });
      await loadHistory();
    } catch (error) {
      setErrors([error instanceof Error ? error.message : "Search failed"]);
      setSummary(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader eyebrow="UNIVERSAL JOB SEARCH" title="Find your strongest opportunities" description="Search employer career sites and supported job sources, remove duplicates, and rank every role against your profile and résumé." actions={<Link className="button secondary" href="/profiles">Review career profile</Link>} />

      <section className="universal-search-bar">
        <div><span>Searching for</span><strong>{titles.split("\n").filter(Boolean).length || 0} target titles</strong></div>
        <div><span>Preferred market</span><strong>{location || "Any location"}</strong></div>
        <div><span>Minimum fit</span><strong>{minimum}% match</strong></div>
      </section>

      <div className="jobs-shell-grid">
        <form className="card jobs-filter-card" onSubmit={search}>
          <p className="eyebrow">SEARCH CRITERIA</p>
          <h2>Build your search</h2>
          <label>Career profile</label>
          <select value={profileId} onChange={(event) => selectProfile(event.target.value)} required>
            <option value="">Select profile</option>
            {profiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.name}</option>)}
          </select>

          <label>Target titles, one per line</label>
          <textarea rows={7} value={titles} onChange={(event) => setTitles(event.target.value)} placeholder="Director, Loan Operations\nVP, Construction Lending" />

          <label>Location or remote preference</label>
          <input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Tampa, Florida or Remote" />

          <label>Minimum match score: {minimum}%</label>
          <input type="range" min="0" max="100" value={minimum} onChange={(event) => setMinimum(Number(event.target.value))} />

          <div className="source-options">
            <label><input type="checkbox" checked={useCatalog} onChange={(event) => setUseCatalog(event.target.checked)} /> Employer career sites {catalog ? `(${catalog.greenhouse + catalog.lever + catalog.ashby} boards)` : ""}</label>
            <label><input type="checkbox" checked={useRemotive} onChange={(event) => setUseRemotive(event.target.checked)} /> Remote job feed</label>
            <label><input type="checkbox" checked={useJSearch} onChange={(event) => setUseJSearch(event.target.checked)} /> Broader web search through JSearch</label>
          </div>
          {useJSearch ? <p className="muted">JSearch requires RAPIDAPI_KEY in the project environment.</p> : null}

          <details>
            <summary>Add specific company career boards</summary>
            <label>Greenhouse board tokens or URLs</label><textarea rows={3} value={greenhouse} onChange={(event) => setGreenhouse(event.target.value)} />
            <label>Lever site names or URLs</label><textarea rows={3} value={lever} onChange={(event) => setLever(event.target.value)} />
            <label>Ashby board names or URLs</label><textarea rows={3} value={ashby} onChange={(event) => setAshby(event.target.value)} />
          </details>

          <button disabled={busy || !profileId || !titles.trim()}>{busy ? "Searching and ranking jobs…" : "Search all enabled sources"}</button>
        </form>

        <div className="jobs-insight-stack">
          {busy ? <Notice title="Searching current opportunities" tone="info"><p>CareerOS is checking enabled sources, removing duplicate postings, and calculating match scores.</p></Notice> : null}

          {summary ? (
            <section className="card">
              <p className="eyebrow">SEARCH SUMMARY</p>
              <h2>{summary.matched} ranked opportunities</h2>
              <div className="source-health">
                <div><strong>{summary.unique}</strong><span>Unique jobs found</span></div>
                <div><strong>{summary.matched}</strong><span>Above your threshold</span></div>
                <div><strong>{summary.cache ? "Connected" : "Offline"}</strong><span>Search cache</span></div>
              </div>
            </section>
          ) : (
            <section className="card"><p className="eyebrow">HOW IT WORKS</p><h2>Search broadly. Decide confidently.</h2><p className="muted">CareerOS checks enabled sources, removes duplicate postings, compares each role with your profile and résumé, and explains the evidence behind the score.</p></section>
          )}

          {groupedNotices.length ? (
            <Notice title={`${errors.length} source request${errors.length === 1 ? " was" : "s were"} unavailable`} tone="warning">
              <p>Results from successful sources are still shown. Technical details are hidden unless you need them.</p>
              <details className="provider-details"><summary>View technical details</summary>{groupedNotices.map((notice, index) => <p key={index}>{notice.message}{notice.count > 1 ? ` (${notice.count} similar notices)` : ""}</p>)}</details>
            </Notice>
          ) : null}

          <section className="card">
            <div className="row between"><div><p className="eyebrow">RECENT SEARCHES</p><h2>Your search activity</h2></div><span className="muted">Last five</span></div>
            {history.slice(0, 5).map((item) => <div className="history-row" key={item.id}><strong>{item.unique_count} unique • {item.matched_count} matches</strong><small>{item.searched_sources.join(" + ") || "Custom boards"} • threshold {item.minimum_score}</small></div>)}
            {!history.length ? <p className="muted">Your completed searches will appear here.</p> : null}
          </section>
        </div>
      </div>

      <section className="results-toolbar">
        <div><p className="eyebrow">RANKED RESULTS</p><h2>Best opportunities</h2><span className="muted">Showing {visibleResults.length} of {results.length}</span></div>
        <div className="result-controls">
          <input value={resultQuery} onChange={(event) => setResultQuery(event.target.value)} placeholder="Filter by title, company, skill…" aria-label="Filter results" />
          <label className="inline-check"><input type="checkbox" checked={remoteOnly} onChange={(event) => setRemoteOnly(event.target.checked)} /> Remote only</label>
          <select value={sortMode} onChange={(event) => setSortMode(event.target.value as SortMode)} aria-label="Sort results">
            <option value="match">Highest match</option>
            <option value="newest">Newest posting</option>
            <option value="company">Company name</option>
          </select>
        </div>
      </section>

      {visibleResults.map((result) => (
        <article className="job-card-modern" key={`${result.job.source}-${result.job.id}`}>
          <div className="row between job-card-heading">
            <div>
              <div className="row wrap"><span className="badge">{result.job.source}</span>{result.job.remote ? <span className="badge">Remote</span> : null}{result.job.employment_type ? <span className="badge">{result.job.employment_type}</span> : null}{result.job.salary ? <span className="badge metric-badge">{result.job.salary}</span> : null}</div>
              <h2>{result.job.title}</h2>
              <p className="muted">{result.job.company} • {result.job.location || "Location not listed"} • {postedLabel(result.job.posted_at)}</p>
            </div>
            <div className="job-score-modern">{result.match.score}<small>match</small></div>
          </div>
          <p><strong>{matchLabel(result.match.score)}.</strong> {result.match.explanation}</p>
          <div className="match-evidence-grid">
            <div><span>Title alignment</span><strong>{result.match.title_score}</strong></div>
            <div><span>Skills alignment</span><strong>{result.match.keyword_score}</strong></div>
            <div><span>Location fit</span><strong>{result.match.location_score}</strong></div>
            <div><span>Résumé evidence</span><strong>{result.match.resume_score}</strong></div>
          </div>
          {result.match.matched_keywords.length ? <p><strong>Matched evidence:</strong> {result.match.matched_keywords.slice(0, 10).join(" • ")}</p> : null}
          {result.match.missing_keywords.length ? <p className="muted"><strong>Potential gaps:</strong> {result.match.missing_keywords.slice(0, 6).join(" • ")}</p> : null}
          {result.match.concerns.length ? <p className="warn-text"><strong>Review before applying:</strong> {result.match.concerns.join(" • ")}</p> : null}
          <div className="row wrap job-actions"><Link className="button" href={`/jobs/${result.job.id}?profile_id=${profileId}`}>Analyze and tailor</Link><Link className="button secondary" href={`/applications?job_id=${result.job.id}`}>Track application</Link><a className="button secondary" href={result.job.url} target="_blank" rel="noreferrer">Open posting</a></div>
        </article>
      ))}

      {!visibleResults.length && results.length ? <EmptyState title="No results match the current filters" description="Clear the result filter or turn off Remote only to see the full ranked list." /> : null}
      {!results.length && topBelow.length ? <section className="card"><h2>Closest results below your threshold</h2><p className="muted">These opportunities were found but did not clear the current minimum match score.</p>{topBelow.map((item, index) => <div className="history-row" key={index}><strong>{item.score} • {item.title}</strong><small>{item.company} • {item.source}</small></div>)}</section> : null}
      {!results.length && !topBelow.length && !busy ? <EmptyState title="Ready to discover opportunities" description="Select a profile, confirm your target titles and location, then search all enabled sources." /> : null}
    </>
  );
}
