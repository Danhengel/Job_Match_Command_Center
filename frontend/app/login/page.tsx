"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    try {
      const result = await api("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      localStorage.setItem("token", result.access_token);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    }
  }

  return (
    <div className="auth-page">
      <section className="auth-brand-panel">
        <Link href="/login" className="auth-brand" aria-label="CareerNavIQ home">
          <span className="auth-brand-mark">CN</span>
          <span className="auth-brand-copy">
            <strong>CareerNavIQ</strong>
            <small>Navigate your next career move.</small>
          </span>
        </Link>

        <div className="auth-message">
          <p className="eyebrow">AI-POWERED CAREER WORKSPACE</p>
          <h1>Your next opportunity starts with a smarter plan.</h1>
          <p>
            Discover stronger-fit roles, tailor your résumé, organize applications,
            and prepare for interviews from one private command center.
          </p>
          <div className="auth-feature-grid">
            <div><strong>Find opportunities</strong><span>Search and prioritize better-fit roles.</span></div>
            <div><strong>Tailor your story</strong><span>Build stronger résumés and outreach.</span></div>
            <div><strong>Track progress</strong><span>Keep applications and follow-ups moving.</span></div>
            <div><strong>Prepare to win</strong><span>Practice interviews with focused guidance.</span></div>
          </div>
        </div>

        <p className="auth-brand-footer">CareerNavIQ · Your private career command center</p>
      </section>

      <section className="auth-form-panel">
        <div className="auth-card">
          <div className="auth-mobile-brand">
            <span className="auth-brand-mark">CN</span>
            <strong>CareerNavIQ</strong>
          </div>
          <p className="eyebrow">WELCOME BACK</p>
          <h1>Sign in</h1>
          <p className="auth-card-intro">Continue building your path to the right next opportunity.</p>

          <form onSubmit={submit} className="auth-form">
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
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            {error ? <p className="auth-error">{error}</p> : null}
            <button className="auth-submit" type="submit">Sign in to CareerNavIQ</button>
          </form>

          <p className="auth-switch">New to CareerNavIQ? <Link href="/register">Create an account</Link></p>
          <p className="auth-security-note"><span className="auth-security-dot" />Your career workspace is private to your account.</p>
        </div>
      </section>
    </div>
  );
}
