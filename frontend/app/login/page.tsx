"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BrandCompass } from "@/components/BrandCompass";
import { api } from "@/lib/api";
import { startAuthenticatedSession } from "@/lib/sessionStorage";

const capabilities = [
  ["01", "Positioning", "Keep your executive profile, evidence, and résumé strategy aligned."],
  ["02", "Market intelligence", "Evaluate opportunities against the mandate for your next move."],
  ["03", "Opportunity management", "Manage active pursuits, decisions, contacts, and follow-up in one place."],
  ["04", "Interview advisory", "Prepare stronger executive narratives for the conversations that matter."],
] as const;

export default function LoginPage() {
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
      const result = await api("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: email.trim(), password }),
      });
      startAuthenticatedSession(result.access_token);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
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
          <p className="eyebrow">PRIVATE EXECUTIVE CAREER OFFICE</p>
          <h1>Your next move. Managed with intelligence.</h1>
          <p className="auth-lead">
            CareerNavIQ brings positioning, market intelligence, opportunity management,
            relationships, and interview preparation into one disciplined executive workspace.
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

          <p className="eyebrow">SECURE ACCESS</p>
          <h1>Welcome back</h1>
          <p className="auth-card-intro">Access your private executive career workspace.</p>

          <form onSubmit={submit} className="auth-form">
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
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  required
                />
              </div>

            {error ? <p className="auth-error" role="alert">{error}</p> : null}

            <button className="auth-submit" type="submit" disabled={busy}>
              {busy ? "Opening workspace…" : "Enter CareerNavIQ"}
            </button>
          </form>

          <p className="auth-switch"><Link href="/forgot-password">Forgot your password?</Link></p>
          <div className="auth-divider" />
          <p className="auth-switch">New to CareerNavIQ? <Link href="/register">Create your account</Link></p>
          <p className="auth-security-note"><span className="auth-security-dot" />Your saved career information remains private to your account.</p>
        </div>
      </section>
    </div>
  );
}
