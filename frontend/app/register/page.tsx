"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    try {
      const result = await api("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ full_name: fullName, email, password }),
      });
      localStorage.setItem("token", result.access_token);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    }
  }

  return (
    <div className="auth-page">
      <section className="auth-brand-panel">
        <Link href="/register" className="auth-brand" aria-label="CareerNavIQ home">
          <span className="auth-brand-mark">CN</span>
          <span className="auth-brand-copy">
            <strong>CareerNavIQ</strong>
            <small>Navigate your next career move.</small>
          </span>
        </Link>

        <div className="auth-message">
          <p className="eyebrow">BUILD YOUR CAREER ADVANTAGE</p>
          <h1>Bring every part of your job search into focus.</h1>
          <p>
            Create your private workspace and turn scattered searches, résumés,
            applications, contacts, and interviews into one clear strategy.
          </p>
          <div className="auth-feature-grid">
            <div><strong>One career profile</strong><span>Keep your experience and goals organized.</span></div>
            <div><strong>Smarter matching</strong><span>Focus your time on stronger opportunities.</span></div>
            <div><strong>Application control</strong><span>See every next step in one pipeline.</span></div>
            <div><strong>Interview readiness</strong><span>Build and practice evidence-backed stories.</span></div>
          </div>
        </div>

        <p className="auth-brand-footer">CareerNavIQ · Find opportunities. Track progress. Achieve more.</p>
      </section>

      <section className="auth-form-panel">
        <div className="auth-card">
          <div className="auth-mobile-brand">
            <span className="auth-brand-mark">CN</span>
            <strong>CareerNavIQ</strong>
          </div>
          <p className="eyebrow">GET STARTED</p>
          <h1>Create your account</h1>
          <p className="auth-card-intro">Set up your private career command center.</p>

          <form onSubmit={submit} className="auth-form">
            <label htmlFor="full-name">Full name</label>
            <input
              id="full-name"
              autoComplete="name"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              required
            />
            <label htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            {error ? <p className="auth-error">{error}</p> : null}
            <button className="auth-submit" type="submit">Create my CareerNavIQ account</button>
          </form>

          <p className="auth-switch">Already have an account? <Link href="/login">Sign in</Link></p>
          <p className="auth-security-note"><span className="auth-security-dot" />Your workspace and saved career data remain private to your account.</p>
        </div>
      </section>
    </div>
  );
}
