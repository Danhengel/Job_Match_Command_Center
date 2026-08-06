"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import styles from "./page.module.css";

type IconName =
  | "briefcase"
  | "user"
  | "location"
  | "home"
  | "building"
  | "target"
  | "dollar"
  | "info"
  | "plus"
  | "lock";

function Icon({ name, className }: { name: IconName; className?: string }) {
  const commonProps = {
    className,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  switch (name) {
    case "briefcase":
      return (
        <svg {...commonProps}>
          <rect x="3" y="7" width="18" height="12" rx="2" />
          <path d="M8 7V5.5A1.5 1.5 0 0 1 9.5 4h5A1.5 1.5 0 0 1 16 5.5V7" />
          <path d="M3 11.5c2.8 1.5 5.8 2.25 9 2.25s6.2-.75 9-2.25" />
          <path d="M10 13.5h4" />
        </svg>
      );
    case "user":
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="8" r="3.25" />
          <path d="M5.5 20a6.5 6.5 0 0 1 13 0" />
        </svg>
      );
    case "location":
      return (
        <svg {...commonProps}>
          <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
          <circle cx="12" cy="10" r="2.5" />
        </svg>
      );
    case "home":
      return (
        <svg {...commonProps}>
          <path d="m3 11 9-8 9 8" />
          <path d="M5.5 9.5V21h13V9.5" />
          <path d="M9.5 21v-6h5v6" />
        </svg>
      );
    case "building":
      return (
        <svg {...commonProps}>
          <path d="M4 21V5a2 2 0 0 1 2-2h8v18" />
          <path d="M14 9h4a2 2 0 0 1 2 2v10" />
          <path d="M8 7h2M8 11h2M8 15h2M17 13h1M17 17h1" />
          <path d="M2 21h20" />
        </svg>
      );
    case "target":
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="12" r="7" />
          <circle cx="12" cy="12" r="2.5" />
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
        </svg>
      );
    case "dollar":
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="12" r="9" />
          <path d="M15 8.5c-.7-.7-1.7-1-3-1-1.7 0-3 .9-3 2.3 0 3.7 6 1.6 6 5.4 0 1.4-1.3 2.3-3 2.3-1.3 0-2.5-.4-3.3-1.2M12 5.5v13" />
        </svg>
      );
    case "info":
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 11v5" />
          <path d="M12 8h.01" />
        </svg>
      );
    case "plus":
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v8M8 12h8" />
        </svg>
      );
    case "lock":
      return (
        <svg {...commonProps}>
          <rect x="5" y="10" width="14" height="11" rx="2" />
          <path d="M8 10V7a4 4 0 0 1 8 0v3" />
        </svg>
      );
  }
}

function PreferenceToggle({
  icon,
  label,
  checked,
  onChange,
}: {
  icon: "home" | "building";
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className={styles.preferenceCard}>
      <span className={styles.preferenceLabel}>
        <span className={styles.preferenceIcon}>
          <Icon name={icon} />
        </span>
        {label}
      </span>
      <input
        className={styles.toggleInput}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className={styles.toggleTrack} aria-hidden="true">
        <span className={styles.toggleThumb} />
      </span>
    </label>
  );
}

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

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSaving(true);

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
      setSaving(false);
    }
  }

  return (
    <section className={styles.page}>
      <div className={styles.panel}>
        <header className={styles.header}>
          <div className={styles.headerIcon}>
            <Icon name="briefcase" />
          </div>
          <div>
            <h1>Create Career Profile</h1>
            <p>
              Start with a blank profile and add only the information that applies to you.
            </p>
          </div>
        </header>

        <form className={styles.form} onSubmit={save}>
          <div className={styles.primaryGrid}>
            <div className={styles.fieldGroup}>
              <label htmlFor="profile-name">Profile name</label>
              <div className={styles.inputShell}>
                <Icon name="user" className={styles.inputIcon} />
                <input
                  id="profile-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Primary profile"
                  required
                />
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="home-location">Home location</label>
              <div className={styles.inputShell}>
                <Icon name="location" className={styles.inputIcon} />
                <input
                  id="home-location"
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                  placeholder="Tampa, FL"
                />
              </div>
            </div>
          </div>

          <div className={styles.preferenceDetailsGrid}>
            <div className={styles.preferenceGrid}>
              <PreferenceToggle
                icon="home"
                label="Remote preferred"
                checked={remotePreferred}
                onChange={setRemotePreferred}
              />
              <PreferenceToggle
                icon="building"
                label="Hybrid preferred"
                checked={hybridPreferred}
                onChange={setHybridPreferred}
              />
            </div>

            <div className={styles.numberGrid}>
              <div className={styles.fieldGroup}>
                <label htmlFor="search-radius">
                  Search radius in miles <span>(optional)</span>
                </label>
                <div className={styles.inputShell}>
                  <Icon name="target" className={styles.inputIcon} />
                  <input
                    id="search-radius"
                    type="number"
                    min="0"
                    max="500"
                    value={radius}
                    onChange={(event) => setRadius(event.target.value)}
                    placeholder="50"
                  />
                </div>
              </div>

              <div className={styles.fieldGroup}>
                <label htmlFor="target-salary">
                  Minimum or target salary <span>(optional)</span>
                </label>
                <div className={styles.inputShell}>
                  <Icon name="dollar" className={styles.inputIcon} />
                  <input
                    id="target-salary"
                    type="number"
                    min="0"
                    step="1000"
                    value={salary}
                    onChange={(event) => setSalary(event.target.value)}
                    placeholder="120000"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className={styles.textareaGrid}>
            <div className={styles.textareaCard}>
              <label htmlFor="target-titles">
                Target titles
                <Icon name="info" />
              </label>
              <textarea
                id="target-titles"
                rows={7}
                value={titles}
                onChange={(event) => setTitles(event.target.value)}
                placeholder={"Director of Loan Operations\nConstruction Lending Manager"}
              />
              <span className={styles.helperText}>one per line</span>
            </div>

            <div className={styles.textareaCard}>
              <label htmlFor="priority-keywords">
                Priority keywords
                <Icon name="info" />
              </label>
              <textarea
                id="priority-keywords"
                rows={7}
                value={keywords}
                onChange={(event) => setKeywords(event.target.value)}
                placeholder={"commercial lending\ncredit risk\nportfolio management"}
              />
              <span className={styles.helperText}>one per line</span>
            </div>

            <div className={styles.textareaCard}>
              <label htmlFor="exclude-keywords">
                Exclude keywords
                <Icon name="info" />
              </label>
              <textarea
                id="exclude-keywords"
                rows={7}
                value={exclusions}
                onChange={(event) => setExclusions(event.target.value)}
                placeholder={"entry-level\ncommission only"}
              />
              <span className={styles.helperText}>one per line</span>
            </div>
          </div>

          {error ? (
            <div className={styles.errorMessage} role="alert">
              {error}
            </div>
          ) : null}

          <div className={styles.actionArea}>
            <button className={styles.submitButton} type="submit" disabled={saving}>
              <Icon name="plus" />
              {saving ? "Creating profile..." : "Create profile"}
            </button>
            <p className={styles.editNote}>
              <Icon name="lock" />
              You can edit your profile anytime
            </p>
          </div>
        </form>
      </div>
    </section>
  );
}
