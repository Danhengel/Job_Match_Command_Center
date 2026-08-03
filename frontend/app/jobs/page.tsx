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

export default function JobsPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [profileId, setProfileId] = useState("");
  const [titles, setTitles] = useState("");
  const [minimum, setMinimum] = useState(20);
  const [results, setResults] = useState<Result[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [summary, setSummary] = useState<{ unique: number; matched: number; cache: boolean } | null>(null);
  const [catalog, setCatalog] = useState<{ greenhouse: number; lever: number; ashby: number } | null>(null);
  const [history, setHistory] = useState<History[]>([]);
  const [topBelow, setTopBelow] = useState<BelowThreshold[]>([]);
  const [useCatalog, setUseCatalog] = useState(true);
  const [useRemotive, setUseRemotive] = useState(false);
  const [useJSearch, setUseJSearch] = useState(false);
  const [jsearchLocation, setJsearchLocation] = useState("Tampa, Florida or Remote");
  const [greenhouse, setGreenhouse] = useState("");
  const [lever, setLever] = useState("");
  const [ashby, setAshby] = useState("");

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
    });
    void loadHistory();
    return () => { active = false; };
  }, []);

  const groupedNotices = useMemo(() => uniqueNotices(errors), [errors]);

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
    try {
      const data = await api("/api/jobs/search", {
        method: "POST",
        body: JSON.stringify({
          profile_id: Number(profileId),
          titles: titles.split("\n").map((value) => value.trim()).filter(Boolean),
          use_remotive: useRemotive,
          use_catalog: useCatalog,
          use_jsearch: useJSearch,
          jsearch_location: jsearchLocation,
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
      <PageHeader eyebrow="DISCOVER OPPORTUNITIES" title="Smart job search" description="Search multiple job sources, remove duplicates, and rank each opportunity against your career profile." actions={<Link className="button secondary" href="/profiles">Review profile</Link>} />

      <div className="jobs-shell-grid">
        <form className="card jobs-filter-card" onSubmit={search}>
          <p className="eyebrow">SEARCH SETTINGS</p>
          <h2>Define your search</h2>
          <label>Career profile</label>
          <select value={profileId} onChange={(event) => selectProfile(event.target.value)} required>
            <option value="">Select profile</option>
            {profiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.name}</option>)}
          </select>

          <label>Target titles, one per line</label>
          <textarea rows={7} value={titles} onChange={(event) => setTitles(event.target.value)} />

          <label>Minimum match score: {minimum}</label>
          <input type="range" min="0" max="100" value={minimum} onChange={(event) => setMinimum(Number(event.target.value))} />

          <div className="source-options">
            <label><input type="checkbox" checked={useCatalog} onChange={(event) => setUseCatalog(event.target.checked)} /> Employer career-site catalog {catalog ? `(${catalog.greenhouse + catalog.lever + catalog.ashby} boards)` : ""}</label>
            <label><input type="checkbox" checked={useRemotive} onChange={(event) => setUseRemotive(event.target.checked)} /> Remotive remote jobs</label>
            <label><input type="checkbox" checked={useJSearch} onChange={(event) => setUseJSearch(event.target.checked)} /> JSearch</label>
          </div>

          {useJSearch ? <><label>JSearch location</label><input value={jsearchLocation} onChange={(event) => setJsearchLocation(event.target.value)} /><p className="muted">Requires RAPIDAPI_KEY in the project environment.</p></> : null}

          <details>
            <summary>Advanced company-board settings</summary>
            <label>Greenhouse board tokens or URLs</label><textarea rows={3} value={greenhouse} onChange={(event) => setGreenhouse(event.target.value)} />
            <label>Lever site names or URLs</label><textarea rows={3} value={lever} onChange={(event) => setLever(event.target.value)} />
            <label>Ashby board names or URLs</label><textarea rows={3} value={ashby} onChange={(event) => setAshby(event.target.value)} />
          </details>

          <button disabled={busy || !profileId}>{busy ? "Searching job sources…" : "Search jobs"}</button>
        </form>

        <div>
          {busy ? <Notice title="Searching current opportunities" tone="info"><p>CareerOS is checking enabled sources, removing duplicates, and calculating match scores.</p></Notice> : null}

          {summary ? (
            <section className="card">
              <p className="eyebrow">SEARCH SUMMARY</p>
              <h2>{summary.matched} jobs above your threshold</h2>
              <div className="source-health">
                <div><strong>{summary.unique}</strong><span>Unique jobs found</span></div>
                <div><strong>{summary.matched}</strong><span>Ranked matches shown</span></div>
                <div><strong>{summary.cache ? "Connected" : "Offline"}</strong><span>Search cache</span></div>
              </div>
            </section>
          ) : (
            <section className="card"><p className="eyebrow">HOW IT WORKS</p><h2>Search once, compare clearly</h2><p className="muted">CareerOS queries enabled sources, removes duplicate postings, and explains the evidence behind every match score.</p></section>
          )}

          {groupedNotices.length ? (
            <Notice title={`${errors.length} source request${errors.length === 1 ? " was" : "s were"} unavailable`} tone="warning">
              <p>Results from successful sources are still shown. These technical notices do not erase completed matches.</p>
              <details className="provider-details">
                <summary>View technical details</summary>
                {groupedNotices.map((notice, index) => <p key={index}>{notice.message}{notice.count > 1 ? ` (${notice.count} similar notices)` : ""}</p>)}
              </details>
            </Notice>
          ) : null}

          <section className="card">
            <div className="row between"><div><p className="eyebrow">SEARCH HISTORY</p><h2>Recent searches</h2></div><span className="muted">Last five</span></div>
            {history.slice(0, 5).map((item) => <div className="history-row" key={item.id}><strong>{item.unique_count} unique • {item.matched_count} matches</strong><small>{item.searched_sources.join(" + ") || "Custom boards"} • threshold {item.minimum_score}</small></div>)}
            {!history.length ? <p className="muted">No search history yet.</p> : null}
          </section>
        </div>
      </div>

      <div className="results-header row between"><div><p className="eyebrow">RANKED RESULTS</p><h2>Best opportunities</h2></div><span className="muted">{results.length} matches</span></div>

      {results.map((result) => (
        <article className="job-card-modern" key={`${result.job.source}-${result.job.id}`}>
          <div className="row between">
            <div>
              <div className="row wrap"><span className="badge">{result.job.source}</span>{result.job.remote ? <span className="badge">Remote</span> : null}{result.job.salary ? <span className="badge metric-badge">{result.job.salary}</span> : null}</div>
              <h2>{result.job.title}</h2>
              <p className="muted">{result.job.company} • {result.job.location || "Location not listed"}</p>
            </div>
            <div className="job-score-modern">{result.match.score}<small>match</small></div>
          </div>
          <p><strong>{matchLabel(result.match.score)}.</strong> {result.match.explanation}</p>
          {result.match.matched_keywords.length ? <p><strong>Why it fits:</strong> {result.match.matched_keywords.join(" • ")}</p> : null}
          {result.match.concerns.length ? <p className="warn-text"><strong>Review before applying:</strong> {result.match.concerns.join(" • ")}</p> : null}
          <div className="score-bars"><span>Title <b>{result.match.title_score}</b></span><span>Skills <b>{result.match.keyword_score}</b></span><span>Location <b>{result.match.location_score}</b></span><span>Résumé <b>{result.match.resume_score}</b></span></div>
          <div className="row wrap"><Link className="button" href={`/jobs/${result.job.id}?profile_id=${profileId}`}>Analyze and tailor</Link><a className="button secondary" href={result.job.url} target="_blank" rel="noreferrer">Open posting</a></div>
        </article>
      ))}

      {!results.length && topBelow.length ? <section className="card"><h2>Closest results below your threshold</h2><p className="muted">These opportunities were found but did not clear the current minimum score.</p>{topBelow.map((item, index) => <div className="history-row" key={index}><strong>{item.score} • {item.title}</strong><small>{item.company} • {item.source}</small></div>)}</section> : null}
      {!results.length && !topBelow.length && !busy ? <EmptyState title="No ranked results yet" description="Select a career profile, confirm your target titles, and run a search." /> : null}
    </>
  );
}
