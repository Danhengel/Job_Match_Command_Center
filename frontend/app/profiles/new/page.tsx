"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ExecutivePanel, Notice, PageHeader, SectionHeader } from "@/components/ui";
import { api } from "@/lib/api";

export default function NewProfile() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [titles, setTitles] = useState("");
  const [keywords, setKeywords] = useState("");
  const [exclusions, setExclusions] = useState("");
  const [salary, setSalary] = useState("");
  const [remotePreferred, setRemotePreferred] = useState(false);
  const [hybridPreferred, setHybridPreferred] = useState(false);
  const [radius, setRadius] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      const profile = await api("/api/profiles", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          home_location: location.trim(),
          remote_preferred: remotePreferred,
          hybrid_preferred: hybridPreferred,
          radius_miles: radius ? Number(radius) : 0,
          salary_min: salary ? Number(salary) : null,
          salary_target: salary ? Number(salary) : null,
          target_titles: titles.split("\n").map((value) => value.trim()).filter(Boolean),
          priority_keywords: keywords.split("\n").map((value) => value.trim()).filter(Boolean),
          exclusion_keywords: exclusions.split("\n").map((value) => value.trim()).filter(Boolean),
        }),
      });
      router.push(`/profiles/${profile.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save career profile");
      setSaving(false);
    }
  }

  return <>
    <PageHeader
      eyebrow="CAREER PROFILE"
      title="Define the mandate for your next move"
      description="Set the roles, geography, compensation, and selection criteria CareerNavIQ should use when evaluating your market."
      actions={<Link className="button secondary" href="/profiles">Back to profiles</Link>}
    />

    {error ? <Notice title="Profile needs attention" tone="error"><p>{error}</p></Notice> : null}

    <form className="profile-edit-form" onSubmit={save}>
      <ExecutivePanel className="profile-edit-section">
        <SectionHeader eyebrow="01 · SEARCH MANDATE" title="Profile foundation" description="Name this career direction and establish the market CareerNavIQ should evaluate." />
        <div className="profile-edit-two-column">
          <div><label htmlFor="profile-name">Profile name</label><input id="profile-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Commercial lending leadership" required /></div>
          <div><label htmlFor="home-location">Home location</label><input id="home-location" value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Tampa, FL" /></div>
        </div>
      </ExecutivePanel>

      <ExecutivePanel className="profile-edit-section">
        <SectionHeader eyebrow="02 · WORK PARAMETERS" title="Geography and compensation" description="Set the flexibility and compensation threshold that matter to the decision." />
        <div className="profile-preference-grid">
          <label className="profile-preference-card" htmlFor="remote-preferred">
            <span><strong>Remote preferred</strong><small>Include fully remote opportunities.</small></span>
            <input id="remote-preferred" type="checkbox" checked={remotePreferred} onChange={(event) => setRemotePreferred(event.target.checked)} />
          </label>
          <label className="profile-preference-card" htmlFor="hybrid-preferred">
            <span><strong>Hybrid preferred</strong><small>Include roles combining office and remote work.</small></span>
            <input id="hybrid-preferred" type="checkbox" checked={hybridPreferred} onChange={(event) => setHybridPreferred(event.target.checked)} />
          </label>
        </div>
        <div className="profile-edit-two-column">
          <div><label htmlFor="search-radius">Local market radius</label><input id="search-radius" type="number" min="0" max="500" value={radius} onChange={(event) => setRadius(event.target.value)} placeholder="50" /></div>
          <div><label htmlFor="target-salary">Minimum or target salary</label><input id="target-salary" type="number" min="0" step="1000" value={salary} onChange={(event) => setSalary(event.target.value)} placeholder="180000" /></div>
        </div>
      </ExecutivePanel>

      <ExecutivePanel className="profile-edit-section">
        <SectionHeader eyebrow="03 · SELECTION CRITERIA" title="Opportunity filters" description="Define the signals CareerNavIQ should prioritize and the opportunities it should set aside." />
        <div className="profile-edit-textareas">
          <div><label htmlFor="target-titles">Target titles</label><textarea id="target-titles" rows={8} value={titles} onChange={(event) => setTitles(event.target.value)} placeholder={"Director of Loan Operations\nVP, Construction Lending"} /><small>One title per line</small></div>
          <div><label htmlFor="priority-keywords">Priority evidence</label><textarea id="priority-keywords" rows={8} value={keywords} onChange={(event) => setKeywords(event.target.value)} placeholder={"commercial lending\ncredit risk\nportfolio management"} /><small>One skill, industry, or responsibility per line</small></div>
          <div><label htmlFor="exclude-keywords">Exclude signals</label><textarea id="exclude-keywords" rows={8} value={exclusions} onChange={(event) => setExclusions(event.target.value)} placeholder={"entry-level\ncommission only"} /><small>One excluded term per line</small></div>
        </div>
      </ExecutivePanel>

      <footer className="profile-edit-save-bar">
        <div><strong>Career profile</strong><span>These settings drive future opportunity scoring and recurring market intelligence.</span></div>
        <div className="row wrap"><Link className="button secondary" href="/profiles">Cancel</Link><button type="submit" disabled={saving}>{saving ? "Saving profile…" : "Save career profile"}</button></div>
      </footer>
    </form>
  </>;
}
