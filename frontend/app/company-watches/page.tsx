"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { EmptyState, Notice, PageHeader } from "@/components/ui";
import { api } from "@/lib/api";
import { RecommendedEmployerCatalog } from "./RecommendedEmployerCatalog";
import {
  employerCategoryDetails,
  type RecommendedEmployer,
} from "./recommended-employers";

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
  "workday",
  "icims",
  "oracle",
  "smartrecruiters",
  "successfactors",
  "ukg",
];

const liveConnectors = new Set(["greenhouse", "lever", "ashby"]);

export default function CareerWatches() {
  const [items, setItems] = useState<CareerWatch[]>([]);
  const [form, setForm] = useState<WatchForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function load() {
    const data = await api("/api/enterprise/career-watches");
    setItems(Array.isArray(data) ? data : []);
  }

  useEffect(() => {
    let active = true;

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
      notes: `Résumé-matched employer • ${detail.label}. Focus: ${detail.focus}. Priority: ${employer.priority}.`,
    });
    setError("");
    setMessage(`${employer.company} is ready in the company watch form. Review it and select Save career watch.`);

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
      setMessage("Career page watch added.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save watch.");
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
      setError(err instanceof Error ? err.message : "Unable to update watch.");
    } finally {
      setBusy(null);
    }
  }

  async function remove(item: CareerWatch) {
    const confirmed = window.confirm(`Delete the career watch for ${item.company}?`);
    if (!confirmed) return;

    setBusy(`delete-${item.id}`);
    setError("");
    setMessage("");

    try {
      await api(`/api/enterprise/career-watches/${item.id}`, { method: "DELETE" });
      setMessage(`${item.company} was removed from career watches.`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete watch.");
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
        eyebrow="COMPANY CAREER MONITORING"
        title="Keep priority employers on your radar"
        description="Use the résumé-matched employer catalog, save company career pages, and organize the organizations most likely to hire for your target work."
        actions={<Link className="button secondary" href="/companies">Company intelligence</Link>}
      />

      {error ? (
        <Notice title="Career watches need attention" tone="error"><p>{error}</p></Notice>
      ) : null}
      {message ? (
        <Notice title="Career watch updated" tone="success"><p>{message}</p></Notice>
      ) : null}

      {!loading && items.length ? (
        <section className="watch-summary-grid" aria-label="Career watch summary">
          <article><span>Watched companies</span><strong>{summary.total}</strong><small>saved career pages</small></article>
          <article><span>Active watches</span><strong>{summary.active}</strong><small>included in monitoring</small></article>
          <article><span>Live connectors</span><strong>{summary.connected}</strong><small>Greenhouse, Lever, or Ashby</small></article>
          <article><span>Paused</span><strong>{summary.paused}</strong><small>temporarily inactive</small></article>
        </section>
      ) : null}

      <div className="watch-layout">
        <form className="card watch-form" onSubmit={create}>
          <div className="watch-panel-heading">
            <p className="eyebrow">ADD CAREER PAGE</p>
            <h2>Create a company watch</h2>
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
            {busy === "create" ? "Saving watch…" : "Save career watch"}
          </button>
        </form>

        <aside className="card connector-panel">
          <p className="eyebrow">CONNECTOR READINESS</p>
          <h2>Supported search sources</h2>
          <p className="muted">CareerNavIQ can use board identifiers from these platforms in targeted searches today.</p>
          <div className="connector-list">
            {["greenhouse", "lever", "ashby"].map((connector) => (
              <div key={connector}>
                <span className="connector-status-dot" />
                <div><strong>{connector}</strong><small>Live connector</small></div>
              </div>
            ))}
          </div>
          <div className="connector-note">
            <strong>Other platforms remain useful</strong>
            <p>Workday, iCIMS, Oracle, SmartRecruiters, SuccessFactors, and UKG pages are stored so you can revisit them and use future connectors.</p>
          </div>
        </aside>
      </div>

      <RecommendedEmployerCatalog items={items} onSelect={selectRecommendedEmployer} />

      <section className="card watch-library">
        <div className="row between wrap">
          <div>
            <p className="eyebrow">WATCH LIBRARY</p>
            <h2>Monitored career pages</h2>
          </div>
          <span className="muted">{items.length} saved compan{items.length === 1 ? "y" : "ies"}</span>
        </div>

        {loading ? (
          <div className="watch-loading-state"><h3>Loading career watches…</h3></div>
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
            title="No career pages watched yet"
            description="Use the résumé-matched employer catalog above to build your priority company monitoring list."
          />
        )}
      </section>
    </>
  );
}
