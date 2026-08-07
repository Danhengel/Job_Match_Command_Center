"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Notice, PageHeader } from "@/components/ui";
import { api } from "@/lib/api";

type ProfileData = {
  name: string;
  home_location: string;
  remote_preferred: boolean;
  hybrid_preferred: boolean;
  radius_miles: number;
  salary_target: number | null;
  target_titles: string[];
  priority_keywords: string[];
  exclusion_keywords: string[];
};

export default function EditProfile({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [titles, setTitles] = useState("");
  const [keywords, setKeywords] = useState("");
  const [exclusions, setExclusions] = useState("");
  const [salary, setSalary] = useState("");
  const [radius, setRadius] = useState("");
  const [remote, setRemote] = useState(false);
  const [hybrid, setHybrid] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    api(`/api/profiles/${id}`)
      .then((profile: ProfileData) => {
        if (!active) return;
        setName(profile.name || "");
        setLocation(profile.home_location || "");
        setTitles((profile.target_titles || []).join("\n"));
        setKeywords((profile.priority_keywords || []).join("\n"));
        setExclusions((profile.exclusion_keywords || []).join("\n"));
        setSalary(profile.salary_target ? String(profile.salary_target) : "");
        setRadius(profile.radius_miles ? String(profile.radius_miles) : "");
        setRemote(Boolean(profile.remote_preferred));
        setHybrid(Boolean(profile.hybrid_preferred));
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : "Unable to load profile.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      await api(`/api/profiles/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: name.trim(),
          home_location: location.trim(),
          remote_preferred: remote,
          hybrid_preferred: hybrid,
          radius_miles: radius ? Number(radius) : 0,
          salary_min: salary ? Number(salary) : null,
          salary_target: salary ? Number(salary) : null,
          target_titles: titles.split("\n").map((value) => value.trim()).filter(Boolean),
          priority_keywords: keywords.split("\n").map((value) => value.trim()).filter(Boolean),
          exclusion_keywords: exclusions.split("\n").map((value) => value.trim()).filter(Boolean),
        }),
      });
      router.push(`/profiles/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update profile.");
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="PROFILE SETTINGS"
        title="Refine your career profile"
        description="Keep your target roles, geographic parameters, and selection criteria aligned with the opportunities you want CareerNavIQ to evaluate."
        actions={<Link className="button secondary" href={`/profiles/${id}`}>Back to profile</Link>}
      />

      {error ? <Notice title="Profile changes need attention" tone="error"><p>{error}</p></Notice> : null}

      {loading ? (
        <section className="card">
          <p className="eyebrow">LOADING</p>
          <h2>Loading profile settings…</h2>
          <p className="muted">CareerNavIQ is retrieving your current search strategy.</p>
        </section>
      ) : (
        <form className="profile-edit-form" onSubmit={save}>
          <section className="card profile-edit-section">
            <div className="profile-edit-heading">
              <span>01</span>
              <div><h2>Profile basics</h2><p>Name this career direction and set the location CareerNavIQ should use as its starting point.</p></div>
            </div>
            <div className="profile-edit-two-column">
              <div>
                <label htmlFor="edit-profile-name">Profile name</label>
                <input
                  id="edit-profile-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Primary career profile"
                  required
                />
              </div>
              <div>
                <label htmlFor="edit-home-location">Home location</label>
                <input
                  id="edit-home-location"
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                  placeholder="Tampa, FL"
                />
              </div>
            </div>
          </section>

          <section className="card profile-edit-section">
            <div className="profile-edit-heading">
              <span>02</span>
              <div><h2>Work preferences</h2><p>Control location flexibility, search distance, and compensation expectations.</p></div>
            </div>

            <div className="profile-preference-grid">
              <label className="profile-preference-card" htmlFor="edit-remote">
                <span><strong>Remote preferred</strong><small>Include fully remote opportunities.</small></span>
                <input id="edit-remote" type="checkbox" checked={remote} onChange={(event) => setRemote(event.target.checked)} />
              </label>
              <label className="profile-preference-card" htmlFor="edit-hybrid">
                <span><strong>Hybrid preferred</strong><small>Include roles combining office and remote work.</small></span>
                <input id="edit-hybrid" type="checkbox" checked={hybrid} onChange={(event) => setHybrid(event.target.checked)} />
              </label>
            </div>

            <div className="profile-edit-two-column">
              <div>
                <label htmlFor="edit-radius">Search radius in miles</label>
                <input
                  id="edit-radius"
                  type="number"
                  min="0"
                  max="500"
                  value={radius}
                  onChange={(event) => setRadius(event.target.value)}
                  placeholder="50"
                />
              </div>
              <div>
                <label htmlFor="edit-salary">Minimum or target salary</label>
                <input
                  id="edit-salary"
                  type="number"
                  min="0"
                  step="1000"
                  value={salary}
                  onChange={(event) => setSalary(event.target.value)}
                  placeholder="120000"
                />
              </div>
            </div>
          </section>

          <section className="card profile-edit-section">
            <div className="profile-edit-heading">
              <span>03</span>
              <div><h2>Selection criteria</h2><p>Update the signals CareerNavIQ should emphasize—and the terms it should set aside.</p></div>
            </div>

            <div className="profile-edit-textareas">
              <div>
                <label htmlFor="edit-titles">Target titles</label>
                <textarea
                  id="edit-titles"
                  rows={8}
                  value={titles}
                  onChange={(event) => setTitles(event.target.value)}
                  placeholder={"Director of Loan Operations\nConstruction Lending Manager"}
                />
                <small>One title per line</small>
              </div>
              <div>
                <label htmlFor="edit-keywords">Priority keywords</label>
                <textarea
                  id="edit-keywords"
                  rows={8}
                  value={keywords}
                  onChange={(event) => setKeywords(event.target.value)}
                  placeholder={"commercial lending\ncredit risk\nportfolio management"}
                />
                <small>One skill, industry, or responsibility per line</small>
              </div>
              <div>
                <label htmlFor="edit-exclusions">Exclude keywords</label>
                <textarea
                  id="edit-exclusions"
                  rows={8}
                  value={exclusions}
                  onChange={(event) => setExclusions(event.target.value)}
                  placeholder={"entry-level\ncommission only"}
                />
                <small>One excluded term per line</small>
              </div>
            </div>
          </section>

          <footer className="profile-edit-save-bar">
            <div><strong>Executive position changes</strong><span>Updates affect future opportunity scoring and standing market briefs.</span></div>
            <div className="row wrap">
              <Link className="button secondary" href={`/profiles/${id}`}>Cancel</Link>
              <button type="submit" disabled={saving}>{saving ? "Saving changes…" : "Save profile changes"}</button>
            </div>
          </footer>
        </form>
      )}
    </>
  );
}
