"use client";

import { useMemo, useState } from "react";
import {
  employerCategoryDetails,
  type EmployerCategory,
  type RecommendedEmployer,
} from "./employer-catalog-types";
import { recommendedEmployers } from "./recommended-employers";

type WatchedEmployer = {
  company: string;
  career_url: string;
};

type RecommendedEmployerCatalogProps = {
  items: WatchedEmployer[];
  onSelect: (employer: RecommendedEmployer) => void;
};

const additionalEmployers: RecommendedEmployer[] = [
  {
    company: "Axos Bank",
    career_url: "https://www.axosbank.com/careers",
    category: "Banking & credit unions",
    priority: "Top match",
  },
  {
    company: "Wings Credit Union",
    career_url: "https://www.wingscu.com/careers",
    category: "Banking & credit unions",
    priority: "Top match",
  },
  {
    company: "Nuvision Credit Union",
    career_url: "https://nuvisionfederal.com/careers",
    category: "Banking & credit unions",
    priority: "Strong match",
  },
  {
    company: "Hoosier Hills Credit Union",
    career_url: "https://www.hoosierhills.com/careers",
    category: "Banking & credit unions",
    priority: "Top match",
  },
  {
    company: "Coastal Community Bank",
    career_url: "https://www.coastalbank.com/careers/",
    category: "Banking & credit unions",
    priority: "Top match",
  },
];

const catalogEmployers = [...recommendedEmployers, ...additionalEmployers];
const categoryOptions = Object.keys(employerCategoryDetails) as EmployerCategory[];
const priorityRank = { "Top match": 0, "Strong match": 1 } as const;

function normalize(value: string) {
  return value.trim().toLowerCase().replace(/\/+$/, "");
}

export function RecommendedEmployerCatalog({ items, onSelect }: RecommendedEmployerCatalogProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"all" | EmployerCategory>("all");
  const [priority, setPriority] = useState<"all" | RecommendedEmployer["priority"]>("all");

  const watchedCompanies = useMemo(
    () => new Set(items.map((item) => normalize(item.company))),
    [items],
  );
  const watchedUrls = useMemo(
    () => new Set(items.map((item) => normalize(item.career_url))),
    [items],
  );

  function isWatched(employer: RecommendedEmployer) {
    return watchedCompanies.has(normalize(employer.company)) || watchedUrls.has(normalize(employer.career_url));
  }

  const filteredEmployers = useMemo(() => {
    const search = normalize(query);

    return catalogEmployers
      .filter((employer) => category === "all" || employer.category === category)
      .filter((employer) => priority === "all" || employer.priority === priority)
      .filter((employer) => {
        if (!search) return true;
        const categoryFocus = employerCategoryDetails[employer.category].focus;
        return [employer.company, employer.category, employer.career_url, categoryFocus]
          .join(" ")
          .toLowerCase()
          .includes(search);
      })
      .sort((left, right) => {
        const priorityDifference = priorityRank[left.priority] - priorityRank[right.priority];
        return priorityDifference || left.company.localeCompare(right.company);
      });
  }, [category, priority, query]);

  const summary = useMemo(() => ({
    total: catalogEmployers.length,
    topMatches: catalogEmployers.filter((employer) => employer.priority === "Top match").length,
    visible: filteredEmployers.length,
    saved: catalogEmployers.filter((employer) => isWatched(employer)).length,
  }), [filteredEmployers, watchedCompanies, watchedUrls]);

  return (
    <section className="card recommended-employer-catalog">
      <div className="recommended-employer-heading">
        <div>
          <p className="eyebrow">YOUR RÉSUMÉ-MATCHED EMPLOYERS</p>
          <h2>Private priority company watch list</h2>
          <p className="muted">
            Your private employer catalog matched to construction lending, CRE servicing, credit administration,
            affordable housing, capital-program delivery, portfolio governance, and operations transformation.
            Career pages can change, so confirm the employer page before applying.
          </p>
        </div>
      </div>

      <div className="recommended-employer-summary" aria-label="Recommended employer summary">
        <article><span>Matched employers</span><strong>{summary.total}</strong><small>across seven target sectors</small></article>
        <article><span>Top matches</span><strong>{summary.topMatches}</strong><small>closest résumé alignment</small></article>
        <article><span>Currently shown</span><strong>{summary.visible}</strong><small>after search and filters</small></article>
        <article><span>Already watched</span><strong>{summary.saved}</strong><small>saved in your library</small></article>
      </div>

      <div className="recommended-employer-controls">
        <label>
          <span>Search employers</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Bank, servicer, CDFI, consulting firm…"
          />
        </label>

        <label>
          <span>Industry group</span>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value as "all" | EmployerCategory)}
          >
            <option value="all">All industry groups</option>
            {categoryOptions.map((option) => (
              <option value={option} key={option}>{option}</option>
            ))}
          </select>
        </label>

        <label>
          <span>Match priority</span>
          <select
            value={priority}
            onChange={(event) => setPriority(event.target.value as "all" | RecommendedEmployer["priority"])}
          >
            <option value="all">All priorities</option>
            <option value="Top match">Top matches</option>
            <option value="Strong match">Strong matches</option>
          </select>
        </label>
      </div>

      {filteredEmployers.length ? (
        <div className="recommended-employer-grid">
          {filteredEmployers.map((employer) => {
            const watched = isWatched(employer);
            const detail = employerCategoryDetails[employer.category];

            return (
              <article className={`recommended-employer-card ${watched ? "recommended-employer-saved" : ""}`} key={`${employer.category}-${employer.company}`}>
                <div className="recommended-employer-card-heading">
                  <div className="recommended-employer-mark" aria-hidden="true">
                    {employer.company.trim().slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <div className="row wrap">
                      <span className={employer.priority === "Top match" ? "badge" : "score-pill"}>{employer.priority}</span>
                      {watched ? <span className="badge">Watched</span> : null}
                    </div>
                    <h3>{employer.company}</h3>
                    <small>{detail.label}</small>
                  </div>
                </div>

                <p>{detail.focus}.</p>
                <a href={employer.career_url} target="_blank" rel="noreferrer">
                  {employer.career_url}
                </a>

                <button
                  type="button"
                  className={watched ? "secondary" : undefined}
                  disabled={watched}
                  onClick={() => onSelect(employer)}
                >
                  {watched ? "Already watched" : "Use in watch form"}
                </button>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="recommended-employer-empty">
          <h3>No employers match these filters</h3>
          <p className="muted">Clear the search or choose a broader industry group.</p>
        </div>
      )}
    </section>
  );
}
