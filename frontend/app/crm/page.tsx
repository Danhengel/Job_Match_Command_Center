"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { MetricStrip, Notice, PageHeader, SectionHeader } from "@/components/ui";
import { api } from "@/lib/api";

type Contact = {
  id: number;
  company: string;
  name: string;
  title: string;
  email: string;
  phone: string;
  linkedin_url: string;
  status: string;
  relationship_score: number;
  notes: string;
  last_contact_at: string | null;
  next_follow_up_at: string | null;
  created_at: string;
};

const emptyForm = {
  company: "",
  name: "",
  title: "",
  email: "",
  phone: "",
  linkedin_url: "",
  status: "new",
  relationship_score: 25,
  notes: "",
  next_follow_up_at: "",
};

function due(contact: Contact) {
  return Boolean(contact.next_follow_up_at && new Date(contact.next_follow_up_at).getTime() <= Date.now());
}

export default function RecruiterCRM() {
  const [items, setItems] = useState<Contact[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);

  async function load() {
    setItems(await api("/api/recruiting/recruiters"));
  }

  useEffect(() => {
    load().catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Unable to load relationships."));
  }, []);

  const filtered = useMemo(
    () => items
      .filter((item) => {
        const haystack = `${item.name} ${item.company} ${item.title} ${item.email}`.toLowerCase();
        return haystack.includes(query.toLowerCase()) && (statusFilter === "all" || item.status === statusFilter);
      })
      .sort((left, right) => Number(due(right)) - Number(due(left)) || right.relationship_score - left.relationship_score),
    [items, query, statusFilter],
  );

  const dueCount = items.filter(due).length;
  const activeCount = items.filter((item) => !["closed", "inactive"].includes(item.status)).length;
  const strongCount = items.filter((item) => item.relationship_score >= 70).length;

  async function create(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    try {
      await api("/api/recruiting/recruiters", {
        method: "POST",
        body: JSON.stringify({ ...form, next_follow_up_at: form.next_follow_up_at ? new Date(form.next_follow_up_at).toISOString() : null }),
      });
      setForm(emptyForm);
      await load();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Unable to save relationship.");
    }
  }

  async function patch(id: number, payload: Record<string, unknown>) {
    setBusyId(id);
    setError("");
    try {
      await api(`/api/recruiting/recruiters/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
      await load();
    } catch (patchError) {
      setError(patchError instanceof Error ? patchError.message : "Unable to update relationship.");
    } finally {
      setBusyId(null);
    }
  }

  async function remove(id: number) {
    if (!window.confirm("Delete this contact?")) return;
    await api(`/api/recruiting/recruiters/${id}`, { method: "DELETE" });
    await load();
  }

  async function copyFollowUp(item: Contact) {
    const firstName = item.name.trim().split(/\s+/)[0] || "there";
    const text = `Hi ${firstName},\n\nI wanted to follow up regarding opportunities with ${item.company}. I remain interested in learning more about roles that may align with my background and current career goals.\n\nPlease let me know if there is any additional information I can provide.\n\nBest,\n[Your name]`;
    await navigator.clipboard.writeText(text);
  }

  return (
    <>
      <PageHeader
        eyebrow="RELATIONSHIP NETWORK"
        title="Manage the people who influence active opportunities"
        description="Track recruiters, hiring leaders, and professional contacts with clear follow-up timing, relationship priority, and conversation history."
        actions={<div className="row wrap"><Link className="button secondary" href="/applications">Opportunity portfolio</Link><Link className="button" href="/interviews">Interview advisory</Link></div>}
      />

      <MetricStrip
        ariaLabel="Relationship network summary"
        items={[
          { label: "Contacts", value: items.length, detail: "total relationships" },
          { label: "Active", value: activeCount, detail: "open relationships" },
          { label: "Follow-ups due", value: dueCount, detail: "need attention" },
          { label: "High priority", value: strongCount, detail: "score 70 or higher" },
        ]}
      />

      {error ? <Notice title="Relationship network needs attention" tone="error"><p>{error}</p></Notice> : null}

      <div className="crm-layout executive-crm-layout">
        <form className="studio-panel crm-form" onSubmit={create}>
          <SectionHeader eyebrow="ADD RELATIONSHIP" title="Recruiter or hiring contact" description="Capture enough context to make the next follow-up useful." />
          <div className="interview-form-grid">
            <div><label>Company</label><input required value={form.company} onChange={(event) => setForm({ ...form, company: event.target.value })} /></div>
            <div><label>Name</label><input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></div>
          </div>
          <label>Title</label><input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
          <div className="interview-form-grid">
            <div><label>Email</label><input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></div>
            <div><label>Phone</label><input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></div>
          </div>
          <label>LinkedIn URL</label><input value={form.linkedin_url} onChange={(event) => setForm({ ...form, linkedin_url: event.target.value })} />
          <div className="interview-form-grid">
            <div><label>Status</label><select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>{["new", "contacted", "responded", "active", "interviewing", "closed", "inactive"].map((value) => <option key={value}>{value}</option>)}</select></div>
            <div><label>Next follow-up</label><input type="datetime-local" value={form.next_follow_up_at} onChange={(event) => setForm({ ...form, next_follow_up_at: event.target.value })} /></div>
          </div>
          <label>Relationship priority: {form.relationship_score}</label>
          <input type="range" min="0" max="100" value={form.relationship_score} onChange={(event) => setForm({ ...form, relationship_score: Number(event.target.value) })} />
          <label>Context and notes</label><textarea rows={5} value={form.notes} placeholder="How you met, relevant roles, last conversation, and next action" onChange={(event) => setForm({ ...form, notes: event.target.value })} />
          <button>Save relationship</button>
        </form>

        <section className="studio-panel crm-priority">
          <p className="eyebrow">RELATIONSHIP STRATEGY</p>
          <h2>Put the right follow-ups first</h2>
          <p className="muted">Contacts are ordered by overdue follow-up and then by your own relationship priority score.</p>
          <div className="interview-checklist"><strong>High-value follow-up discipline</strong><span>Send a thank-you within 24 hours</span><span>Follow up after 5–7 business days when appropriate</span><span>Share a concise, relevant update rather than a generic check-in</span><span>Record the next action while context is fresh</span></div>
          <p className="studio-trust-note">Relationship scores are a private prioritization tool, not a prediction of recruiter influence or hiring outcomes.</p>
        </section>
      </div>

      <section className="dashboard-panel executive-relationship-panel">
        <SectionHeader
          eyebrow="RELATIONSHIPS"
          title="Contact portfolio"
          description="Prioritize overdue and high-value relationships without losing the context behind them."
          actions={<div className="portfolio-controls"><label><span>Search</span><input value={query} placeholder="Search contacts" onChange={(event) => setQuery(event.target.value)} /></label><label><span>Status</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="all">All statuses</option>{["new", "contacted", "responded", "active", "interviewing", "closed", "inactive"].map((value) => <option key={value}>{value}</option>)}</select></label></div>}
        />

        <div className="crm-contact-grid">
          {filtered.map((item) => (
            <article className={`crm-contact-card ${due(item) ? "followup-due" : ""}`} key={item.id}>
              <div className="row between">
                <div><div className="row wrap"><span className="badge">{item.status}</span>{due(item) ? <span className="badge warning-badge">Follow-up due</span> : null}</div><h3>{item.name}</h3><p className="muted">{item.title || "Contact"} · {item.company}</p></div>
                <div className="crm-score"><strong>{item.relationship_score}</strong><small>priority</small></div>
              </div>

              {item.notes ? <p>{item.notes}</p> : null}
              <div className="crm-meta">
                {item.email ? <a href={`mailto:${item.email}`}>{item.email}</a> : <span>No email</span>}
                {item.phone ? <span>{item.phone}</span> : null}
                {item.next_follow_up_at ? <span>Follow up {new Date(item.next_follow_up_at).toLocaleString()}</span> : <span>No follow-up scheduled</span>}
              </div>

              <div className="crm-inline-controls">
                <select value={item.status} disabled={busyId === item.id} onChange={(event) => patch(item.id, { status: event.target.value })}>{["new", "contacted", "responded", "active", "interviewing", "closed", "inactive"].map((value) => <option key={value}>{value}</option>)}</select>
                <input type="datetime-local" disabled={busyId === item.id} onChange={(event) => { if (event.target.value) void patch(item.id, { next_follow_up_at: new Date(event.target.value).toISOString() }); }} />
              </div>

              <div className="row wrap">
                {item.email ? <button onClick={() => copyFollowUp(item)}>Copy follow-up</button> : null}
                {item.linkedin_url ? <a className="button secondary" href={item.linkedin_url} target="_blank" rel="noreferrer">LinkedIn</a> : null}
                <button className="secondary" onClick={() => patch(item.id, { last_contact_at: new Date().toISOString(), status: item.status === "new" ? "contacted" : item.status })}>Mark contacted</button>
                <button className="danger" onClick={() => remove(item.id)}>Delete</button>
              </div>
            </article>
          ))}
          {!filtered.length ? <p className="muted">No contacts match these filters.</p> : null}
        </div>
      </section>
    </>
  );
}
