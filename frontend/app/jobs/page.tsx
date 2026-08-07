"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { EmptyState, MetricStrip, Notice, PageHeader, SectionHeader } from "@/components/ui";
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

type SortMode = "match" | "newest" | "company";

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

function alignmentLabel(score: number) {
  if (score >= 85) return "Exceptional alignment";
  if (score >= 70) return "Strong alignment";
  if (score >= 55) return "Worth reviewing";
  return "Exploratory";
}

function cleanError(message: string) {
  if (/RetryError|Traceback|HTTPError|<Future|0x[\da-f]+/i.test(message)) {
    return "One market source was temporarily unavailable. The rest of the market review completed normally.";
  }
  return message.replace(/https?:\/\/\S+/g, "the source");
}

export default function JobsPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [profileId, setProfileId] = useState("");
  const [titles, setTitles] = useState("");
  const [location, setLocation] = useState("Tampa, Florida or Remote");
  const [minimum, setMinimum] = useState(55);
  const [results, setResults] = useState<Result[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [summary, setSummary] = useState<SearchSummary | null>(null);
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [resultQuery, setResultQuery] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("match");
  const [greenhouse, setGreenhouse] = useState("");
  const [lever, setLever] = useState("");
  const [ashby, setAshby] = useState("");

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
      setErrors([error instanceof Error ? error.message : "Could not load saved market results."]);
    } finally {
      setLoadingSaved(false);
    }
  }

  useEffect(() => {
    let active = true;
    (async () => {
      try {
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
        if (active) setErrors([error instanceof Error ? error.message : "Could not prepare market intelligence."]);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const visibleResults = useMemo(() => {
    const query = resultQuery.trim().toLowerCase();
    const filtered = results.filter((result) => {
      if (remoteOnly && !result.job.remote) return false;
      if (!query) return true;
      return [result.job.title, result.job.company, result.job.location, ...(result.match.matched_keywords || [])]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
    return [...filtered].sort((a, b) => {
      if (sortMode === "company") return a.job.company.localeCompare(b.job.company);
      if (sortMode === "newest") return new Date(b.job.posted_at || 0).getTime() - new Date(a.job.posted_at || 0).getTime();
      return b.match.score - a.match.score;
    });
  }, [results, remoteOnly, resultQuery, sortMode]);

  async function selectProfile(id: string) {
    setProfileId(id);
    const profile = profiles.find((item) => String(item.id) === id);
    if (profile) setTitles((profile.target_titles || []).join("\n"));
    await loadSavedMatches(id);
  }

  async function search(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setErrors([]);
    setSummary(null);
    window.localStorage.setItem("careeros-search-location", location);

    try {
      const data = await api("/api/jobs/search", {
        method: "POST",
        body: JSON.stringify({
          profile_id: Number(profileId),
          titles: titles.split("\n").map((value) => value.trim()).filter(Boolean),
          use_remotive: true,
          use_catalog: true,
          use_jsearch: true,
          jsearch_location: location,
          minimum_score: minimum,
          greenhouse_boards: greenhouse.split("\n").map((value) => value.trim()).filter(Boolean),
          lever_boards: lever.split("\n").map((value) => value.trim()).filter(Boolean),
          ashby_boards: ashby.split("\n").map((value) => value.trim()).filter(Boolean),
        }),
      });
      setResults(data.results || []);
      setErrors((data.errors || []).map(cleanError));
      setSummary({
        searched: data.searched || 0,
        unique: data.unique_jobs || 0,
        matched: data.results?.length || 0,
      });
    } catch (error) {
      setErrors([cleanError(error instanceof Error ? error.message : "Market review failed.")]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="MARKET INTELLIGENCE"
        title="Evaluate the market against your executive position"
        description="Review live opportunities through the lens of role level, experience, geography, compensation, and evidence—not job-board volume."
        actions={<Link className="button secondary" href="/profiles">Executive profile</Link>}
      />

      <MetricStrip
        ariaLabel="Market review criteria"
        items={[
          { label: "Target positions", value: titles.split("\n").filter(Boolean).length || 0, detail: "roles in scope" },
          { label: "Market", value: location || "Any", detail: remoteOnly ? "remote only" : "location + remote" },
          { label: "Review threshold", value: `${minimum}%`, detail: "minimum alignment" },
          { label: "Visible opportunities", value: visibleResults.length, detail: results.length ? `${results.length} evaluated` : "awaiting review" },
        ]}
      />

      <section className="market-intelligence-layout">
        <form className="executive-panel market-criteria-panel" onSubmit={search}>
          <SectionHeader eyebrow="SEARCH MANDATE" title="Opportunity criteria" description="Keep the mandate narrow enough to surface roles worth executive attention." />

          <label htmlFor="market-profile">Executive profile</label>
          <select id="market-profile" value={profileId} onChange={(event) => void selectProfile(event.target.value)} required>
            <option value="">Select profile</option>
            {profiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.name}</option>)}
          </select>

          <label htmlFor="market-titles">Target positions</label>
          <textarea id="market-titles" rows={6} value={titles} onChange={(event) => setTitles(event.target.value)} placeholder={"Director, Loan Operations\nVP, Construction Lending"} />

          <label htmlFor="market-location">Geography or remote preference</label>
          <input id="market-location" value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Tampa, Florida or Remote" />

          <div className="market-threshold-row">
            <label htmlFor="market-threshold">Minimum alignment</label>
            <strong>{minimum}%</strong>
          </div>
          <input id="market-threshold" type="range" min="0" max="100" value={minimum} onChange={(event) => setMinimum(Number(event.target.value))} />

          <details className="advanced-market-sources">
            <summary>Advanced source controls</summary>
            <p className="muted">CareerNavIQ reviews direct employer boards, remote sources, and broad-market publishers automatically. Add specific boards only when you need deeper coverage.</p>
            <label htmlFor="greenhouse-sources">Greenhouse boards</label>
            <textarea id="greenhouse-sources" rows={3} value={greenhouse} onChange={(event) => setGreenhouse(event.target.value)} placeholder="Optional board tokens or URLs" />
            <label htmlFor="lever-sources">Lever sites</label>
            <textarea id="lever-sources" rows={3} value={lever} onChange={(event) => setLever(event.target.value)} placeholder="Optional site names or URLs" />
            <label htmlFor="ashby-sources">Ashby boards</label>
            <textarea id="ashby-sources" rows={3} value={ashby} onChange={(event) => setAshby(event.target.value)} placeholder="Optional board names or URLs" />
          </details>

          <button disabled={busy || !profileId || !titles.trim()}>
            {busy ? "Reviewing the market…" : "Run market review"}
          </button>
        </form>

        <div className="market-results-column">
          {loadingSaved ? <Notice title="Loading prior market intelligence"><p>Restoring previously evaluated opportunities for this executive profile.</p></Notice> : null}
          {busy ? <Notice title="Market review in progress"><p>CareerNavIQ is evaluating enabled sources, removing duplication, and scoring opportunities against your position.</p></Notice> : null}
          {errors.length ? <Notice title="Some market coverage was unavailable" tone="warning"><ul>{Array.from(new Set(errors)).slice(0, 4).map((message) => <li key={message}>{message}</li>)}</ul></Notice> : null}

          <section className="executive-panel market-results-panel">
            <SectionHeader
              eyebrow="OPPORTUNITY REVIEW"
              title="Current market signals"
              description={summary ? `${summary.matched} selected from ${summary.unique} unique opportunities reviewed.` : results.length ? "Previously evaluated opportunities for this executive profile." : "Run a market review to evaluate current opportunities."}
              actions={
                <div className="market-result-controls">
                  <label><span>Filter</span><input type="search" value={resultQuery} onChange={(event) => setResultQuery(event.target.value)} placeholder="Title, company, keyword" /></label>
                  <label><span>Sort</span><select value={sortMode} onChange={(event) => setSortMode(event.target.value as SortMode)}><option value="match">Alignment</option><option value="newest">Newest</option><option value="company">Company</option></select></label>
                  <label className="market-remote-toggle"><input type="checkbox" checked={remoteOnly} onChange={(event) => setRemoteOnly(event.target.checked)} /> Remote only</label>
                </div>
              }
            />

            {visibleResults.length ? (
              <div className="market-result-list">
                {visibleResults.map((result) => (
                  <article className="market-result-row" key={`${result.job.id}-${result.job.source}`}>
                    <div className="market-alignment-score"><strong>{result.match.score}</strong><span>alignment</span></div>
                    <div className="market-result-main">
                      <div className="market-result-heading">
                        <div><h3>{result.job.title}</h3><p>{result.job.company}</p></div>
                        <span className="market-alignment-label">{alignmentLabel(result.match.score)}</span>
                      </div>
                      <div className="market-result-meta">
                        <span>{result.job.location || "Location not listed"}</span>
                        {result.job.remote ? <span>Remote</span> : null}
                        {result.job.salary ? <span>{result.job.salary}</span> : null}
                        <span>{postedLabel(result.job.posted_at)}</span>
                      </div>
                      {result.match.explanation ? <p className="market-result-explanation">{result.match.explanation}</p> : null}
                      {result.match.matched_keywords?.length ? <div className="market-keywords">{result.match.matched_keywords.slice(0, 5).map((keyword) => <span key={keyword}>{keyword}</span>)}</div> : null}
                    </div>
                    <div className="market-result-actions">
                      <Link className="button" href={`/jobs/${result.job.id}?profile_id=${profileId}`}>Review opportunity</Link>
                      {result.job.url ? <a className="button secondary" href={result.job.url} target="_blank" rel="noreferrer">Source posting</a> : null}
                    </div>
                  </article>
                ))}
              </div>
            ) : !busy && !loadingSaved ? (
              <EmptyState title="No opportunities in the current view" description="Adjust the mandate or run a fresh market review. CareerNavIQ will keep technical source details out of the primary decision view." />
            ) : null}
          </section>
        </div>
      </section>
    </>
  );
}
