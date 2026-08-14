"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
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
    <div className="auth-page executive-auth-page auth-page-centered">
      <section className="auth-form-panel auth-form-panel-centered">
        <div className="auth-centered-shell">
          <Link href="/" className="auth-centered-logo" aria-label="CareerNavIQ home">
            <img
              src="/careernaviq-logo-hero-transparent.png?v=20260813b"
              width="1920"
              height="547"
              alt="CareerNavIQ"
            />
          </Link>

          <div className="auth-card auth-card-large">
            <p className="eyebrow">WELCOME BACK</p>
            <h1>Access your CareerNavIQ workspace</h1>
            <p className="auth-card-intro">Continue your job search with clarity, focus, and momentum.</p>

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
                {busy ? "Opening workspace…" : "Enter CareerNavIQ"}
              </button>
            </form>

            <p className="auth-switch"><Link href="/forgot-password">Forgot your password?</Link></p>
            <div className="auth-divider" />
            <p className="auth-switch">New to CareerNavIQ? <Link href="/register">Create your account</Link></p>
            <p className="auth-security-note"><span className="auth-security-dot" />Your saved career information remains private to your account.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
