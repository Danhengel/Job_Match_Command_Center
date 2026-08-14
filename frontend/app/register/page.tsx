"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BrandCompass } from "@/components/BrandCompass";
import { api } from "@/lib/api";
import { startAuthenticatedSession } from "@/lib/sessionStorage";

const capabilities = [
  ["01", "Define the mandate", "Clarify the roles, market, compensation, and priorities that matter."],
  ["02", "Build market intelligence", "Evaluate opportunities through the lens of your executive profile."],
  ["03", "Manage active pursuits", "Keep applications, relationships, decisions, and follow-up organized."],
  ["04", "Strengthen your positioning", "Use your own evidence to prepare résumés, outreach, and interviews."],
] as const;

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);

    try {
      const result = await api("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          full_name: fullName.trim(),
          email: email.trim(),
          password,
        }),
      });
      startAuthenticatedSession(result.access_token);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
      setBusy(false);
    }
  }

  return (
    <div className="auth-page executive-auth-page">
      <section className="auth-brand-panel">
        <Link href="/" className="auth-brand" aria-label="CareerNavIQ home">
          <span className="auth-brand-mark"><BrandCompass /></span>
          <span className="auth-brand-copy">
            <strong>CareerNavIQ</strong>
            <small>Executive career intelligence</small>
          </span>
        </Link>

        <div className="auth-message">
          <p className="eyebrow">YOUR PRIVATE CAREER INTELLIGENCE PLATFORM</p>
          <h1>Make the next move more deliberate.</h1>
          <p className="auth-lead">
            Create a private workspace for the strategy, evidence, opportunities, relationships,
            and preparation behind your next executive move.
          </p>

          <div className="auth-capability-list" aria-label="CareerNavIQ capabilities">
            {capabilities.map(([number, title, description]) => (
              <article key={number}>
                <span>{number}</span>
                <div><strong>{title}</strong><p>{description}</p></div>
              </article>
            ))}
          </div>
        </div>

        <div className="auth-brand-footer">
          <span>Private by design.</span>
          <span>Built for consequential career decisions.</span>
        </div>
      </section>

      <section className="auth-form-panel">
        <div className="auth-card">
          <div className="auth-mobile-brand">
            <span className="auth-brand-mark"><BrandCompass /></span>
            <span><strong>CareerNavIQ</strong><small>Executive career intelligence</small></span>
          </div>

          <p className="eyebrow">PRIVATE ACCESS</p>
          <h1>Create your account</h1>
          <p className="auth-card-intro">Establish your private executive career workspace.</p>

          <form onSubmit={submit} className="auth-form">
            <label htmlFor="full-name">Full name</label>
              <div className="auth-premium-field">
                <span className="auth-field-icon auth-field-icon-person" aria-hidden="true">◇</span>
                <input
                  id="full-name"
                  autoComplete="name"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="Your full name"
                  required
                />
              </div>

            <label htmlFor="email">Email address</label>
              <div className="auth-premium-field">
                <span className="auth-field-icon" aria-hidden="true">@</span>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>

            <label htmlFor="password">Password</label>
              <div className="auth-premium-field">
                <span className="auth-field-icon auth-field-icon-key" aria-hidden="true">◆</span>
                <input
                  id="password"
                  type="password"
                  minLength={8}
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Create a secure password"
                  required
                />
              </div>
            <small className="auth-field-note">Use at least 8 characters.</small>

            {error ? <p className="auth-error" role="alert">{error}</p> : null}

            <button className="auth-submit" type="submit" disabled={busy}>
              {busy ? "Creating workspace…" : "Create CareerNavIQ account"}
            </button>
          </form>

          <div className="auth-divider" />
          <p className="auth-switch">Already have an account? <Link href="/login">Sign in</Link></p>
          <p className="auth-security-note"><span className="auth-security-dot" />Your saved career information remains private to your account.</p>
        </div>
      </section>
    </div>
  );
}
