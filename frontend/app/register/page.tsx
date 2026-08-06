"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BrandCompass } from "@/components/BrandCompass";
import { api } from "@/lib/api";
import { startAuthenticatedSession } from "@/lib/sessionStorage";

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  const requirements = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
  };
  const passwordReady = Object.values(requirements).every(Boolean);

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
    <div className="auth-page">
      <section className="auth-brand-panel">
        <Link href="/" className="auth-brand" aria-label="CareerNavIQ home">
          <span className="auth-brand-mark"><BrandCompass /></span>
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
            <span className="auth-brand-mark"><BrandCompass /></span>
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
              placeholder="Your full name"
              required
            />
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
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            <div className="password-requirements" aria-label="Password requirements">
              <span className={requirements.length ? "met" : ""}>At least 8 characters</span>
              <span className={requirements.uppercase ? "met" : ""}>Uppercase letter</span>
              <span className={requirements.lowercase ? "met" : ""}>Lowercase letter</span>
              <span className={requirements.number ? "met" : ""}>Number</span>
            </div>
            {error ? <p className="auth-error" role="alert">{error}</p> : null}
            <button className="auth-submit" type="submit" disabled={busy || !passwordReady}>
              {busy ? "Creating your account…" : "Create my CareerNavIQ account"}
            </button>
          </form>

          <p className="auth-switch">Already have an account? <Link href="/login">Sign in</Link></p>
          <p className="auth-security-note"><span className="auth-security-dot" />Your workspace and saved career data remain private to your account.</p>
        </div>
      </section>
    </div>
  );
}
