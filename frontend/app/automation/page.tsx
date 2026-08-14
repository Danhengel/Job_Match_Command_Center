"use client";

import { useEffect, useMemo, useState } from "react";
import { MetricStrip, Notice, PageHeader, SectionHeader } from "@/components/ui";
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
  name: "Daily Market Review",
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
      const [profileData, searchData] = await Promise.all([api("/api/profiles"), api("/api/automation/saved-searches")]);
      const loadedProfiles = Array.isArray(profileData) ? profileData : [];
      const loadedSearches = Array.isArray(searchData) ? searchData : [];
      setProfiles(loadedProfiles);
      setItems(loadedSearches);
      setForm((current) => ({ ...current, profileId: current.profileId || (loadedProfiles[0] ? String(loadedProfiles[0].id) : "") }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load automation.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

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
    if (!form.name.trim()) return setError("Enter a name for this market review.");
    if (!titleList.length) return setError("Enter at least one target title.");
    if (!form.useCatalog && !form.useRemotive && !form.useJsearch) return setError("Select at least one market source.");

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
      setMessage("Scheduled market review created.");
      setForm((current) => ({ ...initialForm, profileId: current.profileId }));
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the scheduled market review.");
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
      setError(err instanceof Error ? err.message : "Scheduled market review failed.");
    } finally {
      setWorkingId(null);
    }
  }

  async function toggleSearch(item: SavedSearch) {
    clearNotices();
    setWorkingId(item.id);
    try {
      await api(`/api/automation/saved-searches/${item.id}`, { method: "PATCH", body: JSON.stringify({ active: !item.active }) });
      setMessage(`${item.name} ${item.active ? "paused" : "resumed"}.`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update the scheduled market review.");
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
      setError(err instanceof Error ? err.message : "Unable to delete the scheduled market review.");
    } finally {
      setWorkingId(null);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="AUTOMATION"
        title="Commission recurring market reviews without adding noise"
        description="Create focused searches, choose the cadence and sources, run them on demand, and keep recurring market discovery aligned to a career profile."
        actions={<button className="secondary" type="button" disabled={loading} onClick={() => void load()}>{loading ? "Refreshing…" : "Refresh"}</button>}
      />

      <MetricStrip
        ariaLabel="Automation summary"
        items={[
          { label: "Scheduled reviews", value: items.length, detail: "configured searches" },
          { label: "Active", value: activeCount, detail: "eligible for scheduling" },
          { label: "Latest signals", value: totalMatches, detail: "across completed reviews" },
        ]}
      />

      {error ? <Notice title="Automation needs attention" tone="error"><p>{error}</p></Notice> : null}
      {message ? <Notice title="Automation updated" tone="success"><p>{message}</p></Notice> : null}

      <div className="two-col">
        <form className="card" onSubmit={createSearch}>
          <SectionHeader eyebrow="NEW MARKET REVIEW" title="Create a recurring search" description="Keep the search mandate clear and the threshold high enough to protect attention." />
          <label>Career profile</label>
          <select value={form.profileId} onChange={(event) => setForm({ ...form, profileId: event.target.value })}>{profiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.name}</option>)}</select>
          <label>Review name</label><input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          <label>Target titles, one per line</label><textarea rows={7} value={form.titles} onChange={(event) => setForm({ ...form, titles: event.target.value })} />
          <div className="two-col"><div><label>Location</label><input value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} /></div><div><label>Cadence</label><select value={form.cadence} onChange={(event) => setForm({ ...form, cadence: event.target.value })}><option value="daily">Daily</option><option value="weekdays">Weekdays</option><option value="weekly">Weekly</option><option value="manual">Manual only</option></select></div></div>
          <label>Minimum alignment score: {form.minimumScore}</label><input type="range" min="0" max="100" value={form.minimumScore} onChange={(event) => setForm({ ...form, minimumScore: Number(event.target.value) })} />
          <fieldset>
            <legend>Market sources</legend>
            <label className="resume-checkbox-row"><input type="checkbox" checked={form.useCatalog} onChange={(event) => setForm({ ...form, useCatalog: event.target.checked })} /> Direct employer sources</label>
            <label className="resume-checkbox-row"><input type="checkbox" checked={form.useRemotive} onChange={(event) => setForm({ ...form, useRemotive: event.target.checked })} /> Remote feed</label>
            <label className="resume-checkbox-row"><input type="checkbox" checked={form.useJsearch} onChange={(event) => setForm({ ...form, useJsearch: event.target.checked })} /> Broad-market provider</label>
          </fieldset>
          <button disabled={saving || !profiles.length}>{saving ? "Saving…" : "Save scheduled review"}</button>
        </form>

        <section className="card">
          <SectionHeader eyebrow="OPERATING PRINCIPLES" title="Transparent automation" />
          <p className="muted">Active reviews are eligible for the configured schedule. Manual reviews run immediately and update the latest signal count and timestamp.</p>
          <ul>
            <li>Higher alignment thresholds produce a smaller, more selective opportunity set.</li>
            <li>Provider availability can vary; one unavailable source should not erase successful results from others.</li>
            <li>New high-alignment opportunities appear in CareerNavIQ updates.</li>
          </ul>
        </section>
      </div>

      <section className="card">
        <SectionHeader eyebrow="SCHEDULED REVIEWS" title="Market intelligence automation" actions={<span className="badge">{activeCount} active</span>} />
        {loading ? <p className="muted">Loading scheduled reviews…</p> : items.map((item) => (
          <article className="automation-row" key={item.id}>
            <div>
              <div className="row wrap"><strong>{item.name}</strong><span className={`badge ${item.active ? "" : "warning-badge"}`}>{item.active ? "Active" : "Paused"}</span><span className="badge">{item.cadence}</span></div>
              <small>{item.titles.join(" · ")} · {item.location} · minimum score {item.minimum_score}</small>
              <small>Sources: {[item.use_catalog && "direct employers", item.use_remotive && "remote feed", item.use_jsearch && "broad market"].filter(Boolean).join(" · ") || "none"}</small>
              <small>Last review: {item.last_run_at ? new Date(item.last_run_at).toLocaleString() : "Never"} · {item.last_result_count} selected signals</small>
            </div>
            <div className="row wrap"><button type="button" disabled={workingId === item.id} onClick={() => void runSearch(item)}>{workingId === item.id ? "Working…" : "Run now"}</button><button type="button" className="secondary" disabled={workingId === item.id} onClick={() => void toggleSearch(item)}>{item.active ? "Pause" : "Resume"}</button><button type="button" className="danger" disabled={workingId === item.id} onClick={() => void deleteSearch(item)}>Delete</button></div>
          </article>
        ))}
        {!loading && !items.length ? <p className="muted">No scheduled market reviews yet. Create one above to begin.</p> : null}
      </section>
    </>
  );
}
