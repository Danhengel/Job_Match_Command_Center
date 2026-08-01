"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function RecruiterCRM() {
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState({
    company: "",
    name: "",
    title: "",
    email: "",
    phone: "",
    linkedin_url: "",
    status: "new",
    relationship_score: 0,
    notes: "",
  });
  const [error, setError] = useState("");

  async function load() {
    setItems(await api("/api/recruiting/recruiters"));
  }

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await api("/api/recruiting/recruiters", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setForm({
        company: "",
        name: "",
        title: "",
        email: "",
        phone: "",
        linkedin_url: "",
        status: "new",
        relationship_score: 0,
        notes: "",
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save recruiter.");
    }
  }

  async function remove(id: number) {
    await api(`/api/recruiting/recruiters/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <>
      <section className="hero">
        <p className="eyebrow">RELATIONSHIP MANAGEMENT</p>
        <h1>Recruiter CRM</h1>
        <p className="muted">
          Track recruiters, hiring managers, outreach, and follow-up priorities.
        </p>
      </section>

      <div className="two-col">
        <form className="card" onSubmit={create}>
          <h2>Add contact</h2>
          <label>Company</label>
          <input
            value={form.company}
            onChange={(e) => setForm({ ...form, company: e.target.value })}
          />
          <label>Name</label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <label>Title</label>
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <label>Email</label>
          <input
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <label>Phone</label>
          <input
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          <label>LinkedIn URL</label>
          <input
            value={form.linkedin_url}
            onChange={(e) =>
              setForm({ ...form, linkedin_url: e.target.value })
            }
          />
          <label>Relationship score: {form.relationship_score}</label>
          <input
            type="range"
            min="0"
            max="100"
            value={form.relationship_score}
            onChange={(e) =>
              setForm({
                ...form,
                relationship_score: Number(e.target.value),
              })
            }
          />
          <label>Notes</label>
          <textarea
            rows={5}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
          {error && <p className="error">{error}</p>}
          <button>Save contact</button>
        </form>

        <section className="card">
          <h2>Relationship guidance</h2>
          <p className="muted">
            Use the score as your own prioritization measure. It is not an
            automated prediction of recruiter influence or response.
          </p>
        </section>
      </div>

      <section className="card">
        <h2>Contacts</h2>
        {items.map((item) => (
          <article className="crm-row" key={item.id}>
            <div>
              <strong>{item.name}</strong>
              <small>
                {item.title} · {item.company}
              </small>
              <p>{item.notes}</p>
              <small>
                {item.email} {item.phone && `· ${item.phone}`}
              </small>
            </div>
            <div className="row wrap">
              <span className="badge">{item.relationship_score}/100</span>
              {item.linkedin_url && (
                <a
                  className="button secondary"
                  href={item.linkedin_url}
                  target="_blank"
                >
                  LinkedIn
                </a>
              )}
              <button className="danger" onClick={() => remove(item.id)}>
                Delete
              </button>
            </div>
          </article>
        ))}
        {!items.length && <p className="muted">No contacts yet.</p>}
      </section>
    </>
  );
}
