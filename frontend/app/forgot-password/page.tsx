"use client";

import Link from "next/link";
import { useState } from "react";
import { BrandCompass } from "@/components/BrandCompass";
import { api } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setBusy(true);
    try {
      const result = await api("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email: email.trim() }),
      });
      setMessage(result.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to request a reset link");
    } finally {
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
          <p className="eyebrow">SECURE ACCOUNT RECOVERY</p>
          <h1>Get back to your career command center.</h1>
          <p>
            We’ll send a private, time-limited link so you can create a new password
            without exposing whether an email address is registered.
          </p>
        </div>
        <p className="auth-brand-footer">CareerNavIQ · Secure by design</p>
      </section>

      <section className="auth-form-panel">
        <div className="auth-card">
          <div className="auth-mobile-brand">
            <span className="auth-brand-mark"><BrandCompass /></span>
            <strong>CareerNavIQ</strong>
          </div>
          <p className="eyebrow">RESET YOUR PASSWORD</p>
          <h1>Forgot your password?</h1>
          <p className="auth-card-intro">
            Enter the email address associated with your account. We’ll send a secure reset link.
          </p>

          {message ? (
            <div className="auth-success" role="status">
              <strong>Check your email</strong>
              <span>{message}</span>
            </div>
          ) : (
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
              {error ? <p className="auth-error" role="alert">{error}</p> : null}
              <button className="auth-submit" type="submit" disabled={busy}>
                {busy ? "Sending…" : "Send reset link"}
              </button>
            </form>
          )}

          <p className="auth-switch"><Link href="/login">Return to sign in</Link></p>
          <p className="auth-security-note"><span className="auth-security-dot" />Reset links expire after 30 minutes.</p>
        </div>
      </section>
    </div>
  );
}
