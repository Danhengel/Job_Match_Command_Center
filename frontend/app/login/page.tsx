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
            <small>Intelligent career navigation.</small>
          </span>
        </Link>

        <div className="auth-message">
          <p className="eyebrow">YOUR CAREER NAVIGATION SYSTEM</p>
          <h1>Know where you’re going—and what comes next.</h1>
          <p>
            CareerNavIQ connects your direction, experience, opportunities, relationships,
            and interviews in one route you can follow.
          </p>
          <div className="auth-feature-grid">
            <div><strong>Set your direction</strong><span>Define the destination that fits you.</span></div>
            <div><strong>Explore possible routes</strong><span>Compare opportunities against your goals.</span></div>
            <div><strong>Track every waypoint</strong><span>Keep applications and next moves in view.</span></div>
            <div><strong>Navigate interviews</strong><span>Prepare for every important conversation.</span></div>
          </div>
        </div>

        <p className="auth-brand-footer">CareerNavIQ · Intelligent navigation for every career move</p>
      </section>

      <section className="auth-form-panel">
        <div className="auth-card">
          <div className="auth-mobile-brand">
            <span className="auth-brand-mark"><BrandCompass /></span>
            <strong>CareerNavIQ</strong>
          </div>
          <p className="eyebrow">WELCOME BACK</p>
          <h1>Open your navigation hub</h1>
          <p className="auth-card-intro">Continue from your last waypoint.</p>

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
              {busy ? "Opening your route…" : "Open CareerNavIQ"}
            </button>
          </form>

          <p className="auth-switch">New to CareerNavIQ? <Link href="/register">Start navigating</Link></p>
          <p className="auth-security-note"><span className="auth-security-dot" />Your career route is private to your account.</p>
        </div>
      </section>
    </div>
  );
}
