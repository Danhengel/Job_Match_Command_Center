"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    try {
      const profile = await api("/api/profiles", {
        method: "POST",
        body: JSON.stringify({
          name,
          home_location: location,
          remote_preferred: remotePreferred,
          hybrid_preferred: hybridPreferred,
          radius_miles: radius ? Number(radius) : 0,
          salary_min: salary ? Number(salary) : null,
          salary_target: salary ? Number(salary) : null,
          target_titles: titles
            .split("\n")
            .map((value) => value.trim())
            .filter(Boolean),
          priority_keywords: keywords
            .split("\n")
            .map((value) => value.trim())
            .filter(Boolean),
          exclusion_keywords: exclusions
            .split("\n")
            .map((value) => value.trim())
            .filter(Boolean),
        }),
      });
      router.push(`/profiles/${profile.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save profile");
    }
  }

  return (
    <div className="card">
      <h1>Create Career Profile</h1>
      <p className="muted">
        Start with a blank profile and add only the information that applies to you.
      </p>
      <form onSubmit={save}>
        <label>Profile name</label>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="For example: Primary profile or Marketing roles"
          required
        />

        <label>Home location</label>
        <input
          value={location}
          onChange={(event) => setLocation(event.target.value)}
          placeholder="City, state, or country"
        />

        <div className="row wrap">
          <label className="inline-check">
            <input
              type="checkbox"
              checked={remotePreferred}
              onChange={(event) => setRemotePreferred(event.target.checked)}
            />
            {" "}Remote preferred
          </label>
          <label className="inline-check">
            <input
              type="checkbox"
              checked={hybridPreferred}
              onChange={(event) => setHybridPreferred(event.target.checked)}
            />
            {" "}Hybrid preferred
          </label>
        </div>

        <label>Search radius in miles</label>
        <input
          type="number"
          min="0"
          max="500"
          value={radius}
          onChange={(event) => setRadius(event.target.value)}
          placeholder="Optional"
        />

        <label>Minimum or target salary</label>
        <input
          type="number"
          min="0"
          value={salary}
          onChange={(event) => setSalary(event.target.value)}
          placeholder="Optional"
        />

        <label>Target titles, one per line</label>
        <textarea
          rows={6}
          value={titles}
          onChange={(event) => setTitles(event.target.value)}
          placeholder={"Target role title\nAnother target role"}
        />

        <label>Priority keywords, one per line</label>
        <textarea
          rows={6}
          value={keywords}
          onChange={(event) => setKeywords(event.target.value)}
          placeholder={"Skill, industry, or responsibility\nAnother priority"}
        />

        <label>Exclude keywords, one per line</label>
        <textarea
          rows={4}
          value={exclusions}
          onChange={(event) => setExclusions(event.target.value)}
          placeholder={"Roles or terms you do not want\nAnother exclusion"}
        />

        {error ? <p className="error">{error}</p> : null}
        <button type="submit">Create profile</button>
      </form>
    </div>
  );
}
