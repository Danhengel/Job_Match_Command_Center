"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { MetricStrip, Notice, PageHeader, SectionHeader } from "@/components/ui";
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

  useEffect(() => {
    load().catch((e) => setError(e instanceof Error ? e.message : "Unable to load interview advisory."));
  }, []);

  const upcoming = useMemo(() => events.filter((item) => !item.completed && new Date(item.starts_at).getTime() >= Date.now()), [events]);
  const visible = useMemo(() => events.filter((item) => showCompleted || !item.completed), [events, showCompleted]);
  const nextEvent = upcoming[0] || null;
  const thisWeek = upcoming.filter((item) => daysUntil(item.starts_at) <= 7).length;

  async function create(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api("/api/recruiting/interviews", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          application_id: Number(form.application_id),
          reminder_minutes: Number(form.reminder_minutes),
          starts_at: new Date(form.starts_at).toISOString(),
        }),
      });
      setForm((current) => ({ ...emptyForm, application_id: current.application_id }));
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to add interview event.");
    } finally {
      setBusy(false);
    }
  }

  async function complete(item: InterviewEvent) {
    await api(`/api/recruiting/interviews/${item.id}`, { method: "PATCH", body: JSON.stringify({ completed: !item.completed }) });
    await load();
  }

  function appFor(id: number) {
    return applications.find((item) => item.id === id);
  }

  return (
    <>
      <PageHeader
        eyebrow="INTERVIEW ADVISORY"
        title="Prepare every senior-level conversation with intention"
        description="Keep recruiter calls, interviews, preparation, meeting details, and follow-up connected to the opportunity under consideration."
        actions={<div className="row wrap"><Link className="button secondary" href="/applications">Opportunity portfolio</Link><Link className="button" href="/crm">Relationship network</Link></div>}
      />

      <MetricStrip
        ariaLabel="Interview advisory summary"
        items={[
          { label: "Upcoming", value: upcoming.length, detail: "active conversations" },
          { label: "This week", value: thisWeek, detail: "events to prepare for" },
          { label: "Next event", value: nextEvent ? Math.max(0, daysUntil(nextEvent.starts_at)) : "—", detail: nextEvent ? "days away" : "nothing scheduled" },
          { label: "Completed", value: events.filter((item) => item.completed).length, detail: "closed events" },
        ]}
      />

      {error ? <Notice title="Interview advisory needs attention" tone="error"><p>{error}</p></Notice> : null}

      <div className="interview-layout executive-interview-layout">
        <form className="studio-panel interview-form" onSubmit={create}>
          <SectionHeader eyebrow="SCHEDULE" title="Add an interview or recruiter conversation" description="Capture the meeting once, then keep preparation and follow-up attached to the opportunity." />
          <label>Opportunity</label>
          <select value={form.application_id} onChange={(event) => setForm({ ...form, application_id: event.target.value })}>
            {applications.map((app) => <option key={app.id} value={app.id}>{app.job.company} — {app.job.title}</option>)}
          </select>
          <div className="interview-form-grid">
            <div><label>Conversation type</label><select value={form.event_type} onChange={(event) => setForm({ ...form, event_type: event.target.value })}>{["recruiter call", "interview", "second interview", "final interview", "follow-up", "offer deadline"].map((value) => <option key={value}>{value}</option>)}</select></div>
            <div><label>Reminder</label><select value={form.reminder_minutes} onChange={(event) => setForm({ ...form, reminder_minutes: Number(event.target.value) })}><option value={30}>30 minutes</option><option value={60}>1 hour</option><option value={1440}>1 day</option><option value={2880}>2 days</option></select></div>
          </div>
          <label>Title</label><input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
          <label>Start</label><input type="datetime-local" value={form.starts_at} onChange={(event) => setForm({ ...form, starts_at: event.target.value })} />
          <label>Location</label><input value={form.location} placeholder="Teams, Zoom, office, or phone" onChange={(event) => setForm({ ...form, location: event.target.value })} />
          <label>Meeting URL</label><input value={form.meeting_url} onChange={(event) => setForm({ ...form, meeting_url: event.target.value })} />
          <label>Preparation brief</label><textarea rows={4} value={form.notes} placeholder="Interviewers, decision criteria, stories to use, questions to ask, and follow-up plan" onChange={(event) => setForm({ ...form, notes: event.target.value })} />
          <button disabled={busy || !form.application_id || !form.starts_at}>{busy ? "Saving…" : "Add conversation"}</button>
        </form>

        <section className="studio-panel interview-priority executive-interview-priority">
          <p className="eyebrow">NEXT CONVERSATION</p>
          {nextEvent ? (
            <>
              <span className="badge">{nextEvent.event_type}</span>
              <h2>{nextEvent.title}</h2>
              <p className="muted">{new Date(nextEvent.starts_at).toLocaleString()}</p>
              <p>{nextEvent.notes || "Review the opportunity, alignment evidence, executive stories, and questions before the conversation."}</p>
              <div className="row wrap">{nextEvent.meeting_url ? <a className="button" href={nextEvent.meeting_url} target="_blank" rel="noreferrer">Join meeting</a> : null}<Link className="button secondary" href={`/applications/${nextEvent.application_id}`}>Review opportunity</Link></div>
            </>
          ) : (
            <><h2>No upcoming interviews</h2><p className="muted">Add a recruiter call or interview when an opportunity advances.</p></>
          )}
          <div className="interview-checklist">
            <strong>Executive preparation checklist</strong>
            <span>Review the role, mandate, and decision criteria</span>
            <span>Select three quantified leadership stories</span>
            <span>Prepare questions that test scope, culture, and authority</span>
            <span>Confirm logistics and post-interview follow-up</span>
          </div>
        </section>
      </div>

      <section className="dashboard-panel executive-interview-timeline-panel">
        <SectionHeader
          eyebrow="SCHEDULE"
          title="Interview and follow-up calendar"
          description="A clean chronology of active conversations and completed events."
          actions={<label className="resume-checkbox-row"><input type="checkbox" checked={showCompleted} onChange={(event) => setShowCompleted(event.target.checked)} /> Show completed</label>}
        />
        <div className="interview-timeline">
          {visible.map((item) => {
            const app = appFor(item.application_id);
            return (
              <article className={`interview-event-card ${item.completed ? "completed" : ""}`} key={item.id}>
                <div className="interview-date"><strong>{new Date(item.starts_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</strong><span>{new Date(item.starts_at).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}</span></div>
                <div>
                  <div className="row wrap"><span className="badge">{item.event_type}</span>{item.completed ? <span className="badge">Completed</span> : null}</div>
                  <h3>{item.title}</h3>
                  <p className="muted">{app ? `${app.job.company} — ${app.job.title}` : "Opportunity"}</p>
                  {item.location ? <small>{item.location}</small> : null}
                  {item.notes ? <p>{item.notes}</p> : null}
                </div>
                <div className="interview-event-actions">
                  {item.meeting_url ? <a className="button secondary" href={item.meeting_url} target="_blank" rel="noreferrer">Join</a> : null}
                  <Link className="button secondary" href={`/applications/${item.application_id}`}>Review</Link>
                  <button onClick={() => complete(item)}>{item.completed ? "Reopen" : "Complete"}</button>
                </div>
              </article>
            );
          })}
          {!visible.length ? <p className="muted">No interview events yet.</p> : null}
        </div>
      </section>
    </>
  );
}
