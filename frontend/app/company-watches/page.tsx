"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { EmptyState, Notice, PageHeader } from "@/components/ui";
import { api } from "@/lib/api";
import {
  employerCategoryDetails,
  type RecommendedEmployer,
} from "./employer-catalog-types";

const RecommendedEmployerCatalog = dynamic(
  () => import("./RecommendedEmployerCatalog").then((module) => module.RecommendedEmployerCatalog),
  { ssr: false },
);

type CareerWatch = {
  id: number;
  company: string;
  career_url: string;
  ats_type: string;
  board_identifier: string;
  notes: string;
  active: boolean;
};

type WatchForm = {
  company: string;
  career_url: string;
  ats_type: string;
  board_identifier: string;
  notes: string;
};

const emptyForm: WatchForm = {
  company: "",
  career_url: "",
  ats_type: "unknown",
  board_identifier: "",
  notes: "",
};

const atsOptions = [
  "unknown",
  "greenhouse",
  "lever",
  "ashby",
  "smartrecruiters",
  "recruitee",
  "workable",
  "workday",
  "icims",
  "oracle",
  "successfactors",
  "ukg",
];

const liveConnectors = new Set([
  "greenhouse",
  "lever",
  "ashby",
  "smartrecruiters",
  "recruitee",
  "workable",
]);

export default function CareerWatches() {
  const [items, setItems] = useState<CareerWatch[]>([]);
  const [form, setForm] = useState<WatchForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [personalCatalogEnabled, setPersonalCatalogEnabled] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function load() {
    const data = await api("/api/enterprise/career-watches");
    setItems(Array.isArray(data) ? data : []);
  }

  useEffect(() => {
    let active = true;

    api("/api/enterprise/personal-employer-catalog-access")
      .then((data) => {
        if (active) setPersonalCatalogEnabled(Boolean(data?.enabled));
      })
      .catch(() => {
        if (active) setPersonalCatalogEnabled(false);
      });

    load()
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : "Unable to load career watches.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  function selectRecommendedEmployer(employer: RecommendedEmployer) {
    const detail = employerCategoryDetails[employer.category];

    setForm({
      company: employer.company,
      career_url: employer.career_url,
      ats_type: "unknown",
      board_identifier: "",
      notes: `Résumé-aligned employer • ${detail.label}. Focus: ${detail.focus}. Priority: ${employer.priority}.`,
    });
    setError("");
    setMessage(`${employer.company} is ready in the company watch form. Review it and select Save career page.`);

    window.requestAnimationFrame(() => {
      document.getElementById("watch-company")?.scrollIntoView({ behavior: "smooth", block: "center" });
      document.getElementById("watch-company")?.focus();
    });
  }

  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy("create");
    setError("");
    setMessage("");

    try {
      await api("/api/enterprise/career-watches", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          company: form.company.trim(),
          career_url: form.career_url.trim(),
          board_identifier: form.board_identifier.trim(),
          notes: form.notes.trim(),
        }),
      });
      setForm(emptyForm);
      setMessage("Career page saved.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save career page.");
    } finally {
      setBusy(null);
    }
  }

  async function toggle(item: CareerWatch) {
    setBusy(`toggle-${item.id}`);
    setError("");
    setMessage("");

    try {
      await api(`/api/enterprise/career-watches/${item.id}`, {
        method: "PATCH",
        body: JSON.stringify({ active: !item.active }),
      });
      setMessage(`${item.company} is now ${item.active ? "paused" : "active"}.`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update career page.");
    } finally {
      setBusy(null);
    }
  }

  async function remove(item: CareerWatch) {
    const confirmed = window.confirm(`Delete the saved career page for ${item.company}?`);
    if (!confirmed) return;

    setBusy(`delete-${item.id}`);
    setError("");
    setMessage("");

    try {
      await api(`/api/enterprise/career-watches/${item.id}`, { method: "DELETE" });
      setMessage(`${item.company} was removed from your saved career pages.`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete career page.");
    } finally {
      setBusy(null);
    }
  }

  const summary = useMemo(() => ({
    total: items.length,
    active: items.filter((item) => item.active).length,
    connected: items.filter((item) => liveConnectors.has(item.ats_type)).length,
    paused: items.filter((item) => !item.active).length,
  }), [items]);

  return (
    <>
      <PageHeader
        eyebrow="ROUTE WATCHLIST"
        title="Keep priority employers on your map"
        description="Keep employer career pages in one place. Supported ATS pages are searched directly, while other employers can still appear through CareerNavIQ’s broader opportunity scan."
        actions={<Link className="button secondary" href="/companies">Employer landscape</Link>}
      />

      {error ? (
        <Notice title="Career pages need attention" tone="error"><p>{error}</p></Notice>
      ) : null}
      {message ? (
        <Notice title="Career page updated" tone="success"><p>{message}</p></Notice>
      ) : null}

      {!loading && items.length ? (
        <section className="watch-summary-grid" aria-label="Career page summary">
          <article><span>Saved companies</span><strong>{summary.total}</strong><small>career pages in your library</small></article>
          <article><span>Active pages</span><strong>{summary.active}</strong><small>included in route searches</small></article>
          <article><span>Direct connectors</span><strong>{summary.connected}</strong><small>searched directly by ATS</small></article>
          <article><span>Paused</span><strong>{summary.paused}</strong><small>excluded from active searches</small></article>
        </section>
      ) : null}

      <div className="watch-layout">
        <form className="card watch-form" onSubmit={create}>
          <div className="watch-panel-heading">
            <p className="eyebrow">ADD CAREER PAGE</p>
            <h2>Save a company career page</h2>
            <p className="muted">Store the public career page and, when available, the employer’s ATS board identifier.</p>
          </div>

          <label htmlFor="watch-company">Company</label>
          <input
            id="watch-company"
            value={form.company}
            onChange={(event) => setForm({ ...form, company: event.target.value })}
            placeholder="Company name"
            required
          />

          <label htmlFor="watch-url">Career page URL</label>
          <input
            id="watch-url"
            type="url"
            value={form.career_url}
            onChange={(event) => setForm({ ...form, career_url: event.target.value })}
            placeholder="https://company.com/careers"
            required
          />

          <div className="watch-form-grid">
            <div>
              <label htmlFor="watch-ats">ATS platform</label>
              <select
                id="watch-ats"
                value={form.ats_type}
                onChange={(event) => setForm({ ...form, ats_type: event.target.value })}
              >
                {atsOptions.map((option) => (
                  <option key={option} value={option}>{option === "unknown" ? "Unknown / other" : option}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="watch-board">Board identifier</label>
              <input
                id="watch-board"
                value={form.board_identifier}
                onChange={(event) => setForm({ ...form, board_identifier: event.target.value })}
                placeholder="Board token or site name"
              />
            </div>
          </div>

          <label htmlFor="watch-notes">Strategy notes</label>
          <textarea
            id="watch-notes"
            rows={5}
            value={form.notes}
            onChange={(event) => setForm({ ...form, notes: event.target.value })}
            placeholder="Why this company is a priority, teams to watch, or contacts to remember"
          />

          <button type="submit" disabled={busy === "create"}>
            {busy === "create" ? "Saving page…" : "Save career page"}
          </button>
        </form>

        <aside className="card connector-panel">
          <p className="eyebrow">SEARCH COVERAGE</p>
          <h2>Direct ATS connectors</h2>
          <p className="muted">Active saved pages on these platforms are searched directly whenever you run an opportunity search.</p>
          <div className="connector-list">
            {["greenhouse", "lever", "ashby", "smartrecruiters", "recruitee", "workable"].map((connector) => (
              <div key={connector}>
                <span className="connector-status-dot" />
                <div><strong>{connector}</strong><small>Direct search connector</small></div>
              </div>
            ))}
          </div>
          <div className="connector-note">
            <strong>Covered through broad web search</strong>
            <p>Workday, iCIMS, Oracle, SuccessFactors, UKG, and unknown career platforms are not searched directly yet. Their open jobs may still appear through CareerNavIQ’s broad Google Jobs publisher search.</p>
          </div>
        </aside>
      </div>

      {personalCatalogEnabled ? (
        <RecommendedEmployerCatalog items={items} onSelect={selectRecommendedEmployer} />
      ) : null}

      <section className="card watch-library">
        <div className="row between wrap">
          <div>
            <p className="eyebrow">CAREER PAGE LIBRARY</p>
            <h2>Saved career pages</h2>
          </div>
          <span className="muted">{items.length} saved compan{items.length === 1 ? "y" : "ies"}</span>
        </div>

        {loading ? (
          <div className="watch-loading-state"><h3>Loading saved career pages…</h3></div>
        ) : items.length ? (
          <div className="watch-card-grid">
            {items.map((item) => (
              <article className={`watch-card ${item.active ? "" : "watch-card-paused"}`} key={item.id}>
                <div className="watch-card-main">
                  <div className="watch-company-mark" aria-hidden="true">{item.company.trim().slice(0, 1).toUpperCase() || "C"}</div>
                  <div>
                    <div className="row wrap">
                      <span className={item.active ? "badge" : "score-pill"}>{item.active ? "Active" : "Paused"}</span>
                      <span className="score-pill">{item.ats_type === "unknown" ? "ATS not set" : item.ats_type}</span>
                    </div>
                    <h3>{item.company}</h3>
                    <p className="muted">{item.board_identifier || "No board identifier"}</p>
                  </div>
                </div>

                <a className="watch-url" href={item.career_url} target="_blank" rel="noreferrer">
                  {item.career_url}
                </a>
                {item.notes ? <p className="watch-notes">{item.notes}</p> : null}

                <footer className="watch-card-actions">
                  <button
                    type="button"
                    className="secondary"
                    disabled={busy === `toggle-${item.id}`}
                    onClick={() => void toggle(item)}
                  >
                    {busy === `toggle-${item.id}` ? "Updating…" : item.active ? "Pause" : "Resume"}
                  </button>
                  <button
                    type="button"
                    className="danger"
                    disabled={busy === `delete-${item.id}`}
                    onClick={() => void remove(item)}
                  >
                    {busy === `delete-${item.id}` ? "Deleting…" : "Delete"}
                  </button>
                </footer>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No career pages saved yet"
            description={personalCatalogEnabled
              ? "Use your résumé-aligned employer map above to build your priority route watchlist."
              : "Add a company career page above to build your priority company search list."}
          />
        )}
      </section>
    </>
  );
}
