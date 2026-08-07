"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";

type Application = { id: number; status: string; job: { title: string; company: string } };
type InterviewEvent = { id: number; application_id: number; event_type: string; title: string; starts_at: string; ends_at: string | null; location: string; meeting_url: string; notes: string; reminder_minutes: number; completed: boolean };

const emptyForm = { application_id: "", event_type: "interview", title: "Interview", starts_at: "", location: "", meeting_url: "", notes: "", reminder_minutes: 60 };

function daysUntil(value: string) {
  return Math.ceil((new Date(value).getTime() - Date.now()) / 86400000);
}

export default function InterviewCenter() {
  const [events, setEvents] = useState<InterviewEvent[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [showCompleted, setShowCompleted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    const [eventData, appData] = await Promise.all([api("/api/recruiting/interviews"), api("/api/applications")]);
    const apps = appData.applications || [];
    setEvents(eventData || []);
    setApplications(apps);
    if (!form.application_id && apps[0]) setForm((current) => ({ ...current, application_id: String(apps[0].id) }));
  }

  useEffect(() => { load().catch((e) => setError(e.message)); }, []);

  const upcoming = useMemo(() => events.filter((item) => !item.completed && new Date(item.starts_at).getTime() >= Date.now()), [events]);
  const visible = useMemo(() => events.filter((item) => showCompleted || !item.completed), [events, showCompleted]);
  const nextEvent = upcoming[0] || null;
  const thisWeek = upcoming.filter((item) => daysUntil(item.starts_at) <= 7).length;

  async function create(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      await api("/api/recruiting/interviews", { method: "POST", body: JSON.stringify({ ...form, application_id: Number(form.application_id), reminder_minutes: Number(form.reminder_minutes), starts_at: new Date(form.starts_at).toISOString() }) });
      setForm((current) => ({ ...emptyForm, application_id: current.application_id }));
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to add event."); } finally { setBusy(false); }
  }

  async function complete(item: InterviewEvent) {
    await api(`/api/recruiting/interviews/${item.id}`, { method: "PATCH", body: JSON.stringify({ completed: !item.completed }) });
    await load();
  }

  function appFor(id: number) { return applications.find((item) => item.id === id); }

  return <>
    <section className="executive-hero interview-hero">
      <div><p className="eyebrow">INTERVIEW CENTER</p><h1>Prepare, perform, and follow through.</h1><p className="muted">Keep every interview, recruiter call, preparation task, and follow-up connected to the right opportunity.</p></div>
      <div className="executive-actions"><Link className="button secondary" href="/applications">Application pipeline</Link><Link className="button" href="/crm">Recruiter CRM</Link></div>
    </section>

    <section className="interview-kpis">
      <article><span>Upcoming</span><strong>{upcoming.length}</strong><small>active events</small></article>
      <article><span>This week</span><strong>{thisWeek}</strong><small>events to prepare for</small></article>
      <article><span>Next event</span><strong>{nextEvent ? Math.max(0, daysUntil(nextEvent.starts_at)) : "—"}</strong><small>{nextEvent ? "days away" : "nothing scheduled"}</small></article>
      <article><span>Completed</span><strong>{events.filter((item) => item.completed).length}</strong><small>closed events</small></article>
    </section>

    {error ? <section className="resume-alert resume-alert-error"><strong>Action required</strong><span>{error}</span></section> : null}

    <div className="interview-layout">
      <form className="studio-panel interview-form" onSubmit={create}>
        <p className="eyebrow">SCHEDULE</p><h2>Add interview event</h2>
        <label>Application</label><select value={form.application_id} onChange={(e) => setForm({ ...form, application_id: e.target.value })}>{applications.map((app) => <option key={app.id} value={app.id}>{app.job.company} — {app.job.title}</option>)}</select>
        <div className="interview-form-grid"><div><label>Event type</label><select value={form.event_type} onChange={(e) => setForm({ ...form, event_type: e.target.value })}>{["recruiter call","interview","second interview","final interview","follow-up","offer deadline"].map((value) => <option key={value}>{value}</option>)}</select></div><div><label>Reminder</label><select value={form.reminder_minutes} onChange={(e) => setForm({ ...form, reminder_minutes: Number(e.target.value) })}><option value={30}>30 minutes</option><option value={60}>1 hour</option><option value={1440}>1 day</option><option value={2880}>2 days</option></select></div></div>
        <label>Title</label><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <label>Start</label><input type="datetime-local" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} />
        <label>Location</label><input value={form.location} placeholder="Teams, Zoom, office, or phone" onChange={(e) => setForm({ ...form, location: e.target.value })} />
        <label>Meeting URL</label><input value={form.meeting_url} onChange={(e) => setForm({ ...form, meeting_url: e.target.value })} />
        <label>Preparation notes</label><textarea rows={4} value={form.notes} placeholder="Interviewers, key topics, stories to use, and questions to ask" onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        <button disabled={busy || !form.application_id || !form.starts_at}>{busy ? "Saving…" : "Add event"}</button>
      </form>

      <section className="studio-panel interview-priority">
        <p className="eyebrow">NEXT PRIORITY</p>
        {nextEvent ? <><span className="badge">{nextEvent.event_type}</span><h2>{nextEvent.title}</h2><p className="muted">{new Date(nextEvent.starts_at).toLocaleString()}</p><p>{nextEvent.notes || "Open the application workspace to review the role, alignment evidence, tailored résumé, and talking points."}</p><div className="row wrap">{nextEvent.meeting_url ? <a className="button" href={nextEvent.meeting_url} target="_blank" rel="noreferrer">Join meeting</a> : null}<Link className="button secondary" href={`/applications/${nextEvent.application_id}`}>Prepare application</Link></div></> : <><h2>No upcoming interviews</h2><p className="muted">Add a recruiter call or interview when an application advances.</p></>}
        <div className="interview-checklist"><strong>Preparation checklist</strong><span>Review the opportunity brief and alignment gaps</span><span>Select three quantified STAR stories</span><span>Prepare five questions for the interviewer</span><span>Confirm meeting details and follow-up plan</span></div>
      </section>
    </div>

    <section className="dashboard-panel">
      <div className="row between"><div><p className="eyebrow">CALENDAR</p><h2>Interview and follow-up timeline</h2></div><label className="resume-checkbox-row"><input type="checkbox" checked={showCompleted} onChange={(e) => setShowCompleted(e.target.checked)} /> Show completed</label></div>
      <div className="interview-timeline">{visible.map((item) => { const app = appFor(item.application_id); return <article className={`interview-event-card ${item.completed ? "completed" : ""}`} key={item.id}><div className="interview-date"><strong>{new Date(item.starts_at).toLocaleDateString(undefined,{month:"short",day:"numeric"})}</strong><span>{new Date(item.starts_at).toLocaleTimeString(undefined,{hour:"numeric",minute:"2-digit"})}</span></div><div><div className="row wrap"><span className="badge">{item.event_type}</span>{item.completed ? <span className="badge">Completed</span> : null}</div><h3>{item.title}</h3><p className="muted">{app ? `${app.job.company} — ${app.job.title}` : "Application"}</p>{item.location ? <small>{item.location}</small> : null}{item.notes ? <p>{item.notes}</p> : null}</div><div className="interview-event-actions">{item.meeting_url ? <a className="button secondary" href={item.meeting_url} target="_blank" rel="noreferrer">Join</a> : null}<Link className="button secondary" href={`/applications/${item.application_id}`}>Prepare</Link><button onClick={() => complete(item)}>{item.completed ? "Reopen" : "Complete"}</button></div></article>; })}{!visible.length ? <p className="muted">No interview events yet.</p> : null}</div>
    </section>
  </>;
}
