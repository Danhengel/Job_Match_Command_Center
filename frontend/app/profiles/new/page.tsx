"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import styles from "./page.module.css";

type IconProps = {
  children: ReactNode;
  className?: string;
  size?: number;
};

function Icon({ children, className, size = 22 }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      {children}
    </svg>
  );
}

function BriefcaseIcon({ className }: { className?: string }) {
  return (
    <Icon className={className} size={28}>
      <path
        d="M9 7V5.8C9 4.8 9.8 4 10.8 4h2.4c1 0 1.8.8 1.8 1.8V7M4.8 8h14.4A1.8 1.8 0 0 1 21 9.8v8.4a1.8 1.8 0 0 1-1.8 1.8H4.8A1.8 1.8 0 0 1 3 18.2V9.8A1.8 1.8 0 0 1 4.8 8Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M3 12.2c2.8 1.3 5.8 2 9 2s6.2-.7 9-2M10.2 14.2v1.6h3.6v-1.6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </Icon>
  );
}

function UserIcon() {
  return (
    <Icon size={21}>
      <path
        d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4.8 20c.7-3.4 3.2-5.2 7.2-5.2s6.5 1.8 7.2 5.2"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </Icon>
  );
}

function LocationIcon() {
  return (
    <Icon size={21}>
      <path
        d="M20 10c0 5-8 10-8 10S4 15 4 10a8 8 0 1 1 16 0Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
      <circle cx="12" cy="10" r="2.4" stroke="currentColor" strokeWidth="1.7" />
    </Icon>
  );
}

function TargetIcon() {
  return (
    <Icon size={21}>
      <circle cx="12" cy="12" r="7.5" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="12" cy="12" r="3.2" stroke="currentColor" strokeWidth="1.7" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
    </Icon>
  );
}

function DollarIcon() {
  return (
    <Icon size={21}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M15.5 8.3c-.8-.7-1.9-1.1-3.2-1.1-1.8 0-3 .9-3 2.2 0 3.3 6.2 1.5 6.2 5 0 1.4-1.3 2.4-3.3 2.4-1.5 0-2.8-.5-3.7-1.4M12 5.5v13"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </Icon>
  );
}

function HomeIcon() {
  return (
    <Icon size={25}>
      <path
        d="m3 11 9-7 9 7M5.5 10.5V20h5v-6h3v6h5v-9.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </Icon>
  );
}

function BuildingIcon() {
  return (
    <Icon size={25}>
      <path
        d="M4 21h16M6 21V8h8v13M14 21V4h4v17M9 11h2M9 15h2M16 8h.01M16 12h.01M16 16h.01"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </Icon>
  );
}

function InfoIcon() {
  return (
    <Icon size={16}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
      <path d="M12 10.7v5.1M12 7.7h.01" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
    </Icon>
  );
}

function PlusIcon() {
  return (
    <Icon size={20}>
      <circle cx="12" cy="12" r="9" fill="currentColor" />
      <path d="M12 8v8M8 12h8" stroke="#3157dd" strokeLinecap="round" strokeWidth="2" />
    </Icon>
  );
}

function LockIcon() {
  return (
    <Icon size={17}>
      <rect x="5" y="10" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8.5 10V7.5a3.5 3.5 0 1 1 7 0V10" stroke="currentColor" strokeLinecap="round" strokeWidth="1.6" />
    </Icon>
  );
}

type TextFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  icon: ReactNode;
  type?: "text" | "number";
  min?: string;
  max?: string;
  required?: boolean;
  optional?: boolean;
};

function TextField({
  id,
  label,
  value,
  onChange,
  placeholder,
  icon,
  type = "text",
  min,
  max,
  required,
  optional,
}: TextFieldProps) {
  return (
    <div className={styles.fieldGroup}>
      <label className={styles.fieldLabel} htmlFor={id}>
        {label}
        {optional ? <span> (optional)</span> : null}
      </label>
      <div className={styles.inputWrap}>
        <span className={styles.inputIcon}>{icon}</span>
        <input
          className={styles.textInput}
          id={id}
          max={max}
          min={min}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          required={required}
          type={type}
          value={value}
        />
      </div>
    </div>
  );
}

type ToggleCardProps = {
  checked: boolean;
  icon: ReactNode;
  id: string;
  label: string;
  onChange: (checked: boolean) => void;
};

function ToggleCard({ checked, icon, id, label, onChange }: ToggleCardProps) {
  return (
    <label className={`${styles.toggleCard} ${checked ? styles.toggleCardActive : ""}`} htmlFor={id}>
      <input
        checked={checked}
        className={styles.toggleInput}
        id={id}
        onChange={(event) => onChange(event.target.checked)}
        type="checkbox"
      />
      <span className={styles.toggleCardIcon}>{icon}</span>
      <span className={styles.toggleLabel}>{label}</span>
      <span aria-hidden="true" className={styles.switchTrack}>
        <span className={styles.switchThumb} />
      </span>
    </label>
  );
}

type TextAreaCardProps = {
  id: string;
  label: string;
  placeholder: string;
  rows?: number;
  value: string;
  onChange: (value: string) => void;
  helpText?: string;
};

function TextAreaCard({
  id,
  label,
  placeholder,
  rows = 8,
  value,
  onChange,
  helpText = "One per line",
}: TextAreaCardProps) {
  return (
    <div className={styles.textAreaCard}>
      <div className={styles.textAreaHeading}>
        <label htmlFor={id}>{label}</label>
        <span className={styles.infoIcon} title={`${label}: ${helpText.toLowerCase()}`}>
          <InfoIcon />
        </span>
      </div>
      <textarea
        className={styles.textArea}
        id={id}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={rows}
        value={value}
      />
      <p className={styles.helpText}>{helpText}</p>
    </div>
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
    <div className={styles.page}>
      <div aria-hidden="true" className={styles.ambientGlowOne} />
      <div aria-hidden="true" className={styles.ambientGlowTwo} />

      <form className={styles.profileCard} onSubmit={save}>
        <header className={styles.header}>
          <div className={styles.headerIcon}>
            <BriefcaseIcon />
          </div>
          <div>
            <p className={styles.eyebrow}>Career profile setup</p>
            <h1>Create Career Profile</h1>
            <p>Define what you are looking for so CareerNavIQ can surface stronger-fit opportunities.</p>
          </div>
        </header>

        <div className={styles.divider} />

        <section aria-labelledby="profile-basics" className={styles.section}>
          <div className={styles.sectionHeading}>
            <span>01</span>
            <div>
              <h2 id="profile-basics">Profile basics</h2>
              <p>Name this search and tell us where you want to work.</p>
            </div>
          </div>

          <div className={styles.basicsGrid}>
            <TextField
              icon={<UserIcon />}
              id="profile-name"
              label="Profile name"
              onChange={setName}
              placeholder="For example: Primary profile"
              required
              value={name}
            />
            <TextField
              icon={<LocationIcon />}
              id="home-location"
              label="Home location"
              onChange={setLocation}
              placeholder="For example: Tampa, FL"
              value={location}
            />
          </div>
        </section>

        <section aria-labelledby="work-preferences" className={styles.section}>
          <div className={styles.sectionHeading}>
            <span>02</span>
            <div>
              <h2 id="work-preferences">Work preferences</h2>
              <p>Set the location flexibility and compensation range that matter to you.</p>
            </div>
          </div>

          <div className={styles.preferenceGrid}>
            <div className={styles.toggleGrid}>
              <ToggleCard
                checked={remotePreferred}
                icon={<HomeIcon />}
                id="remote-preferred"
                label="Remote preferred"
                onChange={setRemotePreferred}
              />
              <ToggleCard
                checked={hybridPreferred}
                icon={<BuildingIcon />}
                id="hybrid-preferred"
                label="Hybrid preferred"
                onChange={setHybridPreferred}
              />
            </div>

            <div className={styles.compensationGrid}>
              <TextField
                icon={<TargetIcon />}
                id="search-radius"
                label="Search radius in miles"
                max="500"
                min="0"
                onChange={setRadius}
                optional
                placeholder="For example: 50"
                type="number"
                value={radius}
              />
              <TextField
                icon={<DollarIcon />}
                id="target-salary"
                label="Minimum or target salary"
                min="0"
                onChange={setSalary}
                optional
                placeholder="For example: 120000"
                type="number"
                value={salary}
              />
            </div>
          </div>
        </section>

        <section aria-labelledby="matching-priorities" className={styles.section}>
          <div className={styles.sectionHeading}>
            <span>03</span>
            <div>
              <h2 id="matching-priorities">Matching priorities</h2>
              <p>Give CareerNavIQ the signals it should prioritize—and the roles it should avoid.</p>
            </div>
          </div>

          <div className={styles.textAreaGrid}>
            <TextAreaCard
              id="target-titles"
              label="Target titles"
              onChange={setTitles}
              placeholder={"Director of Loan Operations\nConstruction Lending Manager"}
              value={titles}
            />
            <TextAreaCard
              id="priority-keywords"
              label="Priority keywords"
              onChange={setKeywords}
              placeholder={"commercial lending\ncredit risk\nportfolio management"}
              value={keywords}
            />
            <TextAreaCard
              id="exclude-keywords"
              label="Exclude keywords"
              onChange={setExclusions}
              placeholder={"entry-level\ncommission only"}
              value={exclusions}
            />
          </div>
        </section>

        {error ? (
          <div aria-live="polite" className={styles.errorMessage} role="alert">
            {error}
          </div>
        ) : null}

        <footer className={styles.footer}>
          <button className={styles.submitButton} disabled={saving} type="submit">
            <PlusIcon />
            <span>{saving ? "Creating profile…" : "Create profile"}</span>
          </button>
          <p>
            <LockIcon />
            You can edit your profile anytime
          </p>
        </footer>
      </form>
    </div>
  );
}
