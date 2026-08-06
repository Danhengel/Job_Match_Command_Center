"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BrandCompass } from "@/components/BrandCompass";
import { api } from "@/lib/api";
import { startAuthenticatedSession } from "@/lib/sessionStorage";

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
    <div className="auth-page">
      <section className="auth-brand-panel">
        <Link href="/" className="auth-brand" aria-label="CareerNavIQ home">
          <span className="auth-brand-mark"><BrandCompass /></span>
          <span className="auth-brand-copy">
            <strong>CareerNavIQ</strong>
            <small>Private career intelligence.</small>
          </span>
        </Link>

        <div className="auth-message">
          <p className="eyebrow">THE PRIVATE CAREER OFFICE</p>
          <h1>Make the next chapter deliberate.</h1>
          <p>
            Bring your position, market intelligence, active pursuits, relationships,
            and pivotal conversations into one composed private office.
          </p>
          <div className="auth-feature-grid">
            <div><strong>Read the market</strong><span>Evaluate opportunities through your mandate.</span></div>
            <div><strong>Shape your position</strong><span>Build an evidence-led executive narrative.</span></div>
            <div><strong>Manage the portfolio</strong><span>Keep pursuits and commitments in view.</span></div>
            <div><strong>Advance with intent</strong><span>Prepare for every pivotal conversation.</span></div>
          </div>
        </div>

        <p className="auth-brand-footer">CareerNavIQ · Private intelligence for a career built with intent</p>
      </section>

      <section className="auth-form-panel">
        <div className="auth-card">
          <div className="auth-mobile-brand">
            <span className="auth-brand-mark"><BrandCompass /></span>
            <strong>CareerNavIQ</strong>
          </div>
          <p className="eyebrow">MEMBER ACCESS</p>
          <h1>Enter your private office</h1>
          <p className="auth-card-intro">Continue the work of building your next chapter.</p>

          <form onSubmit={submit} className="auth-form">
            <label htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              required
            />
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            {error ? <p className="auth-error" role="alert">{error}</p> : null}
            <button className="auth-submit" type="submit" disabled={busy}>
              {busy ? "Opening your office…" : "Enter CareerNavIQ"}
            </button>
          </form>

          <p className="auth-switch">New to CareerNavIQ? <Link href="/register">Request access</Link></p>
          <p className="auth-security-note"><span className="auth-security-dot" />Your career workspace is private to your account.</p>
        </div>
      </section>
    </div>
  );
}
