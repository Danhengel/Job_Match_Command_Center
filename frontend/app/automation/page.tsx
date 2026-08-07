"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";

type Profile = { id: number; name: string };
type SavedSearch = {
  id: number;
  profile_id: number;
  name: string;
  titles: string[];
  location: string;
  minimum_score: number;
  use_catalog: boolean;
  use_remotive: boolean;
  use_jsearch: boolean;
  active: boolean;
  cadence: string;
  last_run_at: string | null;
  last_result_count: number;
  created_at: string;
};

type FormState = {
  profileId: string;
  name: string;
  titles: string;
  location: string;
  minimumScore: number;
  cadence: string;
  useCatalog: boolean;
  useRemotive: boolean;
  useJsearch: boolean;
};

const initialForm: FormState = {
  profileId: "",
  name: "Daily Opportunity Route",
  titles: "Construction Loan Administration\nCommercial Loan Operations\nCRE Loan Operations",
  location: "Remote",
  minimumScore: 50,
  cadence: "daily",
  useCatalog: true,
  useRemotive: false,
  useJsearch: true,
};

export default function AutomationPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [items, setItems] = useState<SavedSearch[]>([]);
  const [form, setForm] = useState<FormState>(initialForm);
  const [workingId, setWorkingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [profileData, searchData] = await Promise.all([
        api("/api/profiles"),
        api("/api/automation/saved-searches"),
      ]);
      const loadedProfiles = Array.isArray(profileData) ? profileData : [];
      const loadedSearches = Array.isArray(searchData) ? searchData : [];
      setProfiles(loadedProfiles);
      setItems(loadedSearches);
      setForm((current) => ({
        ...current,
        profileId: current.profileId || (loadedProfiles[0] ? String(loadedProfiles[0].id) : ""),
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load scheduled routes.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const activeCount = useMemo(() => items.filter((item) => item.active).length, [items]);
  const totalMatches = useMemo(() => items.reduce((sum, item) => sum + item.last_result_count, 0), [items]);

  function clearNotices() {
    setError("");
    setMessage("");
  }

  async function createSearch(event: React.FormEvent) {
    event.preventDefault();
    clearNotices();

    const titleList = form.titles.split("\n").map((value) => value.trim()).filter(Boolean);
    if (!form.profileId) return setError("Select a career profile.");
    if (!form.name.trim()) return setError("Enter a name for this route.");
    if (!titleList.length) return setError("Enter at least one target title.");
    if (!form.useCatalog && !form.useRemotive && !form.useJsearch) return setError("Select at least one opportunity source.");

    setSaving(true);
    try {
      await api("/api/automation/saved-searches", {
        method: "POST",
        body: JSON.stringify({
          profile_id: Number(form.profileId),
          name: form.name.trim(),
          titles: titleList,
          location: form.location.trim() || "Remote",
          minimum_score: form.minimumScore,
          use_catalog: form.useCatalog,
          use_remotive: form.useRemotive,
          use_jsearch: form.useJsearch,
          cadence: form.cadence,
          active: true,
        }),
      });
      setMessage("Scheduled opportunity route created.");
      setForm((current) => ({ ...initialForm, profileId: current.profileId }));
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the scheduled route.");
    } finally {
      setSaving(false);
    }
  }

  async function runSearch(item: SavedSearch) {
    clearNotices();
    setWorkingId(item.id);
    try {
      const result = await api(`/api/automation/saved-searches/${item.id}/run`, { method: "POST" });
      const count = result?.matched_job_count ?? result?.result_count ?? 0;
      setMessage(`${item.name} completed${count ? ` with ${count} selected signals` : ""}.`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scheduled route search failed.");
    } finally {
      setWorkingId(null);
    }
  }

  async function toggleSearch(item: SavedSearch) {
    clearNotices();
    setWorkingId(item.id);
    try {
      await api(`/api/automation/saved-searches/${item.id}`, {
        method: "PATCH",
        body: JSON.stringify({ active: !item.active }),
      });
      setMessage(`${item.name} ${item.active ? "paused" : "resumed"}.`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update the scheduled route.");
    } finally {
      setWorkingId(null);
    }
  }

  async function deleteSearch(item: SavedSearch) {
    if (!window.confirm(`Delete “${item.name}”? This cannot be undone.`)) return;
    clearNotices();
    setWorkingId(item.id);
    try {
      await api(`/api/automation/saved-searches/${item.id}`, { method: "DELETE" });
      setMessage(`${item.name} deleted.`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete the scheduled route.");
    } finally {
      setWorkingId(null);
    }
  }

  return (
    <>
      <section className="executive-hero">
        <div>
          <p className="eyebrow">ROUTE ASSISTANT</p>
          <h1>Scheduled opportunity routes</h1>
          <p className="muted">Create focused searches, choose their sources, run them on demand, and keep recurring discovery on course.</p>
        </div>
        <div className="executive-actions">
          <button className="secondary" type="button" disabled={loading} onClick={() => void load()}>{loading ? "Refreshing…" : "Refresh"}</button>
        </div>
      </section>

      <section className="executive-kpis">
        <article className="executive-kpi"><span>Scheduled routes</span><strong>{items.length}</strong><small>configured searches</small></article>
        <article className="executive-kpi"><span>Active routes</span><strong>{activeCount}</strong><small>eligible for scheduled search</small></article>
        <article className="executive-kpi"><span>Route signals</span><strong>{totalMatches}</strong><small>across the latest completed searches</small></article>
      </section>

      {error ? <section className="resume-alert resume-alert-error"><strong>Action required</strong><span>{error}</span></section> : null}
      {message ? <section className="resume-alert resume-alert-success"><strong>Updated</strong><span>{message}</span></section> : null}

      <div className="two-col">
        <form className="card" onSubmit={createSearch}>
          <p className="eyebrow">NEW SCHEDULED ROUTE</p>
          <h2>Map a recurring opportunity search</h2>
          <label>Career compass</label>
          <select value={form.profileId} onChange={(event) => setForm({ ...form, profileId: event.target.value })}>
            {profiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.name}</option>)}
          </select>
          <label>Route name</label>
          <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          <label>Target titles, one per line</label>
          <textarea rows={7} value={form.titles} onChange={(event) => setForm({ ...form, titles: event.target.value })} />
          <div className="two-col">
            <div><label>Location</label><input value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} /></div>
            <div><label>Cadence</label><select value={form.cadence} onChange={(event) => setForm({ ...form, cadence: event.target.value })}><option value="daily">Daily</option><option value="weekdays">Weekdays</option><option value="weekly">Weekly</option><option value="manual">Manual only</option></select></div>
          </div>
          <label>Minimum alignment score: {form.minimumScore}</label>
          <input type="range" min="0" max="100" value={form.minimumScore} onChange={(event) => setForm({ ...form, minimumScore: Number(event.target.value) })} />
          <fieldset>
            <legend>Opportunity sources</legend>
            <label className="resume-checkbox-row"><input type="checkbox" checked={form.useCatalog} onChange={(event) => setForm({ ...form, useCatalog: event.target.checked })} /> Employer catalog</label>
            <label className="resume-checkbox-row"><input type="checkbox" checked={form.useRemotive} onChange={(event) => setForm({ ...form, useRemotive: event.target.checked })} /> Remote feed</label>
            <label className="resume-checkbox-row"><input type="checkbox" checked={form.useJsearch} onChange={(event) => setForm({ ...form, useJsearch: event.target.checked })} /> JSearch provider</label>
          </fieldset>
          <button disabled={saving || !profiles.length}>{saving ? "Saving…" : "Save scheduled route"}</button>
        </form>

        <section className="card">
          <p className="eyebrow">HOW IT WORKS</p>
          <h2>Transparent automation</h2>
          <p className="muted">Active routes are eligible for the configured schedule. Manual searches run immediately and update the signal count and last-search timestamp.</p>
          <ul>
            <li>Higher score thresholds produce a smaller, more focused route map.</li>
            <li>Provider availability can vary; failed providers should not erase successful results from other sources.</li>
            <li>New high-alignment opportunities appear in CareerNavIQ route updates.</li>
          </ul>
        </section>
      </div>

      <section className="card">
        <div className="row between"><div><p className="eyebrow">ROUTE LOG</p><h2>Scheduled opportunity routes</h2></div><span className="badge">{activeCount} active</span></div>
        {loading ? <p className="muted">Loading scheduled routes…</p> : items.map((item) => (
          <article className="automation-row" key={item.id}>
            <div>
              <div className="row wrap"><strong>{item.name}</strong><span className={`badge ${item.active ? "" : "warning-badge"}`}>{item.active ? "Active" : "Paused"}</span><span className="badge">{item.cadence}</span></div>
              <small>{item.titles.join(" · ")} · {item.location} · minimum score {item.minimum_score}</small>
              <small>Sources: {[item.use_catalog && "catalog", item.use_remotive && "remote feed", item.use_jsearch && "JSearch"].filter(Boolean).join(" · ") || "none"}</small>
              <small>Last search: {item.last_run_at ? new Date(item.last_run_at).toLocaleString() : "Never"} · {item.last_result_count} route signals</small>
            </div>
            <div className="row wrap">
              <button type="button" disabled={workingId === item.id} onClick={() => void runSearch(item)}>{workingId === item.id ? "Working…" : "Run now"}</button>
              <button type="button" className="secondary" disabled={workingId === item.id} onClick={() => void toggleSearch(item)}>{item.active ? "Pause" : "Resume"}</button>
              <button type="button" className="danger" disabled={workingId === item.id} onClick={() => void deleteSearch(item)}>Delete</button>
            </div>
          </article>
        ))}
        {!loading && !items.length ? <p className="muted">No scheduled routes yet. Map one above to begin.</p> : null}
      </section>
    </>
  );
}
