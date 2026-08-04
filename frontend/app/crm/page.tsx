"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";

type Contact = { id: number; company: string; name: string; title: string; email: string; phone: string; linkedin_url: string; status: string; relationship_score: number; notes: string; last_contact_at: string | null; next_follow_up_at: string | null; created_at: string };
const emptyForm = { company: "", name: "", title: "", email: "", phone: "", linkedin_url: "", status: "new", relationship_score: 25, notes: "", next_follow_up_at: "" };

function due(contact: Contact) { return contact.next_follow_up_at && new Date(contact.next_follow_up_at).getTime() <= Date.now(); }

export default function RecruiterCRM() {
  const [items, setItems] = useState<Contact[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);

  async function load() { setItems(await api("/api/recruiting/recruiters")); }
  useEffect(() => { load().catch((e) => setError(e.message)); }, []);

  const filtered = useMemo(() => items.filter((item) => {
    const haystack = `${item.name} ${item.company} ${item.title} ${item.email}`.toLowerCase();
    return haystack.includes(query.toLowerCase()) && (statusFilter === "all" || item.status === statusFilter);
  }).sort((a,b) => Number(due(b)) - Number(due(a)) || b.relationship_score - a.relationship_score), [items, query, statusFilter]);

  const dueCount = items.filter(due).length;
  const activeCount = items.filter((item) => !["closed","inactive"].includes(item.status)).length;
  const strongCount = items.filter((item) => item.relationship_score >= 70).length;

  async function create(event: React.FormEvent) {
    event.preventDefault(); setError("");
    try {
      await api("/api/recruiting/recruiters", { method: "POST", body: JSON.stringify({ ...form, next_follow_up_at: form.next_follow_up_at ? new Date(form.next_follow_up_at).toISOString() : null }) });
      setForm(emptyForm); await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to save contact."); }
  }

  async function patch(id: number, payload: Record<string, unknown>) {
    setBusyId(id); setError("");
    try { await api(`/api/recruiting/recruiters/${id}`, { method: "PATCH", body: JSON.stringify(payload) }); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : "Unable to update contact."); }
    finally { setBusyId(null); }
  }

  async function remove(id: number) {
    if (!window.confirm("Delete this contact?")) return;
    await api(`/api/recruiting/recruiters/${id}`, { method: "DELETE" }); await load();
  }

  async function copyFollowUp(item: Contact) {
    const text = `Hi ${item.name.split(" ")[0]},\n\nI wanted to follow up regarding opportunities with ${item.company}. I remain very interested in roles where my background in lending operations, construction administration, portfolio governance, and process improvement could add value.\n\nPlease let me know if there is anything else I can provide.\n\nBest,\nDan`;
    await navigator.clipboard.writeText(text);
  }

  return <>
    <section className="executive-hero crm-hero"><div><p className="eyebrow">RECRUITER CRM</p><h1>Build relationships that move opportunities forward.</h1><p className="muted">Track recruiters and hiring managers, prioritize follow-ups, and keep every conversation connected to your career strategy.</p></div><div className="executive-actions"><Link className="button secondary" href="/applications">Applications</Link><Link className="button" href="/interviews">Interview Center</Link></div></section>

    <section className="interview-kpis"><article><span>Contacts</span><strong>{items.length}</strong><small>total relationships</small></article><article><span>Active</span><strong>{activeCount}</strong><small>open relationships</small></article><article><span>Follow-ups due</span><strong>{dueCount}</strong><small>need attention</small></article><article><span>Strong relationships</span><strong>{strongCount}</strong><small>score 70 or higher</small></article></section>

    {error ? <section className="resume-alert resume-alert-error"><strong>Action required</strong><span>{error}</span></section> : null}

    <div className="crm-layout">
      <form className="studio-panel crm-form" onSubmit={create}><p className="eyebrow">ADD CONTACT</p><h2>New recruiter or hiring manager</h2>
        <div className="interview-form-grid"><div><label>Company</label><input required value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} /></div><div><label>Name</label><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div></div>
        <label>Title</label><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <div className="interview-form-grid"><div><label>Email</label><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div><div><label>Phone</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div></div>
        <label>LinkedIn URL</label><input value={form.linkedin_url} onChange={(e) => setForm({ ...form, linkedin_url: e.target.value })} />
        <div className="interview-form-grid"><div><label>Status</label><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>{["new","contacted","responded","active","interviewing","closed","inactive"].map((value) => <option key={value}>{value}</option>)}</select></div><div><label>Next follow-up</label><input type="datetime-local" value={form.next_follow_up_at} onChange={(e) => setForm({ ...form, next_follow_up_at: e.target.value })} /></div></div>
        <label>Relationship priority: {form.relationship_score}</label><input type="range" min="0" max="100" value={form.relationship_score} onChange={(e) => setForm({ ...form, relationship_score: Number(e.target.value) })} />
        <label>Notes</label><textarea rows={5} value={form.notes} placeholder="How you met, relevant roles, last conversation, and next step" onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        <button>Save contact</button>
      </form>

      <section className="studio-panel crm-priority"><p className="eyebrow">RELATIONSHIP STRATEGY</p><h2>Work the right follow-ups first.</h2><p className="muted">Contacts are automatically ordered by overdue follow-up and then by your relationship priority score.</p><div className="interview-checklist"><strong>High-value follow-up rhythm</strong><span>Send a thank-you within 24 hours</span><span>Follow up after 5–7 business days</span><span>Share a concise, relevant update</span><span>Record the next action while context is fresh</span></div><p className="studio-trust-note">Relationship scores are your own prioritization tool. They are not predictions of recruiter influence or hiring outcomes.</p></section>
    </div>

    <section className="dashboard-panel">
      <div className="crm-toolbar"><div><p className="eyebrow">CONTACTS</p><h2>Relationship pipeline</h2></div><input value={query} placeholder="Search contacts" onChange={(e) => setQuery(e.target.value)} /><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option value="all">All statuses</option>{["new","contacted","responded","active","interviewing","closed","inactive"].map((value) => <option key={value}>{value}</option>)}</select></div>
      <div className="crm-contact-grid">{filtered.map((item) => <article className={`crm-contact-card ${due(item) ? "followup-due" : ""}`} key={item.id}><div className="row between"><div><div className="row wrap"><span className="badge">{item.status}</span>{due(item) ? <span className="badge warning-badge">Follow-up due</span> : null}</div><h3>{item.name}</h3><p className="muted">{item.title || "Contact"} · {item.company}</p></div><div className="crm-score"><strong>{item.relationship_score}</strong><small>priority</small></div></div>
        {item.notes ? <p>{item.notes}</p> : null}<div className="crm-meta">{item.email ? <a href={`mailto:${item.email}`}>{item.email}</a> : <span>No email</span>}{item.phone ? <span>{item.phone}</span> : null}{item.next_follow_up_at ? <span>Follow up {new Date(item.next_follow_up_at).toLocaleString()}</span> : <span>No follow-up scheduled</span>}</div>
        <div className="crm-inline-controls"><select value={item.status} disabled={busyId===item.id} onChange={(e) => patch(item.id,{status:e.target.value})}>{["new","contacted","responded","active","interviewing","closed","inactive"].map((value) => <option key={value}>{value}</option>)}</select><input type="datetime-local" disabled={busyId===item.id} onChange={(e) => e.target.value && patch(item.id,{next_follow_up_at:new Date(e.target.value).toISOString()})} /></div>
        <div className="row wrap">{item.email ? <button onClick={() => copyFollowUp(item)}>Copy follow-up</button> : null}{item.linkedin_url ? <a className="button secondary" href={item.linkedin_url} target="_blank" rel="noreferrer">LinkedIn</a> : null}<button className="secondary" onClick={() => patch(item.id,{last_contact_at:new Date().toISOString(),status:item.status==="new"?"contacted":item.status})}>Mark contacted</button><button className="danger" onClick={() => remove(item.id)}>Delete</button></div>
      </article>)}{!filtered.length ? <p className="muted">No contacts match these filters.</p> : null}</div>
    </section>
  </>;
}
