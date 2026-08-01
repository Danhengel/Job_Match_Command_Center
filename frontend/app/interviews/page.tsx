"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

export default function InterviewCalendar() {
  const [events, setEvents] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [form, setForm] = useState({
    application_id: "",
    event_type: "interview",
    title: "Interview",
    starts_at: "",
    location: "",
    meeting_url: "",
    notes: "",
    reminder_minutes: 60,
  });

  async function load() {
    const [eventData, appData] = await Promise.all([
      api("/api/recruiting/interviews"),
      api("/api/applications"),
    ]);
    setEvents(eventData);
    setApplications(appData.applications);
    if (!form.application_id && appData.applications[0]) {
      setForm((current) => ({
        ...current,
        application_id: String(appData.applications[0].id),
      }));
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    await api("/api/recruiting/interviews", {
      method: "POST",
      body: JSON.stringify({
        ...form,
        application_id: Number(form.application_id),
        starts_at: new Date(form.starts_at).toISOString(),
      }),
    });
    await load();
  }

  async function complete(item: any) {
    await api(`/api/recruiting/interviews/${item.id}`, {
      method: "PATCH",
      body: JSON.stringify({ completed: !item.completed }),
    });
    await load();
  }

  return (
    <>
      <section className="hero">
        <p className="eyebrow">INTERVIEW OPERATIONS</p>
        <h1>Interview Calendar</h1>
        <p className="muted">
          Track recruiter calls, interviews, follow-ups, and offer deadlines.
        </p>
      </section>

      <div className="two-col">
        <form className="card" onSubmit={create}>
          <h2>Add event</h2>
          <label>Application</label>
          <select
            value={form.application_id}
            onChange={(e) =>
              setForm({ ...form, application_id: e.target.value })
            }
          >
            {applications.map((app) => (
              <option key={app.id} value={app.id}>
                {app.job.company} - {app.job.title}
              </option>
            ))}
          </select>
          <label>Event type</label>
          <select
            value={form.event_type}
            onChange={(e) =>
              setForm({ ...form, event_type: e.target.value })
            }
          >
            {[
              "recruiter call",
              "interview",
              "second interview",
              "final interview",
              "follow-up",
              "offer deadline",
            ].map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
          <label>Title</label>
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <label>Start</label>
          <input
            type="datetime-local"
            value={form.starts_at}
            onChange={(e) =>
              setForm({ ...form, starts_at: e.target.value })
            }
          />
          <label>Location</label>
          <input
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
          />
          <label>Meeting URL</label>
          <input
            value={form.meeting_url}
            onChange={(e) =>
              setForm({ ...form, meeting_url: e.target.value })
            }
          />
          <label>Notes</label>
          <textarea
            rows={4}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
          <button disabled={!form.application_id || !form.starts_at}>
            Add event
          </button>
        </form>

        <section className="card">
          <h2>Preparation workflow</h2>
          <p className="muted">
            Open the application command center to generate interview prep,
            executive talking points, and the full application package.
          </p>
        </section>
      </div>

      <section className="card">
        <h2>Upcoming events</h2>
        {events.map((event) => (
          <article
            className={`interview-row ${event.completed ? "read" : ""}`}
            key={event.id}
          >
            <div>
              <span className="badge">{event.event_type}</span>
              <strong>{event.title}</strong>
              <p>{new Date(event.starts_at).toLocaleString()}</p>
              <small>{event.location}</small>
            </div>
            <div className="row wrap">
              {event.meeting_url && (
                <a
                  className="button secondary"
                  href={event.meeting_url}
                  target="_blank"
                >
                  Join
                </a>
              )}
              <Link
                className="button secondary"
                href={`/applications/${event.application_id}`}
              >
                Application
              </Link>
              <button onClick={() => complete(event)}>
                {event.completed ? "Reopen" : "Complete"}
              </button>
            </div>
          </article>
        ))}
        {!events.length && <p className="muted">No interview events yet.</p>}
      </section>
    </>
  );
}
